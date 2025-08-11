import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../../theme';
import CarnaticRaga from '../../../components/carnatic/CarnaticRaga';

export default function CarnaticRagasScreen() {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Carnatic Ragas</Text>
      <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: 8 }}>Explore ragas with arohana/avarohana playback, piano visualization, and tanpura.</Text>
      <CarnaticRaga scrollable={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
});


