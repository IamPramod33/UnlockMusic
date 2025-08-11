import { Platform } from 'react-native';
import { Howl } from 'howler';
import { Audio, AVPlaybackStatus } from 'expo-av';
import type { ScaleKey } from './scalePatterns';

let webHowl: Howl | null = null;
let mobileSound: Audio.Sound | null = null;

function tonicFileName(tonic: ScaleKey): string {
  return tonic.includes('#') ? tonic.replace('#', 'sharp') : tonic;
}

export async function startTanpura(apiBaseUrl: string, tonic: ScaleKey, volume: number = 0.6): Promise<void> {
  const file = tonicFileName(tonic);
  const url = `${apiBaseUrl}/tanpura/${file}.mp3`;

  await stopTanpura();

  if (Platform.OS === 'web') {
    webHowl = new Howl({ src: [url], loop: true, html5: true, volume });
    webHowl.play();
  } else {
    const { sound } = await Audio.Sound.createAsync({ uri: url }, { isLooping: true, volume });
    mobileSound = sound;
    await mobileSound.playAsync();
  }
}

export async function stopTanpura(): Promise<void> {
  if (Platform.OS === 'web') {
    if (webHowl) {
      try { webHowl.stop(); } catch {}
      try { webHowl.unload(); } catch {}
      webHowl = null;
    }
  } else {
    if (mobileSound) {
      try { await mobileSound.stopAsync(); } catch {}
      try { await mobileSound.unloadAsync(); } catch {}
      mobileSound = null;
    }
  }
}

export async function setTanpuraVolume(volume: number): Promise<void> {
  const v = Math.min(1, Math.max(0, volume));
  if (Platform.OS === 'web') {
    if (webHowl) webHowl.volume(v);
  } else if (mobileSound) {
    await mobileSound.setVolumeAsync(v);
  }
}


