import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import apiService, { DatabaseTestResponse } from './src/services/api';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [selectedMusicSystem, setSelectedMusicSystem] = useState<'western' | 'carnatic' | 'both' | null>(null);
  const [dbTestResult, setDbTestResult] = useState<DatabaseTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Test database connection on app load
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.testDatabase();
      setDbTestResult(result);
      console.log('✅ Database test successful:', result);
    } catch (error) {
      console.error('❌ Database test failed:', error);
      Alert.alert(
        'Database Connection Failed',
        'Unable to connect to the server. Please ensure the server is running on http://localhost:4000'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMusicSystemSelection = (system: 'western' | 'carnatic' | 'both') => {
    setSelectedMusicSystem(system);
    // TODO: Navigate to onboarding or main app
    console.log(`Selected music system: ${system}`);
  };

  const handleGetStarted = () => {
    if (selectedMusicSystem) {
      // TODO: Navigate to main app with selected music system
      console.log('Getting started with:', selectedMusicSystem);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1E293B" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.appName}>Unlock Music Learning</Text>
          <Text style={styles.tagline}>Master Western & Carnatic Music</Text>
        </View>

        {/* Database Connection Test */}
        <View style={styles.dbTestSection}>
          <Text style={styles.dbTestTitle}>Database Connection Status</Text>
          {isLoading ? (
            <View style={styles.dbTestCard}>
              <Text style={styles.dbTestText}>🔄 Testing connection...</Text>
            </View>
          ) : dbTestResult ? (
            <View style={[styles.dbTestCard, styles.dbTestSuccess]}>
              <Text style={styles.dbTestText}>✅ Connected to Database</Text>
              <Text style={styles.dbTestDetails}>
                Users: {dbTestResult.counts.users} | 
                Lessons: {dbTestResult.counts.lessons} | 
                Exercises: {dbTestResult.counts.exercises} | 
                Progress: {dbTestResult.counts.progress}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={testDatabaseConnection}
              >
                <Text style={styles.retryButtonText}>🔄 Retry Test</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.dbTestCard, styles.dbTestError]}>
              <Text style={styles.dbTestText}>❌ Connection Failed</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={testDatabaseConnection}
              >
                <Text style={styles.retryButtonText}>🔄 Retry Test</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Your Musical Journey</Text>
          <Text style={styles.welcomeText}>
            Discover the rich traditions of Western and Carnatic music through interactive lessons, 
            real-time feedback, and personalized learning paths.
          </Text>
        </View>

        {/* Music System Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.selectionTitle}>Choose Your Musical Path</Text>
          
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMusicSystem === 'western' && styles.selectedCard
            ]}
            onPress={() => handleMusicSystemSelection('western')}
          >
            <Text style={styles.optionEmoji}>🎼</Text>
            <Text style={styles.optionTitle}>Western Music</Text>
            <Text style={styles.optionDescription}>
              Learn staff notation, scales, chords, and classical theory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMusicSystem === 'carnatic' && styles.selectedCard
            ]}
            onPress={() => handleMusicSystemSelection('carnatic')}
          >
            <Text style={styles.optionEmoji}>🪕</Text>
            <Text style={styles.optionTitle}>Carnatic Music</Text>
            <Text style={styles.optionDescription}>
              Master swaras, ragas, talas, and traditional Indian music
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMusicSystem === 'both' && styles.selectedCard
            ]}
            onPress={() => handleMusicSystemSelection('both')}
          >
            <Text style={styles.optionEmoji}>🌍</Text>
            <Text style={styles.optionTitle}>Both Traditions</Text>
            <Text style={styles.optionDescription}>
              Explore the best of both Western and Carnatic music worlds
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What You'll Learn</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🎯</Text>
              <Text style={styles.featureText}>Interactive Lessons</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🎤</Text>
              <Text style={styles.featureText}>Real-time Feedback</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📊</Text>
              <Text style={styles.featureText}>Progress Tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🏆</Text>
              <Text style={styles.featureText}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Get Started Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.getStartedButton,
              !selectedMusicSystem && styles.disabledButton
            ]}
            onPress={handleGetStarted}
            disabled={!selectedMusicSystem}
          >
            <Text style={styles.getStartedText}>
              {selectedMusicSystem ? 'Get Started' : 'Select a Music System'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B', // Dark background from design theme
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC', // Light text
    textAlign: 'center',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8', // Muted text
    textAlign: 'center',
  },
  dbTestSection: {
    marginBottom: 30,
  },
  dbTestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 15,
  },
  dbTestCard: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  dbTestSuccess: {
    backgroundColor: '#065f46', // Green background for success
  },
  dbTestError: {
    backgroundColor: '#7f1d1d', // Red background for error
  },
  dbTestText: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '500',
    marginBottom: 5,
  },
  dbTestDetails: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#475569',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
  },
  selectionSection: {
    marginBottom: 40,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#334155', // Card background
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#F59E0B', // Gold accent from design theme
    backgroundColor: '#475569',
  },
  optionEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: (width - 60) / 2,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonSection: {
    marginTop: 20,
  },
  getStartedButton: {
    backgroundColor: '#2563EB', // Primary blue from design theme
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#64748B',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
