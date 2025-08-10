import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useThemeColors } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiService from '../../services/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>('high');

  useEffect(() => {
    (async () => {
      try {
        const me = await apiService.getMe();
        setName(me?.data?.user?.name || '');
        setSkillLevel(me?.data?.user?.skillLevel || 'beginner');
        const prefs = me?.data?.user?.preferences || {};
        if (prefs.language) setLanguage(prefs.language);
        if (prefs.theme) setTheme(prefs.theme);
        if (prefs.audioQuality) setAudioQuality(prefs.audioQuality);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await apiService.updateProfile({ name, skillLevel, preferences: { language, theme, audioQuality } });
      Alert.alert('Saved', 'Profile updated');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Name" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Skill Level" placeholderTextColor={colors.muted} value={skillLevel} onChangeText={setSkillLevel} />
      <Text style={[styles.section, { color: colors.text }]}>Preferences</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Language (en, hi, etc.)" placeholderTextColor={colors.muted} value={language} onChangeText={setLanguage} />
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Theme (light/dark/system)" placeholderTextColor={colors.muted} value={theme} onChangeText={(v) => setTheme((v as any) || 'system')} />
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Audio Quality (low/medium/high)" placeholderTextColor={colors.muted} value={audioQuality} onChangeText={(v) => setAudioQuality((v as any) || 'high')} />
      <TouchableOpacity style={[styles.primary, { backgroundColor: colors.success }]} onPress={save} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('ChangePassword')}>
        <Text style={[styles.link, { color: colors.primary }]}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  input: { borderColor: '#334155', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  primary: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 8 },
  link: { },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 6, textAlign: 'center' },
});


