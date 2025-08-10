import { Platform } from 'react-native';
import { Howl, Howler } from 'howler';
import * as FileSystem from 'expo-file-system';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useAuthStore } from '../../store';

export type AudioPlayerStatus = {
  isPlaying: boolean;
  positionSec: number;
  durationSec: number | null;
  isBuffering: boolean;
  error?: string;
};

export type AudioStatusListener = (status: AudioPlayerStatus) => void;

const WEB_CACHE_NAME = 'audio-cache-v1';
const MOBILE_CACHE_DIR = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}audio/` : undefined;

function getAudioQuality(): 'low' | 'medium' | 'high' {
  try {
    // Accessing store directly (outside React). Safe for reading current snapshot.
    return useAuthStore.getState().preferences.audioQuality || 'medium';
  } catch {
    return 'medium';
  }
}

function hashStringHex(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return Math.abs(hash).toString(16);
}

async function ensureMobileCacheDir(): Promise<void> {
  if (!MOBILE_CACHE_DIR) return;
  const info = await FileSystem.getInfoAsync(MOBILE_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MOBILE_CACHE_DIR, { intermediates: true });
  }
}

async function webFetchWithCache(url: string): Promise<Blob> {
  // Try Cache Storage first
  try {
    const cache = await caches.open(WEB_CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) {
      return await cached.blob();
    }
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await cache.put(url, res.clone());
    return await res.blob();
  } catch (e) {
    // Fallback: direct fetch
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  }
}

async function mobileGetCachedFile(url: string): Promise<string> {
  if (!MOBILE_CACHE_DIR) return url;
  await ensureMobileCacheDir();
  const key = hashStringHex(url);
  const target = `${MOBILE_CACHE_DIR}${key}`;
  const info = await FileSystem.getInfoAsync(target);
  if (info.exists) {
    return target;
  }
  const { uri } = await FileSystem.downloadAsync(url, target);
  return uri;
}

export class AudioPlayer {
  private webHowl: Howl | null = null;

  private mobileSound: Audio.Sound | null = null;

  private objectUrl: string | null = null;

  private statusListeners: Set<AudioStatusListener> = new Set();

  private statusTimer: any = null;

  private lastStatus: AudioPlayerStatus = {
    isPlaying: false,
    positionSec: 0,
    durationSec: null,
    isBuffering: false,
  };

  constructor() {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      }).catch(() => undefined);
    }
  }

  onStatus(listener: AudioStatusListener): () => void {
    this.statusListeners.add(listener);
    // Emit immediately with last known
    listener(this.lastStatus);
    return () => this.statusListeners.delete(listener);
  }

  private emit(status: Partial<AudioPlayerStatus>): void {
    this.lastStatus = { ...this.lastStatus, ...status } as AudioPlayerStatus;
    this.statusListeners.forEach((l) => l(this.lastStatus));
  }

  clearError(): void {
    this.emit({ error: undefined });
  }

  private startPolling(): void {
    if (this.statusTimer) return;
    this.statusTimer = setInterval(async () => {
      try {
        if (Platform.OS === 'web' && this.webHowl) {
          const pos = this.webHowl.seek() as number;
          const dur = this.webHowl.duration();
          const playing = this.webHowl.playing();
          this.emit({ positionSec: pos || 0, durationSec: isFinite(dur) ? dur : null, isPlaying: !!playing });
        } else if (this.mobileSound) {
          const status = (await this.mobileSound.getStatusAsync()) as AVPlaybackStatus;
          if ('isLoaded' in status && status.isLoaded) {
            this.emit({
              positionSec: (status.positionMillis ?? 0) / 1000,
              durationSec: status.durationMillis ? status.durationMillis / 1000 : null,
              isPlaying: status.isPlaying,
              isBuffering: status.isBuffering ?? false,
            });
          }
        }
      } catch {}
    }, 250);
  }

  private stopPolling(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
  }

  async play(url: string): Promise<void> {
    const quality = getAudioQuality();
    // Optionally, append quality hints if backend supports it. No-op otherwise.
    const sourceUrl = url;

    this.stop();
    this.clearError();
    this.emit({ isBuffering: true });

    if (Platform.OS === 'web') {
      try {
        // Use Cache API and blob URL for consistent caching behavior
        const blob = await webFetchWithCache(sourceUrl);
        if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = URL.createObjectURL(blob);

        this.webHowl = new Howl({
          src: [this.objectUrl],
          html5: true,
          format: ['mp3', 'wav', 'ogg', 'm4a'],
          preload: true,
          onplay: () => this.emit({ isPlaying: true, isBuffering: false }),
          onpause: () => this.emit({ isPlaying: false }),
          onstop: () => this.emit({ isPlaying: false, positionSec: 0 }),
          onend: () => this.emit({ isPlaying: false }),
          onload: () => this.emit({ isBuffering: false, durationSec: this.webHowl?.duration() ?? null }),
          onloaderror: (_id, err) => this.emit({ error: String(err), isBuffering: false }),
          onplayerror: (_id, err) => this.emit({ error: String(err), isBuffering: false }),
        });
        this.webHowl.play();
        this.startPolling();
      } catch (e: any) {
        this.emit({ error: e?.message ?? 'Failed to play', isBuffering: false, isPlaying: false });
      }
    } else {
      try {
        const cachedUri = await mobileGetCachedFile(sourceUrl);
        // Dispose previous sound
        if (this.mobileSound) {
          await this.mobileSound.unloadAsync();
          this.mobileSound = null;
        }
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: cachedUri },
          { shouldPlay: true, progressUpdateIntervalMillis: 250 }
        );
        this.mobileSound = sound;
        this.mobileSound.setOnPlaybackStatusUpdate((s) => {
          const st = s as AVPlaybackStatus;
          if ('isLoaded' in st && st.isLoaded) {
            this.emit({
              isPlaying: st.isPlaying,
              positionSec: (st.positionMillis ?? 0) / 1000,
              durationSec: st.durationMillis ? st.durationMillis / 1000 : null,
              isBuffering: st.isBuffering ?? false,
            });
          }
        });
        this.emit({
          isBuffering: false,
          isPlaying: (status as any)?.isPlaying ?? true,
        });
        this.startPolling();
      } catch (e: any) {
        this.emit({ error: e?.message ?? 'Failed to play', isBuffering: false, isPlaying: false });
      }
    }
  }

  pause(): void {
    if (Platform.OS === 'web') {
      this.webHowl?.pause();
    } else {
      void this.mobileSound?.pauseAsync();
    }
  }

  resume(): void {
    if (Platform.OS === 'web') {
      this.webHowl?.play();
    } else {
      void this.mobileSound?.playAsync();
    }
  }

  stop(): void {
    if (Platform.OS === 'web') {
      if (this.webHowl) {
        this.webHowl.stop();
        this.webHowl.unload();
        this.webHowl = null;
      }
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = null;
      }
    } else {
      if (this.mobileSound) {
        void this.mobileSound.stopAsync();
        void this.mobileSound.unloadAsync();
        this.mobileSound = null;
      }
    }
    this.stopPolling();
    this.emit({ isPlaying: false, positionSec: 0, isBuffering: false, error: undefined });
  }

  async seek(seconds: number): Promise<void> {
    const targetMs = Math.max(0, seconds * 1000);
    if (Platform.OS === 'web') {
      if (this.webHowl) this.webHowl.seek(seconds);
    } else if (this.mobileSound) {
      await this.mobileSound.setPositionAsync(targetMs);
    }
  }

  getPosition(): number {
    if (Platform.OS === 'web') {
      return (this.webHowl?.seek() as number) || 0;
    }
    return 0;
  }

  async setVolume(volume: number): Promise<void> {
    const v = Math.min(1, Math.max(0, volume));
    if (Platform.OS === 'web') {
      Howler.volume(v);
    } else if (this.mobileSound) {
      await this.mobileSound.setVolumeAsync(v);
    }
  }

  async dispose(): Promise<void> {
    this.stop();
  }
}

export const audioPlayer = new AudioPlayer();


