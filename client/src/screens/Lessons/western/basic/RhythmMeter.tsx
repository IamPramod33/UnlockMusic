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
import { audioPlayer } from '../../../../services/audio';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../navigation/AppNavigator';
import Svg, { SvgUri } from 'react-native-svg';


type Props = { lesson: Lesson };

type Phase = 'pulse' | 'notes' | 'patterns' | 'meter';
type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth';
type Meter = '2/4' | '3/4' | '4/4';
type Tempo = 60 | 80 | 100 | 120 | 140 | 160;

// Custom Musical Note Component with SVG for whole/half notes, Unicode for others
const MusicalNote = ({ type, size = 24, color = '#000', style }: { 
  type: NoteValue; 
  size?: number; 
  color?: string; 
  style?: any; 
}) => {
  const [fallbackLevel, setFallbackLevel] = useState(0); // 0=unicode, 1=fallback1, 2=fallback2
  
  // Use SVG for whole and half notes only
  if (type === 'whole') {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <SvgUri
          width={size}
          height={size}
          uri="http://localhost:4000/note-svg/whole-note.svg"
          color={color}
          style={{ opacity: 1 }}
        />
      </View>
    );
  }
  
  if (type === 'half') {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <SvgUri
          width={size}
          height={size}
          uri="http://localhost:4000/note-svg/half_note.svg"
          color={color}
          style={{ opacity: 1 }}
        />
      </View>
    );
  }
  
  const getSymbol = () => {
    switch (fallbackLevel) {
      case 0: return MUSICAL_SYMBOLS[type].unicode;
      case 1: return MUSICAL_SYMBOLS[type].fallback1;
      case 2: return MUSICAL_SYMBOLS[type].fallback2;
      default: return MUSICAL_SYMBOLS[type].fallback2;
    }
  };
  
  const getFontFamily = () => {
    // Try multiple font families for better Unicode support
    const fontFamilies = [
      'serif',                    // General serif fonts
      'Apple Symbols',            // macOS musical symbols
      'Zapf Dingbats',           // macOS dingbats
      'Segoe UI Symbol',         // Windows symbols
      'Arial Unicode MS',        // Windows Unicode
      'DejaVu Sans',             // Linux Unicode
      'Liberation Sans',         // Linux alternative
      'monospace',               // Fallback for symbols
      undefined                  // System default
    ];
    
    return fontFamilies[fallbackLevel] || undefined;
  };
  
  return (
    <Text 
      style={[
        { 
          fontSize: size, 
          color: color,
          fontFamily: getFontFamily(),
        }, 
        style
      ]}
      onTextLayout={() => {
        // Progressive fallback if Unicode doesn't render properly
        if (fallbackLevel < 8) { // Try up to 8 different font families
          setFallbackLevel(prev => prev + 1);
        }
      }}
    >
      {getSymbol()}
    </Text>
  );
};

interface NoteCard {
  type: NoteValue;
  symbol: string;
  name: string;
  beats: number;
  description: string;
}

interface TapData {
  timestamp: number;
  accuracy: number;
  isOnBeat: boolean;
}

/**
 * Musical note symbols with progressive font fallbacks
 * 
 * FONT INSTALLATION TIPS for better Unicode musical symbol support:
 * 
 * 1. Install Musical Fonts:
 *    - "Musisync" - Professional musical notation font
 *    - "Bravura" - Open-source musical font
 *    - "Petrucci" - Traditional musical notation
 * 
 * 2. System Fonts that support musical symbols:
 *    - macOS: "Apple Symbols", "Zapf Dingbats"
 *    - Windows: "Segoe UI Symbol", "Arial Unicode MS"
 *    - Linux: "DejaVu Sans", "Liberation Sans"
 * 
 * 3. Web Fonts (for web version):
 *    - Google Fonts: "Noto Music" (supports musical symbols)
 *    - Add to CSS: @import url('https://fonts.googleapis.com/css2?family=Noto+Music&display=swap');
 */
const MUSICAL_SYMBOLS = {
  whole: { 
    unicode: '𝅝', 
    fallback1: '○', 
    fallback2: 'O',
    description: 'Whole Note - 4 beats' 
  },
  half: { 
    unicode: '𝅗𝅥', 
    fallback1: '○|', 
    fallback2: 'O|',
    description: 'Half Note - 2 beats' 
  },
  quarter: { 
    unicode: '♩', 
    fallback1: '●|', 
    fallback2: '•|',
    description: 'Quarter Note - 1 beat' 
  },
  eighth: { 
    unicode: '♪', 
    fallback1: '●|~', 
    fallback2: '•|~',
    description: 'Eighth Note - ½ beat' 
  },
};

const NOTE_CARDS: NoteCard[] = [
  { type: 'whole', symbol: MUSICAL_SYMBOLS.whole.unicode, name: 'Whole Note', beats: 4, description: '4 beats - longest note' },
  { type: 'half', symbol: MUSICAL_SYMBOLS.half.unicode, name: 'Half Note', beats: 2, description: '2 beats - half as long' },
  { type: 'quarter', symbol: MUSICAL_SYMBOLS.quarter.unicode, name: 'Quarter Note', beats: 1, description: '1 beat - basic unit' },
  { type: 'eighth', symbol: MUSICAL_SYMBOLS.eighth.unicode, name: 'Eighth Note', beats: 0.5, description: '½ beat - twice as fast' },
];

const METER_INFO = {
  '2/4': { name: '2/4 Time', pattern: '💪 💪', description: 'Two strong beats per measure' },
  '3/4': { name: '3/4 Time', pattern: '💪 💨 💨', description: 'Three beats, first is strongest' },
  '4/4': { name: '4/4 Time', pattern: '💪 💨 💪 💨', description: 'Four beats, first and third are strong' },
};

const TEMPO_OPTIONS: { label: string; value: Tempo; description: string }[] = [
  { label: 'Slow (60 BPM)', value: 60, description: 'Great for beginners' },
  { label: 'Medium (80 BPM)', value: 80, description: 'Comfortable walking pace' },
  { label: 'Moderate (100 BPM)', value: 100, description: 'Natural heartbeat' },
  { label: 'Fast (120 BPM)', value: 120, description: 'Upbeat tempo' },
  { label: 'Very Fast (140 BPM)', value: 140, description: 'Energetic pace' },
  { label: 'Extreme (160 BPM)', value: 160, description: 'Challenge mode' },
];

export default function RhythmMeter({ lesson }: Props) {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentPhase, setCurrentPhase] = useState<Phase>('pulse');
  const [pulseAccuracy, setPulseAccuracy] = useState(0);
  const [noteMatches, setNoteMatches] = useState(0);
  const [patternSuccess, setPatternSuccess] = useState(0);
  const [meterSuccess, setMeterSuccess] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [shuffledNotes, setShuffledNotes] = useState<NoteCard[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteCard | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Enhanced pulse exercise states
  const [selectedTempo, setSelectedTempo] = useState<Tempo>(80);
  const [userTaps, setUserTaps] = useState<TapData[]>([]);
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  const [exerciseDuration, setExerciseDuration] = useState(30); // seconds
  const [showTempoSelector, setShowTempoSelector] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<{ message: string; color: string } | null>(null);
  const [totalBeats, setTotalBeats] = useState(0);
  const [correctBeats, setCorrectBeats] = useState(0);
  const [exerciseActive, setExerciseActive] = useState(false); // New state to track if exercise is actually running
  
  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const cardAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const tapAnimation = useRef(new Animated.Value(0)).current;
  const tempoSelectorAnimation = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  
  // Metronome functionality
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundMetronomeRef = useRef<NodeJS.Timeout | null>(null);
  const [bpm, setBpm] = useState(80); // Default to 80 BPM
  const [isBackgroundMetronomeActive, setIsBackgroundMetronomeActive] = useState(false);

  useEffect(() => {
    // Initialize shuffled notes for memory game
    setShuffledNotes([...NOTE_CARDS].sort(() => Math.random() - 0.5));
  }, []);

  // Enhanced pulse exercise with tap detection
  const handleTap = () => {
    if (!exerciseActive || !exerciseStartTime) return;

    const now = Date.now();
    const beatInterval = (60 / selectedTempo) * 1000; // milliseconds per beat
    const elapsedTime = now - exerciseStartTime;
    const expectedBeatTime = Math.floor(elapsedTime / beatInterval) * beatInterval;
    const accuracy = Math.abs(elapsedTime - expectedBeatTime);
    const isOnBeat = accuracy < beatInterval * 0.3; // Within 30% of beat interval

    const newTap: TapData = {
      timestamp: now,
      accuracy,
      isOnBeat
    };

    setUserTaps(prev => [...prev, newTap]);
    setTotalBeats(prev => prev + 1);
    
    if (isOnBeat) {
      setCorrectBeats(prev => prev + 1);
      setTapFeedback({ message: 'Perfect! 🎯', color: '#4CAF50' });
    } else if (accuracy < beatInterval * 0.5) {
      setTapFeedback({ message: 'Good! 👍', color: '#FF9800' });
    } else {
      setTapFeedback({ message: 'Miss! 😅', color: '#F44336' });
    }

    // Animate tap feedback
    tapAnimation.setValue(1);
    Animated.sequence([
      Animated.timing(tapAnimation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tapAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Clear feedback after 1 second
    setTimeout(() => setTapFeedback(null), 1000);
  };

  // Simple tap handler for better compatibility
  const handleTapPress = () => {
    handleTap();
  };

  // Phase 1: Enhanced Pulse Animation
  useEffect(() => {
    if (currentPhase === 'pulse' && isPlaying) {
      const beatInterval = (60 / selectedTempo) * 1000;
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: beatInterval / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: beatInterval / 2,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else if (currentPhase === 'pulse' && !isPlaying) {
      // Gentle preview animation when not playing
      const previewPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      previewPulse.start();
      return () => previewPulse.stop();
    }
  }, [currentPhase, isPlaying, pulseAnimation, selectedTempo]);

  // Metronome functions
  const playMetronomeClick = async () => {
    try {
      const baseUrl = 'http://localhost:4000';
      // Use a lighter sound for metronome - could be replaced with actual metronome sound
      const clickUrl = `${baseUrl}/instruments/other/metronome.mp3`;
      await audioPlayer.play(clickUrl);
    } catch (error) {
      console.error('Error playing metronome click:', error);
    }
  };

  const playPianoNote = async () => {
    try {
      const baseUrl = 'http://localhost:4000';
      const noteUrl = `${baseUrl}/instruments/piano/C4.mp3`;
      await audioPlayer.play(noteUrl);
    } catch (error) {
      console.error('Error playing piano note:', error);
    }
  };

  const startBackgroundMetronome = () => {
    const intervalMs = (60 / selectedTempo) * 1000;
    
    // Start immediately
    playMetronomeClick();
    setIsBackgroundMetronomeActive(true);
    
    backgroundMetronomeRef.current = setInterval(() => {
      playMetronomeClick();
    }, intervalMs);
  };

  const stopBackgroundMetronome = () => {
    if (backgroundMetronomeRef.current) {
      clearInterval(backgroundMetronomeRef.current);
      backgroundMetronomeRef.current = null;
    }
    setIsBackgroundMetronomeActive(false);
  };

  const startMetronome = () => {
    const intervalMs = (60 / selectedTempo) * 1000;
    
    playMetronomeClick();
    
    metronomeIntervalRef.current = setInterval(() => {
      playMetronomeClick();
    }, intervalMs);
  };

  const stopMetronome = () => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    audioPlayer.stop();
  };

  const startPulseExercise = () => {
    setIsPlaying(true);
    setExerciseActive(false); // Exercise not active during countdown
    setPulseAccuracy(0);
    setUserTaps([]);
    setTotalBeats(0);
    setCorrectBeats(0);
    setCountdown(3);
    setExerciseStartTime(null);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          setCountdown(null);
          setExerciseStartTime(Date.now());
          setExerciseActive(true); // Now exercise is active
          
          startMetronome();
          
          setTimeout(() => {
            stopMetronome();
            setIsPlaying(false);
            setExerciseActive(false); // Exercise ended
            
            // Calculate final accuracy
            const accuracy = totalBeats > 0 ? (correctBeats / totalBeats) * 100 : 0;
            setPulseAccuracy(Math.round(accuracy));
            setStreak(prev => prev + 1);
            
            // Show results
            Alert.alert(
              'Exercise Complete!',
              `Accuracy: ${Math.round(accuracy)}%\nCorrect beats: ${correctBeats}/${totalBeats}`,
              [{ text: 'OK' }]
            );
          }, exerciseDuration * 1000);
          
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup metronome on unmount
  useEffect(() => {
    return () => {
      stopMetronome();
      stopBackgroundMetronome();
    };
  }, []);

  // Animate tempo selector
  useEffect(() => {
    Animated.timing(tempoSelectorAnimation, {
      toValue: showTempoSelector ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showTempoSelector, tempoSelectorAnimation]);

  const playNoteValue = async (note: NoteCard) => {
    try {
      // Calculate beat duration based on tempo
      const beatDuration = (60 / selectedTempo) * 1000; // milliseconds per beat
      
      // Play piano note first, then metronome click
      await playPianoNote();
      await playMetronomeClick();
      
      // Handle different note durations
      if (note.beats > 1) {
        // For whole and half notes, continue metronome for remaining beats
        const remainingBeats = note.beats - 1;
        for (let i = 0; i < remainingBeats; i++) {
          await new Promise(resolve => setTimeout(resolve, beatDuration));
          await playMetronomeClick();
        }
      } else if (note.beats === 1) {
        // For quarter notes, just wait for the full beat duration
        await new Promise(resolve => setTimeout(resolve, beatDuration));
      } else if (note.beats === 0.5) {
        // For eighth notes, play at double tempo - two quick clicks
        await new Promise(resolve => setTimeout(resolve, beatDuration * 0.25));
        await playMetronomeClick();
        await new Promise(resolve => setTimeout(resolve, beatDuration * 0.25));
      }
    } catch (error) {
      console.error('Error playing note value:', error);
    }
  };

  const handleNoteMatch = async (note: NoteCard) => {
    setSelectedNote(note);
    
    // Play the note value sound
    await playNoteValue(note);
    
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

  const playMeterPattern = async (meter: Meter) => {
    try {
      const baseUrl = 'http://Pramods-Pro-14.local:4000';
      const clickUrl = `${baseUrl}/instruments/piano/C4.mp3`;
      
      // Play meter pattern
      const patterns = {
        '2/4': [1, 1], // Two strong beats
        '3/4': [1, 0.5, 0.5], // Three beats, first strongest
        '4/4': [1, 0.5, 1, 0.5], // Four beats, first and third strong
      };
      
      const pattern = patterns[meter];
      for (let i = 0; i < pattern.length; i++) {
        await audioPlayer.play(clickUrl);
        // Wait based on beat strength (stronger beats = longer wait)
        if (i < pattern.length - 1) {
          await new Promise(resolve => setTimeout(resolve, pattern[i] * 600));
        }
      }
    } catch (error) {
      console.error('Error playing meter pattern:', error);
    }
  };

  const handleMeterSelection = async (meter: Meter) => {
    setSelectedMeter(meter);
    
    // Play the meter pattern
    await playMeterPattern(meter);
    
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
              🎵 Enhanced Pulse Exercise
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Tap along to the beat and improve your rhythm accuracy!
            </Text>

            {/* Exercise Setup Controls - Moved Above Exercise Area */}
            <View style={styles.exerciseSetupContainer}>
              {/* Tempo Selector - Above Start Button */}
              <View style={styles.tempoSelectorContainer}>
                <Text style={[styles.tempoSelectorTitle, { color: colors.text }]}>
                  🎚️ Choose Your Tempo
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tempoSelectorButton,
                    { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setShowTempoSelector(!showTempoSelector)}
                  disabled={isPlaying || countdown !== null}
                >
                  <View style={styles.tempoSelectorContent}>
                    <Text style={[styles.tempoSelectorValue, { color: colors.text }]}>
                      {selectedTempo} BPM
                    </Text>
                    <Text style={[styles.tempoSelectorDescription, { color: colors.muted }]}>
                      {TEMPO_OPTIONS.find(t => t.value === selectedTempo)?.description}
                    </Text>
                  </View>
                  <Text style={[styles.tempoSelectorArrow, { color: colors.primary }]}>
                    {showTempoSelector ? '▼' : '▲'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Start Exercise Button */}
              <TouchableOpacity
                style={[
                  styles.startExerciseButton,
                  { 
                    backgroundColor: (isPlaying || countdown !== null) ? colors.muted : colors.primary,
                  }
                ]}
                onPress={startPulseExercise}
                disabled={isPlaying || countdown !== null}
              >
                <Text style={[styles.startExerciseButtonText, { color: colors.background }]}>
                  {countdown !== null ? `Starting in ${countdown}...` : isPlaying ? 'Exercise in progress...' : '🎵 Start Exercise'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tempo Options Dropdown */}
            {showTempoSelector && (
              <View style={styles.tempoDropdownContainer}>
                <View style={[styles.tempoOptions, { backgroundColor: colors.card }]}>
                  {TEMPO_OPTIONS.map((tempo) => (
                    <TouchableOpacity
                      key={tempo.value}
                      style={[
                        styles.tempoOption,
                        { 
                          backgroundColor: selectedTempo === tempo.value ? colors.primary : 'transparent',
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => {
                        setSelectedTempo(tempo.value);
                        setShowTempoSelector(false);
                      }}
                    >
                      <Text style={[
                        styles.tempoOptionText,
                        { color: selectedTempo === tempo.value ? colors.background : colors.text }
                      ]}>
                        {tempo.label}
                      </Text>
                      <Text style={[
                        styles.tempoOptionDescription,
                        { color: selectedTempo === tempo.value ? colors.background : colors.muted }
                      ]}>
                        {tempo.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Enhanced Pulse Exercise Area */}
            <View style={styles.pulseContainer}>
              {/* Exercise Status Display */}
              {countdown !== null ? (
                <View style={styles.countdownContainer}>
                  <Text style={[styles.countdownText, { color: colors.primary }]}>
                    {countdown}
                  </Text>
                  <Text style={[styles.countdownLabel, { color: colors.muted }]}>
                    Get ready to tap...
                  </Text>
                </View>
              ) : exerciseActive ? (
                /* Active Exercise Area - Tap to the beat */
                <View style={styles.activeExerciseArea}>
                  <View style={styles.exerciseHeader}>
                    <Text style={[styles.exerciseStatusText, { color: colors.text }]}>
                      🎵 Exercise Active
                    </Text>
                    <Text style={[styles.exerciseSubtext, { color: colors.muted }]}>
                      Tap to the {selectedTempo} BPM beat!
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.enhancedTapArea,
                      { 
                        borderColor: colors.primary,
                        backgroundColor: 'rgba(0,0,0,0.02)',
                      }
                    ]}
                    onPress={handleTapPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tapAreaContent}>
                      <Animated.View 
                        style={[
                          styles.enhancedPulseCircle,
                          { 
                            backgroundColor: colors.primary,
                            transform: [
                              { scale: pulseAnimation },
                              { scale: tapAnimation }
                            ]
                          }
                        ]}
                      />
                      <Text style={[styles.enhancedPulseText, { color: colors.text }]}>
                        Tap Here!
                      </Text>
                      <Text style={[styles.tapInstructions, { color: colors.muted }]}>
                        Follow the metronome beat
                      </Text>
                    </View>
                    
                    {/* Real-time feedback */}
                    {tapFeedback && (
                      <Animated.View 
                        style={[
                          styles.enhancedTapFeedback,
                          { 
                            backgroundColor: tapFeedback.color,
                            transform: [{ scale: tapAnimation }]
                          }
                        ]}
                      >
                        <Text style={styles.enhancedTapFeedbackText}>
                          {tapFeedback.message}
                        </Text>
                      </Animated.View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Setup Phase - Show exercise preview */
                <View style={styles.setupPhaseArea}>
                  <View style={styles.previewHeader}>
                    <Text style={[styles.setupPhaseTitle, { color: colors.text }]}>
                      🎯 Exercise Preview
                    </Text>
                    <Text style={[styles.previewDescription, { color: colors.muted }]}>
                      Get ready to tap to the {selectedTempo} BPM rhythm
                    </Text>
                  </View>
                  <View style={[
                    styles.enhancedPreviewArea,
                    { 
                      borderColor: colors.muted,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                    }
                  ]}>
                    <Animated.View 
                      style={[
                        styles.enhancedPreviewCircle,
                        { 
                          backgroundColor: colors.muted,
                          transform: [{ scale: pulseAnimation }]
                        }
                      ]}
                    />
                    <Text style={[styles.enhancedPreviewText, { color: colors.muted }]}>
                      This area will become active
                    </Text>
                    <Text style={[styles.enhancedPreviewSubtext, { color: colors.muted }]}>
                      Tap here to follow the beat
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Exercise Stats */}
            {isPlaying && (
              <View style={styles.exerciseStats}>
                <Text style={[styles.statsText, { color: colors.text }]}>
                  Beats: {correctBeats}/{totalBeats} | 
                  Accuracy: {totalBeats > 0 ? Math.round((correctBeats / totalBeats) * 100) : 0}%
                </Text>
              </View>
            )}

            {pulseAccuracy > 0 && (
              <View style={styles.resultContainer}>
                <Text style={[styles.resultText, { color: colors.primary }]}>
                  Final Accuracy: {pulseAccuracy}% - {pulseAccuracy >= 80 ? 'Excellent! 🎯' : pulseAccuracy >= 60 ? 'Good job! 👍' : 'Keep practicing! 💪'}
                </Text>
                <Text style={[styles.resultSubtext, { color: colors.muted }]}>
                  Correct beats: {correctBeats}/{totalBeats}
                </Text>
              </View>
            )}
          </View>
        );

      case 'notes':
        return (
          <View style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              🎼 Note Values on the Staff
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Learn how notes appear on the musical staff and their durations. {noteMatches}/8 completed.
            </Text>

            {/* Four Separate Staffs for Note Duration Understanding */}
            <View style={[styles.staffContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.staffTitle, { color: colors.text }]}>
                Note Duration in 4/4 Time Signature
              </Text>
              <Text style={[styles.staffSubtitle, { color: colors.muted }]}>
                Each staff shows how many notes fit in one measure
              </Text>
              
              {/* Four Staffs Container */}
              <View style={styles.fourStaffsContainer}>
                {/* Whole Note Staff - 1 whole note = 4 beats */}
                <View style={styles.individualStaffContainer}>
                  <Text style={[styles.staffNoteType, { color: colors.text }]}>Whole Note</Text>
                  <Text style={[styles.staffNoteCount, { color: colors.muted }]}>1 note = 4 beats</Text>
                  <View style={styles.smallStaffContainer}>
                    <View style={styles.smallStaffLines}>
                      {[0, 1, 2, 3, 4].map((line) => (
                        <View 
                          key={line} 
                          style={[
                            styles.smallStaffLine, 
                            { backgroundColor: colors.text }
                          ]} 
                        />
                      ))}
                    </View>
                    {/* Treble Clef on the left */}
                    <View style={[styles.smallClefPosition, { left: 5 }]}>
                      <Text style={[styles.smallTrebleClef, { color: colors.text }]}>𝄞</Text>
                    </View>
                    {/* Time Signature */}
                    <View style={[styles.smallTimeSignaturePosition, { left: 25 }]}>
                      <View style={styles.smallTimeSignatureStack}>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                      </View>
                    </View>
                    {/* Whole Note centered on staff */}
                    <View style={[styles.smallNotePosition, { left: 60, top: 20 }]}>
                      <SvgUri
                        width={20}
                        height={20}
                        uri="http://localhost:4000/note-svg/whole-note.svg"
                        color={colors.text}
                        style={{ opacity: 1 }}
                      />
                    </View>
                  </View>
                </View>

                {/* Half Note Staff - 2 half notes = 4 beats */}
                <View style={styles.individualStaffContainer}>
                  <Text style={[styles.staffNoteType, { color: colors.text }]}>Half Note</Text>
                  <Text style={[styles.staffNoteCount, { color: colors.muted }]}>2 notes = 4 beats</Text>
                  <View style={styles.smallStaffContainer}>
                    <View style={styles.smallStaffLines}>
                      {[0, 1, 2, 3, 4].map((line) => (
                        <View 
                          key={line} 
                          style={[
                            styles.smallStaffLine, 
                            { backgroundColor: colors.text }
                          ]} 
                        />
                      ))}
                    </View>
                    {/* Treble Clef on the left */}
                    <View style={[styles.smallClefPosition, { left: 5 }]}>
                      <Text style={[styles.smallTrebleClef, { color: colors.text }]}>𝄞</Text>
                    </View>
                    {/* Time Signature */}
                    <View style={[styles.smallTimeSignaturePosition, { left: 25 }]}>
                      <View style={styles.smallTimeSignatureStack}>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                      </View>
                    </View>
                    {/* Half Notes positioned on staff */}
                    <View style={[styles.smallNotePosition, { left: 50, top: 20 }]}>
                      <SvgUri
                        width={20}
                        height={20}
                        uri="http://localhost:4000/note-svg/half_note.svg"
                        color={colors.text}
                        style={{ opacity: 1 }}
                      />
                    </View>
                    <View style={[styles.smallNotePosition, { left: 90, top: 20 }]}>
                      <SvgUri
                        width={20}
                        height={20}
                        uri="http://localhost:4000/note-svg/half_note.svg"
                        color={colors.text}
                        style={{ opacity: 1 }}
                      />
                    </View>
                  </View>
                </View>

                {/* Quarter Note Staff - 4 quarter notes = 4 beats */}
                <View style={styles.individualStaffContainer}>
                  <Text style={[styles.staffNoteType, { color: colors.text }]}>Quarter Note</Text>
                  <Text style={[styles.staffNoteCount, { color: colors.muted }]}>4 notes = 4 beats</Text>
                  <View style={styles.smallStaffContainer}>
                    <View style={styles.smallStaffLines}>
                      {[0, 1, 2, 3, 4].map((line) => (
                        <View 
                          key={line} 
                          style={[
                            styles.smallStaffLine, 
                            { backgroundColor: colors.text }
                          ]} 
                        />
                      ))}
                    </View>
                    {/* Treble Clef on the left */}
                    <View style={[styles.smallClefPosition, { left: 5 }]}>
                      <Text style={[styles.smallTrebleClef, { color: colors.text }]}>𝄞</Text>
                    </View>
                    {/* Time Signature */}
                    <View style={[styles.smallTimeSignaturePosition, { left: 25 }]}>
                      <View style={styles.smallTimeSignatureStack}>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                      </View>
                    </View>
                    {/* Quarter Notes positioned on staff */}
                    <View style={[styles.smallNotePosition, { left: 45, top: 20 }]}>
                      <Text style={[{ fontSize: 18, fontWeight: '600', color: colors.text }]}>♩</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 65, top: 20 }]}>
                      <Text style={[{ fontSize: 18, fontWeight: '600', color: colors.text }]}>♩</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 85, top: 20 }]}>
                      <Text style={[{ fontSize: 18, fontWeight: '600', color: colors.text }]}>♩</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 105, top: 20 }]}>
                      <Text style={[{ fontSize: 18, fontWeight: '600', color: colors.text }]}>♩</Text>
                    </View>
                  </View>
                </View>

                {/* Eighth Note Staff - 8 eighth notes = 4 beats */}
                <View style={styles.individualStaffContainer}>
                  <Text style={[styles.staffNoteType, { color: colors.text }]}>Eighth Note</Text>
                  <Text style={[styles.staffNoteCount, { color: colors.muted }]}>8 notes = 4 beats</Text>
                  <View style={styles.smallStaffContainer}>
                    <View style={styles.smallStaffLines}>
                      {[0, 1, 2, 3, 4].map((line) => (
                        <View 
                          key={line} 
                          style={[
                            styles.smallStaffLine, 
                            { backgroundColor: colors.text }
                          ]} 
                        />
                      ))}
                    </View>
                    {/* Treble Clef on the left */}
                    <View style={[styles.smallClefPosition, { left: 5 }]}>
                      <Text style={[styles.smallTrebleClef, { color: colors.text }]}>𝄞</Text>
                    </View>
                    {/* Time Signature */}
                    <View style={[styles.smallTimeSignaturePosition, { left: 25 }]}>
                      <View style={styles.smallTimeSignatureStack}>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                        <Text style={[styles.smallTimeSignature, { color: colors.text }]}>4</Text>
                      </View>
                    </View>
                    {/* Eighth Notes positioned on staff */}
                    <View style={[styles.smallNotePosition, { left: 40, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 52, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 64, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 76, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 88, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 100, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 112, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                    <View style={[styles.smallNotePosition, { left: 124, top: 20 }]}>
                      <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.text }]}>♪</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>



            {/* Interactive Note Cards */}
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
                  <MusicalNote 
                    type={note.type} 
                    size={32} 
                    color={colors.text} 
                    style={styles.noteSymbol}
                  />
                  <Text style={[styles.noteName, { color: colors.text }]}>
                    {note.name}
                  </Text>
                  <Text style={[styles.noteDescription, { color: colors.muted }]}>
                    {note.description}
                  </Text>
                  
                  {/* Staff representation */}
                  <View style={styles.miniStaff}>
                    <View style={styles.miniStaffLine} />
                    <View style={styles.miniStaffLine} />
                    <View style={styles.miniStaffLine} />
                    <View style={styles.miniStaffLine} />
                    <View style={styles.miniStaffLine} />
                    <View style={styles.miniNote}>
                      <MusicalNote 
                        type={note.type} 
                        size={16} 
                        color={colors.primary} 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.targetContainer}>
              <Text style={[styles.targetText, { color: colors.text }]}>
                Find: {shuffledNotes[noteMatches % 4]?.name}
              </Text>
              <Text style={[styles.targetHint, { color: colors.muted }]}>
                Tap the card that matches this note value
              </Text>
            </View>
          </View>
        );

      case 'patterns':
        return (
          <View style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              🎹 Rhythm Pattern Recognition
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Learn to identify and recreate common rhythm patterns. {patternSuccess}/4 completed.
            </Text>

            {/* Technical Music Theory Section */}
            <View style={[styles.theoryContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.theoryTitle, { color: colors.text }]}>
                📚 Rhythm Pattern Theory
              </Text>
              <Text style={[styles.theoryText, { color: colors.muted }]}>
                Rhythm patterns combine different note values to create musical phrases. 
                Common patterns include syncopation, dotted rhythms, and rhythmic motifs.
              </Text>
            </View>

            {/* Pattern Examples with Staff Notation */}
            <View style={[styles.patternExamplesContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.patternExamplesTitle, { color: colors.text }]}>
                Common Rhythm Patterns in 4/4 Time
              </Text>
              
              {/* Pattern 1: Basic Quarter Note Pattern */}
              <View style={styles.patternExample}>
                <Text style={[styles.patternLabel, { color: colors.text }]}>
                  Pattern 1: Steady Quarter Notes
                </Text>
                <View style={styles.staffPatternContainer}>
                  <View style={styles.staffPatternLines}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <View key={line} style={[styles.staffPatternLine, { backgroundColor: colors.text }]} />
                    ))}
                  </View>
                  {/* Treble Clef */}
                  <View style={[styles.staffPatternClef, { left: 5 }]}>
                    <Text style={[styles.staffPatternClefText, { color: colors.text }]}>𝄞</Text>
                  </View>
                  {/* Time Signature */}
                  <View style={[styles.staffPatternTimeSig, { left: 25 }]}>
                    <View style={styles.staffPatternTimeSigStack}>
                      <Text style={[styles.staffPatternTimeSigText, { color: colors.text }]}>4</Text>
                      <Text style={[styles.staffPatternTimeSigText, { color: colors.text }]}>4</Text>
                    </View>
                  </View>
                  {/* Quarter Notes */}
                  {[45, 65, 85, 105].map((left, index) => (
                    <View key={index} style={[styles.staffPatternNote, { left, top: 20 }]}>
                      <Text style={[styles.staffPatternNoteText, { color: colors.text }]}>♩</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.patternDescription, { color: colors.muted }]}>
                  Four quarter notes = 4 beats (♩ ♩ ♩ ♩)
                </Text>
              </View>

              {/* Pattern 2: Syncopated Pattern */}
              <View style={styles.patternExample}>
                <Text style={[styles.patternLabel, { color: colors.text }]}>
                  Pattern 2: Syncopated Rhythm
                </Text>
                <View style={styles.staffPatternContainer}>
                  <View style={styles.staffPatternLines}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <View key={line} style={[styles.staffPatternLine, { backgroundColor: colors.text }]} />
                    ))}
                  </View>
                  {/* Treble Clef */}
                  <View style={[styles.staffPatternClef, { left: 5 }]}>
                    <Text style={[styles.staffPatternClefText, { color: colors.text }]}>𝄞</Text>
                  </View>
                  {/* Time Signature */}
                  <View style={[styles.staffPatternTimeSig, { left: 25 }]}>
                    <View style={styles.staffPatternTimeSigStack}>
                      <Text style={[styles.staffPatternTimeSigText, { color: colors.text }]}>4</Text>
                      <Text style={[styles.staffPatternTimeSigText, { color: colors.text }]}>4</Text>
                    </View>
                  </View>
                  {/* Syncopated Pattern: Quarter, Eighth-Eighth, Quarter */}
                  <View style={[styles.staffPatternNote, { left: 45, top: 20 }]}>
                    <Text style={[styles.staffPatternNoteText, { color: colors.text }]}>♩</Text>
                  </View>
                  <View style={[styles.staffPatternNote, { left: 70, top: 20 }]}>
                    <Text style={[styles.staffPatternNoteText, { color: colors.text }]}>♪</Text>
                  </View>
                  <View style={[styles.staffPatternNote, { left: 85, top: 20 }]}>
                    <Text style={[styles.staffPatternNoteText, { color: colors.text }]}>♪</Text>
                  </View>
                  <View style={[styles.staffPatternNote, { left: 105, top: 20 }]}>
                    <Text style={[styles.staffPatternNoteText, { color: colors.text }]}>♩</Text>
                  </View>
                </View>
                <Text style={[styles.patternDescription, { color: colors.muted }]}>
                  Quarter, Eighth-Eighth, Quarter (♩ ♪♪ ♩) - Syncopated rhythm
                </Text>
              </View>
            </View>

            {/* Interactive Pattern Practice */}
            <View style={[styles.patternPracticeContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.patternPracticeTitle, { color: colors.text }]}>
                🎵 Practice Pattern Recognition
              </Text>
              <Text style={[styles.patternPracticeDescription, { color: colors.muted }]}>
                Listen to the syncopated pattern with metronome beat. Piano notes play the pattern, metronome provides the steady beat.
              </Text>
              
              <TouchableOpacity
                style={[styles.patternPracticeButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  try {
                    const beatDuration = (60 / selectedTempo) * 1000;
                    
                    // Play syncopated pattern: ♩ ♪♪ ♩ (4/4 time)
                    // This creates syncopation by placing eighth notes on the "and" of beat 2
                    const pattern = [
                      { type: 'quarter', beats: 1, position: 'beat 1' },
                      { type: 'eighth', beats: 0.5, position: 'and of 2' },
                      { type: 'eighth', beats: 0.5, position: 'beat 3' },
                      { type: 'quarter', beats: 1, position: 'beat 4' }
                    ];
                    
                    console.log(`Playing syncopated pattern at ${selectedTempo} BPM`);
                    
                    // Start background metronome for the underlying beat
                    startBackgroundMetronome();
                    
                    // Play the pattern with proper timing
                    for (let i = 0; i < pattern.length; i++) {
                      const note = pattern[i];
                      
                      // Play piano note for each note in the pattern
                      await playPianoNote();
                      
                      // Wait for the appropriate duration
                      if (note.beats === 1) {
                        // Quarter note - wait full beat duration
                        await new Promise(resolve => setTimeout(resolve, beatDuration));
                      } else if (note.beats === 0.5) {
                        // Eighth note - wait half beat duration
                        await new Promise(resolve => setTimeout(resolve, beatDuration * 0.5));
                      }
                    }
                    
                    // Stop the background metronome after pattern completes
                    stopBackgroundMetronome();
                    
                    console.log('Syncopated pattern completed successfully');
                  } catch (error) {
                    console.error('Error playing syncopated pattern:', error);
                    Alert.alert('Error', 'Failed to play pattern. Please try again.');
                    stopBackgroundMetronome(); // Ensure metronome stops on error
                  }
                  
                  setPatternSuccess(prev => prev + 1);
                  setStreak(prev => prev + 1);
                }}
              >
                <Text style={[styles.patternPracticeButtonText, { color: colors.background }]}>
                  🎵 Play Syncopated Pattern with Metronome (♩ ♪♪ ♩)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'meter':
        return (
          <View style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              🕐 Time Signature & Meter Recognition
            </Text>
            <Text style={[styles.phaseDescription, { color: colors.muted }]}>
              Learn to identify different time signatures and their rhythmic feel. {meterSuccess}/8 completed.
            </Text>

            {/* Technical Music Theory Section */}
            <View style={[styles.theoryContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.theoryTitle, { color: colors.text }]}>
                📚 Time Signature Theory
              </Text>
              <Text style={[styles.theoryText, { color: colors.muted }]}>
                Time signatures tell us how many beats are in each measure and which note gets one beat. 
                The top number indicates beats per measure, the bottom number indicates the note value that equals one beat.
              </Text>
            </View>

            {/* Meter Examples with Staff Notation */}
            <View style={[styles.meterExamplesContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.meterExamplesTitle, { color: colors.text }]}>
                Common Time Signatures
              </Text>
              
              {/* 2/4 Time Signature */}
              <View style={styles.meterExample}>
                <Text style={[styles.meterLabel, { color: colors.text }]}>
                  2/4 Time - Two Quarter Notes per Measure
                </Text>
                <View style={styles.staffMeterContainer}>
                  <View style={styles.staffMeterLines}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <View key={line} style={[styles.staffMeterLine, { backgroundColor: colors.text }]} />
                    ))}
                  </View>
                  {/* Treble Clef */}
                  <View style={[styles.staffMeterClef, { left: 5 }]}>
                    <Text style={[styles.staffMeterClefText, { color: colors.text }]}>𝄞</Text>
                  </View>
                  {/* Time Signature 2/4 */}
                  <View style={[styles.staffMeterTimeSig, { left: 25 }]}>
                    <View style={styles.staffMeterTimeSigStack}>
                      <Text style={[styles.staffMeterTimeSigText, { color: colors.text }]}>2</Text>
                      <Text style={[styles.staffMeterTimeSigText, { color: colors.text }]}>4</Text>
                    </View>
                  </View>
                  {/* Two Quarter Notes */}
                  <View style={[styles.staffMeterNote, { left: 50, top: 20 }]}>
                    <Text style={[styles.staffMeterNoteText, { color: colors.text }]}>♩</Text>
                  </View>
                  <View style={[styles.staffMeterNote, { left: 90, top: 20 }]}>
                    <Text style={[styles.staffMeterNoteText, { color: colors.text }]}>♩</Text>
                  </View>
                </View>
                <Text style={[styles.meterDescription, { color: colors.muted }]}>
                  Strong-weak beat pattern, common in marches
                </Text>
              </View>

              {/* 3/4 Time Signature */}
              <View style={styles.meterExample}>
                <Text style={[styles.meterLabel, { color: colors.text }]}>
                  3/4 Time - Three Quarter Notes per Measure
                </Text>
                <View style={styles.staffMeterContainer}>
                  <View style={styles.staffMeterLines}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <View key={line} style={[styles.staffMeterLine, { backgroundColor: colors.text }]} />
                    ))}
                  </View>
                  {/* Treble Clef */}
                  <View style={[styles.staffMeterClef, { left: 5 }]}>
                    <Text style={[styles.staffMeterClefText, { color: colors.text }]}>𝄞</Text>
                  </View>
                  {/* Time Signature 3/4 */}
                  <View style={[styles.staffMeterTimeSig, { left: 25 }]}>
                    <View style={styles.staffMeterTimeSigStack}>
                      <Text style={[styles.staffMeterTimeSigText, { color: colors.text }]}>3</Text>
                      <Text style={[styles.staffMeterTimeSigText, { color: colors.text }]}>4</Text>
                    </View>
                  </View>
                  {/* Three Quarter Notes */}
                  <View style={[styles.staffMeterNote, { left: 45, top: 20 }]}>
                    <Text style={[styles.staffMeterNoteText, { color: colors.text }]}>♩</Text>
                  </View>
                  <View style={[styles.staffMeterNote, { left: 70, top: 20 }]}>
                    <Text style={[styles.staffMeterNoteText, { color: colors.text }]}>♩</Text>
                  </View>
                  <View style={[styles.staffMeterNote, { left: 95, top: 20 }]}>
                    <Text style={[styles.staffMeterNoteText, { color: colors.text }]}>♩</Text>
                  </View>
                </View>
                <Text style={[styles.meterDescription, { color: colors.muted }]}>
                  Strong-weak-weak pattern, waltz rhythm
                </Text>
              </View>

              {/* 4/4 Time Signature */}
              <View style={styles.meterExample}>
                <Text style={[styles.meterLabel, { color: colors.text }]}>
                  4/4 Time - Four Quarter Notes per Measure
                </Text>
                <View style={styles.staffMeterContainer}>
                  <View style={styles.staffMeterLines}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <View key={line} style={[styles.staffMeterLine, { backgroundColor: colors.text }]} />
                    ))}
                  </View>
                  {/* Treble Clef */}
                  <View style={[styles.staffMeterClef, { left: 5 }]}>
                    <Text style={[styles.staffMeterClefText, { color: colors.text }]}>𝄞</Text>
                  </View>
                  {/* Time Signature 4/4 */}
                  <View style={[styles.staffMeterTimeSig, { left: 25 }]}>
                    <View style={styles.staffMeterTimeSigStack}>
                      <Text style={[styles.staffMeterTimeSigText, { color: colors.text }]}>4</Text>
                      <Text style={[styles.staffMeterTimeSigText, { color: colors.text }]}>4</Text>
                    </View>
                  </View>
                  {/* Four Quarter Notes */}
                  {[45, 65, 85, 105].map((left, index) => (
                    <View key={index} style={[styles.staffMeterNote, { left, top: 20 }]}>
                      <Text style={[styles.staffMeterNoteText, { color: colors.text }]}>♩</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.meterDescription, { color: colors.muted }]}>
                  Strong-weak-medium-weak pattern, most common time signature
                </Text>
              </View>
            </View>

            {/* Interactive Meter Recognition */}
            <View style={[styles.meterPracticeContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.meterPracticeTitle, { color: colors.text }]}>
                🎵 Practice Meter Recognition
              </Text>
              <Text style={[styles.meterPracticeDescription, { color: colors.muted }]}>
                Listen to the rhythm and identify the time signature
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
          </View>
        );
    }
  };

      return (
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }} 
        contentContainerStyle={styles.container}
      >
        {/* Breadcrumb Navigation */}
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => navigation.navigate('LessonDetail', { id: 'western-theory-intro' })}
        >
          <Text style={[styles.breadcrumbText, { color: colors.primary }]}>
            ← Back to Beginner Lessons
          </Text>
        </TouchableOpacity>

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
          Phase {(['pulse', 'notes', 'patterns', 'meter'] as Phase[]).indexOf(currentPhase) + 1} of 4
        </Text>
      </View>

      {/* Streak Counter */}
      <View style={styles.streakContainer}>
        <Text style={[styles.streakIcon, { color: colors.primary }]}>🔥</Text>
        <Text style={[styles.streakText, { color: colors.text }]}>
          Rhythm Master: {streak} streak
        </Text>
      </View>

      {/* Theory Section - Always Visible at Top */}
      <View style={[styles.theoryContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.theoryTitle, { color: colors.text }]}>
          📚 Rhythm Theory Basics
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
            The Pulse
          </Text>
          <Text style={[styles.theoryText, { color: colors.muted }]}>
            The pulse is the steady heartbeat of music. It's what you naturally tap along to when listening to your favorite songs!
          </Text>
        </View>

        <View style={styles.theorySection}>
          <Text style={[styles.theorySectionTitle, { color: colors.text }]}>
            Note Values
          </Text>
          <View>
            <View style={styles.theoryRow}>
              <MusicalNote type="whole" size={16} color={colors.muted} />
              <Text style={[styles.theoryText, { color: colors.muted }]}>: 4 beats - the longest note</Text>
            </View>
            <View style={styles.theoryRow}>
              <MusicalNote type="half" size={16} color={colors.muted} />
              <Text style={[styles.theoryText, { color: colors.muted }]}>: 2 beats - half as long</Text>
            </View>
            <View style={styles.theoryRow}>
              <MusicalNote type="quarter" size={16} color={colors.muted} />
              <Text style={[styles.theoryText, { color: colors.muted }]}>: 1 beat - the basic unit</Text>
            </View>
            <View style={styles.theoryRow}>
              <MusicalNote type="eighth" size={16} color={colors.muted} />
              <Text style={[styles.theoryText, { color: colors.muted }]}>: ½ beat - twice as fast</Text>
            </View>
          </View>
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
      </View>

      {/* Phase Navigation */}
      <View style={styles.phaseNavigationContainer}>
        <Text style={[styles.phaseNavigationTitle, { color: colors.text }]}>
          Choose Your Practice Phase:
        </Text>
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
        <Text style={[styles.phaseNavigationSubtitle, { color: colors.muted }]}>
          {currentPhase === 'pulse' && 'Feel the Pulse'}
          {currentPhase === 'notes' && 'Note Values'}
          {currentPhase === 'patterns' && 'Rhythm Patterns'}
          {currentPhase === 'meter' && 'Time Signatures'}
        </Text>
      </View>

      {/* Phase Content */}
      {renderPhaseContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  breadcrumb: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  breadcrumbText: {
    fontSize: 16,
    fontWeight: '600',
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
  countdownContainer: {
    alignItems: 'center',
    gap: 8,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '800',
  },
  countdownLabel: {
    fontSize: 18,
    fontWeight: '600',
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
  patternExamplesContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  patternExamplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  patternExample: {
    marginBottom: 20,
    alignItems: 'center',
  },
  patternLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  staffPatternContainer: {
    width: 140,
    height: 80,
    position: 'relative',
    alignItems: 'center',
  },
  staffPatternLines: {
    width: 120,
    height: 40,
    justifyContent: 'space-between',
    position: 'relative',
  },
  staffPatternLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  staffPatternClef: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffPatternClefText: {
    fontSize: 24,
    fontWeight: '600',
  },
  staffPatternTimeSig: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffPatternTimeSigStack: {
    alignItems: 'center',
  },
  staffPatternTimeSigText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  staffPatternNote: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffPatternNoteText: {
    fontSize: 18,
    fontWeight: '600',
  },
  patternDescription: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  patternPracticeContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  patternPracticeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  patternPracticeDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  patternPracticeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternPracticeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  meterExamplesContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  meterExamplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  meterExample: {
    marginBottom: 20,
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  staffMeterContainer: {
    width: 140,
    height: 80,
    position: 'relative',
    alignItems: 'center',
  },
  staffMeterLines: {
    width: 120,
    height: 40,
    justifyContent: 'space-between',
    position: 'relative',
  },
  staffMeterLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  staffMeterClef: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMeterClefText: {
    fontSize: 24,
    fontWeight: '600',
  },
  staffMeterTimeSig: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMeterTimeSigStack: {
    alignItems: 'center',
  },
  staffMeterTimeSigText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  staffMeterNote: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMeterNoteText: {
    fontSize: 18,
    fontWeight: '600',
  },
  meterPracticeContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  meterPracticeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  meterPracticeDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
  // Enhanced pulse exercise styles
  tempoSection: {
    width: '100%',
    marginBottom: 16,
  },
  tempoButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tempoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tempoButtonSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  tempoSelector: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
    elevation: 5,
    maxHeight: 200,
  },
  tempoOptions: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    overflow: 'hidden',
  },
  tempoOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tempoOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tempoOptionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  tapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 200,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  tapFeedback: {
    position: 'absolute',
    top: -40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapFeedbackText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseStats: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  exerciseSetupContainer: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 16,
    width: '100%',
  },
  tempoSelectorContainer: {
    alignItems: 'center',
    width: '100%',
  },
  tempoSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  tempoSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    maxWidth: 300,
  },
  tempoSelectorContent: {
    flex: 1,
  },
  tempoSelectorValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tempoSelectorDescription: {
    fontSize: 12,
  },
  tempoSelectorArrow: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  startExerciseButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  startExerciseButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tempoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  tempoButtonHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  tempoDropdownContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  noteExplanation: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  beatVisualization: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  beatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metronomeVisualization: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  metronomeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  beatLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  activeExerciseArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  enhancedTapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 200,
    borderRadius: 16,
    borderWidth: 3,
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tapAreaContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedPulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedPulseText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  tapInstructions: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  enhancedTapFeedback: {
    position: 'absolute',
    top: -50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  enhancedTapFeedbackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  setupPhaseArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewDescription: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  enhancedPreviewArea: {
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedPreviewCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    opacity: 0.6,
  },
  enhancedPreviewText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  enhancedPreviewSubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  setupPhaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewArea: {
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  previewCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  previewSubtext: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  targetHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  exerciseSection: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  exerciseSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  exerciseSectionDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  phaseNavigationContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  phaseNavigationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  phaseNavigationSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Staff notation styles
  staffContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  staffTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  staffSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  fourStaffsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
    width: '100%',
  },
  individualStaffContainer: {
    alignItems: 'center',
    minWidth: 140,
    maxWidth: 160,
  },
  staffNoteType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  staffNoteCount: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
    color: '#666',
  },
  smallStaffContainer: {
    width: 140,
    height: 80,
    position: 'relative',
    alignItems: 'center',
  },
  smallStaffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  smallTrebleClef: {
    fontSize: 24,
    fontWeight: '600',
  },
  smallTimeSignatureStack: {
    alignItems: 'center',
  },
  smallTimeSignature: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  smallStaffLines: {
    width: 120,
    height: 40,
    justifyContent: 'space-between',
    position: 'relative',
  },
  smallStaffLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  smallNotePosition: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallClefPosition: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallTimeSignaturePosition: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSignatureStack: {
    alignItems: 'center',
  },
  timeSignature: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  staffLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  staffNotesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    flexWrap: 'wrap',
    gap: 16,
  },
  staffNoteExample: {
    alignItems: 'center',
    minWidth: 80,
  },
  measureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  measureLine: {
    width: 1,
    height: 60,
    backgroundColor: '#000',
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  noteDuration: {
    fontSize: 10,
    textAlign: 'center',
  },
  miniStaff: {
    width: 40,
    height: 30,
    justifyContent: 'space-between',
    marginTop: 8,
    position: 'relative',
  },
  miniStaffLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
  },
  miniNote: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { translateY: -8 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffWithNote: {
    width: 60,
    height: 40,
    justifyContent: 'space-between',
    position: 'relative',
  },
  trebleClefStaff: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 20,
  },
  trebleClef: {
    fontSize: 48,
    fontWeight: '600',
  },
  staffLinesContainer: {
    width: '100%',
    position: 'relative',
    height: 120,
  },
  staffLines: {
    width: '100%',
    height: 80,
    justifyContent: 'space-between',
    position: 'absolute',
    top: 20,
  },
  notesOnStaff: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  notePosition: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerLine: {
    width: 30,
    height: 1,
    position: 'absolute',
    top: 12,
  },
  noteOnStaff: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 16,
  },
  noteLabelItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  metronomeIndicator: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  metronomeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  theoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
});


