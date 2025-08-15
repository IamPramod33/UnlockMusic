import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  Alert
} from 'react-native';
import { useThemeColors } from '../../../../theme';
import type { Lesson } from '../../../../services/api';

type Props = { lesson: Lesson };

type Phase = 'pulse' | 'notes' | 'patterns' | 'meter';
type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth';
type Meter = '2/4' | '3/4' | '4/4';

interface NoteCard {
  type: NoteValue;
  symbol: string;
  name: string;
  beats: number;
  description: string;
}

const NOTE_CARDS: NoteCard[] = [
  { type: 'whole', symbol: '𝅝', name: 'Whole Note', beats: 4, description: 'Hold for 4 beats' },
  { type: 'half', symbol: '𝅗𝅥', name: 'Half Note', beats: 2, description: 'Hold for 2 beats' },
  { type: 'quarter', symbol: '♩', name: 'Quarter Note', beats: 1, description: 'Hold for 1 beat' },
  { type: 'eighth', symbol: '♪', name: 'Eighth Note', beats: 0.5, description: 'Hold for ½ beat' },
];

const METER_INFO = {
  '2/4': { name: '2/4 Time', pattern: '💪 💪', description: 'Two strong beats per measure' },
  '3/4': { name: '3/4 Time', pattern: '💪 💨 💨', description: 'Three beats, first is strongest' },
  '4/4': { name: '4/4 Time', pattern: '💪 💨 💪 💨', description: 'Four beats, first and third are strong' },
};

export default function RhythmMeter({ lesson }: Props) {
  const colors = useThemeColors();
  const [currentPhase, setCurrentPhase] = useState<Phase>('pulse');
  const [showTheory, setShowTheory] = useState(false);
  const [pulseAccuracy, setPulseAccuracy] = useState(0);
  const [noteMatches, setNoteMatches] = useState(0);
  const [patternSuccess, setPatternSuccess] = useState(0);
  const [meterSuccess, setMeterSuccess] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [shuffledNotes, setShuffledNotes] = useState<NoteCard[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteCard | null>(null);
  
  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const cardAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Initialize shuffled notes for memory game
    setShuffledNotes([...NOTE_CARDS].sort(() => Math.random() - 0.5));
  }, []);

  // Phase 1: Pulse Animation
  useEffect(() => {
    if (currentPhase === 'pulse' && isPlaying) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentPhase, isPlaying, pulseAnimation]);

  const startPulseExercise = () => {
    setIsPlaying(true);
    setPulseAccuracy(0);
    // Simulate pulse detection
    setTimeout(() => {
      setIsPlaying(false);
      setPulseAccuracy(85); // Simulated accuracy
      setStreak(prev => prev + 1);
    }, 3000);
  };

  const handleNoteMatch = (note: NoteCard) => {
    setSelectedNote(note);
    if (note.type === shuffledNotes[noteMatches % 4].type) {
      setNoteMatches(prev => prev + 1);
      setStreak(prev => prev + 1);
      if (noteMatches + 1 >= 8) {
        Alert.alert('Great job!', 'You\'ve mastered the note values!');
      }
    } else {
      setStreak(0);
    }
  };

  const handleMeterSelection = (meter: Meter) => {
    setSelectedMeter(meter);
    // Simulate correct meter identification
    setTimeout(() => {
      setMeterSuccess(prev => prev + 1);
      setStreak(prev => prev + 1);
      setSelectedMeter(null);
    }, 1000);
  };

  const getPhaseProgress = () => {
    switch (currentPhase) {
      case 'pulse': return pulseAccuracy / 100;
      case 'notes': return noteMatches / 8;
      case 'patterns': return patternSuccess / 4;
      case 'meter': return meterSuccess / 8;
      default: return 0;
    }
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'pulse':
        return (
          <View style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              🎵 Feel the Pulse
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Let's find your natural rhythm! Tap along to the beat.
            </Text>
            
            <View style={styles.pulseContainer}>
              <Animated.View 
                style={[
                  styles.pulseCircle,
                  { 
                    backgroundColor: colors.primary,
                    transform: [{ scale: pulseAnimation }]
                  }
                ]}
              />
              <Text style={[styles.pulseText, { color: colors.text }]}>
                {isPlaying ? 'Tap along!' : 'Ready to start?'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: isPlaying ? colors.muted : colors.primary }
              ]}
              onPress={startPulseExercise}
              disabled={isPlaying}
            >
              <Text style={[styles.actionButtonText, { color: colors.background }]}>
                {isPlaying ? 'Tapping...' : 'Start Pulse Exercise'}
              </Text>
            </TouchableOpacity>

            {pulseAccuracy > 0 && (
              <View style={styles.resultContainer}>
                <Text style={[styles.resultText, { color: colors.primary }]}>
                  Accuracy: {pulseAccuracy}% - Great timing! 🎯
                </Text>
              </View>
            )}
          </View>
        );

      case 'notes':
        return (
          <View style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              🎼 Note Values Discovery
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Match the note symbols to their values. {noteMatches}/8 completed.
            </Text>

            <View style={styles.noteCardsContainer}>
              {NOTE_CARDS.map((note, index) => (
                <TouchableOpacity
                  key={note.type}
                  style={[
                    styles.noteCard,
                    { 
                      backgroundColor: colors.card,
                      borderColor: selectedNote?.type === note.type ? colors.primary : colors.border,
                      transform: [{ scale: selectedNote?.type === note.type ? 1.05 : 1 }]
                    }
                  ]}
                  onPress={() => handleNoteMatch(note)}
                >
                  <Text style={[styles.noteSymbol, { color: colors.text }]}>
                    {note.symbol}
                  </Text>
                  <Text style={[styles.noteName, { color: colors.text }]}>
                    {note.name}
                  </Text>
                  <Text style={[styles.noteDescription, { color: colors.muted }]}>
                    {note.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.targetContainer}>
              <Text style={[styles.targetText, { color: colors.text }]}>
                Find: {shuffledNotes[noteMatches % 4]?.name}
              </Text>
            </View>
          </View>
        );

      case 'patterns':
        return (
          <View style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              🎹 Rhythm Patterns
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Create and copy rhythm patterns. {patternSuccess}/4 completed.
            </Text>

            <View style={styles.patternBuilder}>
              <Text style={[styles.patternTitle, { color: colors.text }]}>
                Pattern Builder
              </Text>
              <View style={styles.patternGrid}>
                {['♩', '♩', '𝅗𝅥', '♩'].map((symbol, index) => (
                  <View key={index} style={[styles.patternSlot, { backgroundColor: colors.card }]}>
                    <Text style={[styles.patternSymbol, { color: colors.text }]}>{symbol}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setPatternSuccess(prev => prev + 1);
                setStreak(prev => prev + 1);
              }}
            >
              <Text style={[styles.actionButtonText, { color: colors.background }]}>
                Create Pattern
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'meter':
        return (
          <View style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              🕐 Meter Recognition
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Identify the time signature. {meterSuccess}/8 completed.
            </Text>

            <View style={styles.meterContainer}>
              {Object.entries(METER_INFO).map(([meter, info]) => (
                <TouchableOpacity
                  key={meter}
                  style={[
                    styles.meterButton,
                    { 
                      backgroundColor: selectedMeter === meter ? colors.primary : colors.card,
                      borderColor: colors.primary
                    }
                  ]}
                  onPress={() => handleMeterSelection(meter as Meter)}
                  disabled={selectedMeter !== null}
                >
                  <Text style={[
                    styles.meterPattern, 
                    { color: selectedMeter === meter ? colors.background : colors.text }
                  ]}>
                    {info.pattern}
                  </Text>
                  <Text style={[
                    styles.meterName,
                    { color: selectedMeter === meter ? colors.background : colors.text }
                  ]}>
                    {info.name}
                  </Text>
                  <Text style={[
                    styles.meterDescription,
                    { color: selectedMeter === meter ? colors.background : colors.muted }
                  ]}>
                    {info.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {lesson.title || 'Rhythm & Meter'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Master rhythm through interactive exercises
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              { 
                backgroundColor: colors.primary,
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}>
          Phase {Object.keys(['pulse', 'notes', 'patterns', 'meter']).indexOf(currentPhase) + 1} of 4
        </Text>
      </View>

      {/* Streak Counter */}
      <View style={styles.streakContainer}>
        <Text style={[styles.streakIcon, { color: colors.primary }]}>🔥</Text>
        <Text style={[styles.streakText, { color: colors.text }]}>
          Rhythm Master: {streak} streak
        </Text>
      </View>

      {/* Phase Navigation */}
      <View style={styles.phaseNavigation}>
        {(['pulse', 'notes', 'patterns', 'meter'] as Phase[]).map((phase, index) => (
          <TouchableOpacity
            key={phase}
            style={[
              styles.phaseTab,
              { 
                backgroundColor: currentPhase === phase ? colors.primary : colors.card,
                borderColor: colors.primary
              }
            ]}
            onPress={() => setCurrentPhase(phase)}
          >
            <Text style={[
              styles.phaseTabText,
              { color: currentPhase === phase ? colors.background : colors.text }
            ]}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phase Content */}
      {renderPhaseContent()}

      {/* Theory Section */}
      <TouchableOpacity
        style={styles.theoryToggle}
        onPress={() => setShowTheory(!showTheory)}
      >
        <Text style={[styles.theoryToggleText, { color: colors.primary }]}>
          {showTheory ? '📚 Hide Theory' : '📚 Show Theory'}
        </Text>
      </TouchableOpacity>

      {showTheory && (
        <View style={[styles.theoryContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.theoryTitle, { color: colors.text }]}>
            Rhythm Theory Basics
          </Text>
          
          <View style={styles.theorySection}>
            <Text style={[styles.theorySectionTitle, { color: colors.text }]}>
              What is Rhythm?
            </Text>
            <Text style={[styles.theoryText, { color: colors.muted }]}>
              Rhythm is the pattern of sounds and silences in music. It's what makes you tap your foot or dance!
            </Text>
          </View>

          <View style={styles.theorySection}>
            <Text style={[styles.theorySectionTitle, { color: colors.text }]}>
              Note Values
            </Text>
            <Text style={[styles.theoryText, { color: colors.muted }]}>
              • Whole Note (𝅝): 4 beats - the longest note{'\n'}
              • Half Note (𝅗𝅥): 2 beats - half as long{'\n'}
              • Quarter Note (♩): 1 beat - the basic unit{'\n'}
              • Eighth Note (♪): ½ beat - twice as fast
            </Text>
          </View>

          <View style={styles.theorySection}>
            <Text style={[styles.theorySectionTitle, { color: colors.text }]}>
              Time Signatures
            </Text>
            <Text style={[styles.theoryText, { color: colors.muted }]}>
              • 2/4: Two beats per measure, like marching{'\n'}
              • 3/4: Three beats per measure, like a waltz{'\n'}
              • 4/4: Four beats per measure, most common
            </Text>
          </View>

          <View style={styles.theorySection}>
            <Text style={[styles.theorySectionTitle, { color: colors.text }]}>
              The Pulse
            </Text>
            <Text style={[styles.theoryText, { color: colors.muted }]}>
              The pulse is the steady heartbeat of music. It's what you naturally tap along to when listening to your favorite songs!
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  streakIcon: {
    fontSize: 20,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
  },
  phaseNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  phaseTab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  phaseTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  phaseContainer: {
    gap: 16,
    alignItems: 'center',
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  phaseDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  pulseContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseText: {
    fontSize: 18,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noteCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  noteCard: {
    width: 80,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    gap: 4,
  },
  noteSymbol: {
    fontSize: 24,
    fontWeight: '600',
  },
  noteName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  noteDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  targetContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  targetText: {
    fontSize: 18,
    fontWeight: '600',
  },
  patternBuilder: {
    gap: 12,
    alignItems: 'center',
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  patternGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  patternSlot: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternSymbol: {
    fontSize: 24,
    fontWeight: '600',
  },
  meterContainer: {
    gap: 12,
  },
  meterButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    gap: 4,
  },
  meterPattern: {
    fontSize: 20,
  },
  meterName: {
    fontSize: 16,
    fontWeight: '600',
  },
  meterDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  theoryToggle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  theoryToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  theoryContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  theoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  theorySection: {
    gap: 8,
  },
  theorySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  theoryText: {
    fontSize: 14,
    lineHeight: 20,
  },
});


