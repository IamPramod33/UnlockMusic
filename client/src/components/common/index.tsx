import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { audioPlayer, AudioPlayerStatus } from '../../services/audio';

type AudioPlayerUIProps = { url: string; title?: string };

export function AudioPlayerUI({ url, title }: AudioPlayerUIProps) {
  const [status, setStatus] = useState<AudioPlayerStatus>({ isPlaying: false, positionSec: 0, durationSec: null, isBuffering: false });
  const unsubRef = useRef<() => void>();

  useEffect(() => {
    unsubRef.current = audioPlayer.onStatus(setStatus);
    return () => {
      unsubRef.current?.();
      void audioPlayer.dispose();
    };
  }, []);

  return (
    <View style={{ padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 }}>
      {title ? <Text accessibilityRole="header" style={{ fontWeight: '600', marginBottom: 8 }}>{title}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (status.isPlaying ? audioPlayer.pause() : audioPlayer.play(url))}
          style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#2563EB', borderRadius: 6 }}
        >
          <Text style={{ color: 'white' }}>{status.isPlaying ? 'Pause' : status.isBuffering ? 'Loading…' : 'Play'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => audioPlayer.stop()} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#6B7280', borderRadius: 6 }}>
          <Text style={{ color: 'white' }}>Stop</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => audioPlayer.seek(Math.max(0, status.positionSec - 10))} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#374151', borderRadius: 6 }}>
          <Text style={{ color: 'white' }}>-10s</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => audioPlayer.seek((status.positionSec ?? 0) + 10)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#374151', borderRadius: 6 }}>
          <Text style={{ color: 'white' }}>+10s</Text>
        </Pressable>
        <Text style={{ marginLeft: 8 }}>
          {Math.floor(status.positionSec).toString().padStart(2, '0')}s
          {status.durationSec != null ? ` / ${Math.floor(status.durationSec)}s` : ''}
        </Text>
      </View>
      {status.error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>Error: {status.error}</Text> : null}
    </View>
  );
}


