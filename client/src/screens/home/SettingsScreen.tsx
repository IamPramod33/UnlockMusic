import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useAuthStore } from '../../store';

export default function SettingsScreen() {
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
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Theme (light/dark/system)</Text>
      <TextInput style={styles.input} value={theme} onChangeText={(v) => setTheme((v as any) || 'system')} />
      <Text style={styles.label}>Language (e.g., en, hi)</Text>
      <TextInput style={styles.input} value={language} onChangeText={setLanguage} />
      <Text style={styles.label}>Audio Quality (low/medium/high)</Text>
      <TextInput style={styles.input} value={audioQuality} onChangeText={(v) => setAudioQuality((v as any) || 'high')} />
      <TouchableOpacity style={styles.primary} onPress={save}>
        <Text style={styles.primaryText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 10 },
  label: { color: '#CBD5E1', marginTop: 4 },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 8, color: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10 },
  primary: { backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
});


