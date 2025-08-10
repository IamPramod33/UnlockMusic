import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useThemeColors } from '../../theme';
import { useAuthStore } from '../../store';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const preferences = useAuthStore((s) => s.preferences);
  const setPreferences = useAuthStore((s) => s.setPreferences);

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(preferences.theme);
  const [language, setLanguage] = useState<string>(preferences.language);
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>(preferences.audioQuality);

  useEffect(() => {
    setTheme(preferences.theme);
    setLanguage(preferences.language);
    setAudioQuality(preferences.audioQuality);
  }, [preferences]);

  const save = async () => {
    await setPreferences({ theme, language, audioQuality });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <Text style={[styles.label, { color: colors.muted }]}>Theme (light/dark/system)</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={theme} onChangeText={(v) => setTheme((v as any) || 'system')} />
      <Text style={[styles.label, { color: colors.muted }]}>Language (e.g., en, hi)</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={language} onChangeText={setLanguage} />
      <Text style={[styles.label, { color: colors.muted }]}>Audio Quality (low/medium/high)</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={audioQuality} onChangeText={(v) => setAudioQuality((v as any) || 'high')} />
      <TouchableOpacity style={[styles.primary, { backgroundColor: colors.success }]} onPress={save}>
        <Text style={styles.primaryText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  label: { marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  primary: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
});


