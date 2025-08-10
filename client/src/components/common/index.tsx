import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { audioPlayer, AudioPlayerStatus } from '../../services/audio';
import { useThemeColors } from '../../theme';

type AudioPlayerUIProps = { url: string; title?: string };

export function AudioPlayerUI({ url, title }: AudioPlayerUIProps) {
  const colors = useThemeColors();
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
    <View style={{ padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.card }}>
      {title ? <Text accessibilityRole="header" style={{ fontWeight: '600', marginBottom: 8, color: colors.text }}>{title}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (status.isPlaying ? audioPlayer.pause() : audioPlayer.play(url))}
          style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 6 }}
        >
          <Text style={{ color: '#FFFFFF' }}>{status.isPlaying ? 'Pause' : status.isBuffering ? 'Loading…' : 'Play'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => audioPlayer.stop()} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.border, borderRadius: 6 }}>
          <Text style={{ color: colors.text }}>Stop</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => audioPlayer.seek(Math.max(0, status.positionSec - 10))} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.border, borderRadius: 6 }}>
          <Text style={{ color: colors.text }}>-10s</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => audioPlayer.seek((status.positionSec ?? 0) + 10)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.border, borderRadius: 6 }}>
          <Text style={{ color: colors.text }}>+10s</Text>
        </Pressable>
        <Text style={{ marginLeft: 8, color: colors.text }}>
          {Math.floor(status.positionSec).toString().padStart(2, '0')}s
          {status.durationSec != null ? ` / ${Math.floor(status.durationSec)}s` : ''}
        </Text>
      </View>
      {status.error ? <Text style={{ color: '#DC2626', marginTop: 8 }}>Error: {status.error}</Text> : null}
    </View>
  );
}


