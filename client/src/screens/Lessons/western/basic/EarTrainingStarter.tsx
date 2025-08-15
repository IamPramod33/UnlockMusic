import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../../../theme';
import PianoView from '../../../../components/western/PianoView';
import { audioPlayer } from '../../../../services/audio';
import { resolveMediaUrl } from '../../../../services/api';
import type { Lesson } from '../../../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../navigation/AppNavigator';

type Props = { lesson: Lesson };

type Phase = 'note-recognition' | 'direction' | 'step-skip' | 'echo' | 'scale-degrees' | 'intervals' | 'chord-tones' | 'melodic-patterns';
type Direction = 'up' | 'down' | 'same';
type Pattern = 'steps' | 'skips' | 'mixed';

interface NoteSequence {
  notes: string[];
  direction?: Direction;
  pattern?: Pattern;
  answer?: string;
  scale?: string;
  degree?: string;
  interval?: string;
  chord?: string;
}

const PROMPT_DELAY_MS = 1200;
const SEQUENCE_DELAY_MS = 800;

export default function EarTrainingStarter({ lesson }: Props) {
  function toAssetName(note: string): string {
    // Accept notes like C4, C#4, Db4
    if (note.includes('b')) {
      // Map flats to enharmonic sharps for asset names
      const map: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
      return note.replace(/([A-G]b)(\d)/, (_, p1: string, p2: string) => `${(map[p1] || p1).replace('#','sharp')}${p2}`);
    }
    if (note.includes('#')) return note.replace('#', 'sharp');
    return note;
  }
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentPhase, setCurrentPhase] = useState<Phase>('note-recognition');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [highlightNotes, setHighlightNotes] = useState<string[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(false); // Audio Only by default
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [currentSequence, setCurrentSequence] = useState<NoteSequence | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [echoMode, setEchoMode] = useState<'listening' | 'playing' | null>(null);
  const [userEchoSequence, setUserEchoSequence] = useState<string[]>([]);
  const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Phase configurations
  const phaseConfig = {
    'note-recognition': {
      title: 'Phase 1: Note Recognition',
      description: 'Listen and identify individual notes by their letter names',
      targetScore: 8,
      sequences: [
        { notes: ['C4'], answer: 'C' },
        { notes: ['D4'], answer: 'D' },
        { notes: ['E4'], answer: 'E' },
        { notes: ['F4'], answer: 'F' },
        { notes: ['G4'], answer: 'G' },
        { notes: ['A4'], answer: 'A' },
        { notes: ['B4'], answer: 'B' },
        { notes: ['C5'], answer: 'C' },
        { notes: ['D5'], answer: 'D' },
        { notes: ['E5'], answer: 'E' },
      ]
    },
    'direction': {
      title: 'Phase 2: Melodic Direction',
      description: 'Identify if the melody goes up, down, or stays the same',
      targetScore: 7,
      sequences: [
        { notes: ['C4', 'D4'], direction: 'up', answer: 'up' },
        { notes: ['D4', 'C4'], direction: 'down', answer: 'down' },
        { notes: ['E4', 'F4'], direction: 'up', answer: 'up' },
        { notes: ['F4', 'E4'], direction: 'down', answer: 'down' },
        { notes: ['G4', 'A4'], direction: 'up', answer: 'up' },
        { notes: ['A4', 'G4'], direction: 'down', answer: 'down' },
        { notes: ['C4', 'C4'], direction: 'same', answer: 'same' },
        { notes: ['D4', 'E4'], direction: 'up', answer: 'up' },
        { notes: ['F4', 'G4'], direction: 'up', answer: 'up' },
        { notes: ['B4', 'A4'], direction: 'down', answer: 'down' },
      ]
    },
    'step-skip': {
      title: 'Phase 3: Steps vs Skips',
      description: 'Identify if notes move by steps (adjacent) or skips (jumping)',
      targetScore: 6,
      sequences: [
        { notes: ['C4', 'D4', 'E4'], pattern: 'steps', answer: 'steps' },
        { notes: ['C4', 'E4', 'G4'], pattern: 'skips', answer: 'skips' },
        { notes: ['D4', 'F4', 'A4'], pattern: 'skips', answer: 'skips' },
        { notes: ['E4', 'F4', 'G4'], pattern: 'steps', answer: 'steps' },
        { notes: ['C4', 'D4', 'F4'], pattern: 'mixed', answer: 'mixed' },
        { notes: ['G4', 'A4', 'B4'], pattern: 'steps', answer: 'steps' },
        { notes: ['D4', 'F4', 'A4'], pattern: 'skips', answer: 'skips' },
        { notes: ['F4', 'G4', 'A4'], pattern: 'steps', answer: 'steps' },
      ]
    },
    'echo': {
      title: 'Phase 4: Echo Practice',
      description: 'Listen to a melody and play it back by tapping the keys',
      targetScore: 2,
      sequences: [
        { notes: ['C4', 'D4', 'E4'] },
        { notes: ['D4', 'E4', 'F4'] },
        { notes: ['E4', 'F4', 'G4'] },
      ]
    },
    'scale-degrees': {
      title: 'Phase 5: Scale Degrees',
      description: 'Identify notes by their position in the scale',
      targetScore: 7,
      sequences: [
        { notes: ['C4'], scale: 'C', degree: '1st', answer: 'C' },
        { notes: ['E4'], scale: 'C', degree: '3rd', answer: 'E' },
        { notes: ['G4'], scale: 'C', degree: '5th', answer: 'G' },
        { notes: ['F4'], scale: 'C', degree: '4th', answer: 'F' },
        { notes: ['A4'], scale: 'C', degree: '6th', answer: 'A' },
        { notes: ['B4'], scale: 'C', degree: '7th', answer: 'B' },
        { notes: ['D4'], scale: 'C', degree: '2nd', answer: 'D' },
        { notes: ['C5'], scale: 'C', degree: '8th', answer: 'C' },
      ]
    },
    'intervals': {
      title: 'Phase 6: Intervals',
      description: 'Identify notes by their interval relationship',
      targetScore: 6,
      sequences: [
        { notes: ['C4', 'G4'], interval: 'P5', answer: 'G' },
        { notes: ['F4', 'C5'], interval: 'P4', answer: 'C' },
        { notes: ['C4', 'E4'], interval: 'M3', answer: 'E' },
        { notes: ['G4', 'B4'], interval: 'M3', answer: 'B' },
        { notes: ['D4', 'A4'], interval: 'P5', answer: 'A' },
        { notes: ['E4', 'B4'], interval: 'P5', answer: 'B' },
        { notes: ['C4', 'F4'], interval: 'P4', answer: 'F' },
        { notes: ['G4', 'D5'], interval: 'P5', answer: 'D' },
      ]
    },
    'chord-tones': {
      title: 'Phase 7: Chord Tones',
      description: 'Identify notes within chord contexts',
      targetScore: 6,
      sequences: [
        { notes: ['C4', 'E4', 'G4'], chord: 'C major', answer: 'C' },
        { notes: ['F4', 'A4', 'C5'], chord: 'F major', answer: 'F' },
        { notes: ['G4', 'B4', 'D5'], chord: 'G major', answer: 'G' },
        { notes: ['C4', 'E4', 'G4'], chord: 'C major', answer: 'E' },
        { notes: ['F4', 'A4', 'C5'], chord: 'F major', answer: 'A' },
        { notes: ['G4', 'B4', 'D5'], chord: 'G major', answer: 'B' },
        { notes: ['C4', 'E4', 'G4'], chord: 'C major', answer: 'G' },
        { notes: ['F4', 'A4', 'C5'], chord: 'F major', answer: 'C' },
      ]
    },
    'melodic-patterns': {
      title: 'Phase 8: Melodic Patterns',
      description: 'Identify notes within melodic sequences',
      targetScore: 5,
      sequences: [
        { notes: ['C4', 'D4', 'E4', 'F4'], pattern: 'C major scale', answer: 'F' },
        { notes: ['C4', 'E4', 'G4', 'C5'], pattern: 'C major arpeggio', answer: 'C' },
        { notes: ['F4', 'G4', 'A4', 'B4'], pattern: 'F major scale', answer: 'B' },
        { notes: ['G4', 'A4', 'B4', 'C5'], pattern: 'G major scale', answer: 'C' },
        { notes: ['C4', 'E4', 'G4', 'E4'], pattern: 'C major broken chord', answer: 'E' },
        { notes: ['F4', 'A4', 'C5', 'A4'], pattern: 'F major broken chord', answer: 'A' },
        { notes: ['G4', 'B4', 'D5', 'B4'], pattern: 'G major broken chord', answer: 'B' },
        { notes: ['C4', 'D4', 'E4', 'D4'], pattern: 'C major neighbor tone', answer: 'D' },
      ]
    }
  };

  const currentConfig = useMemo(() => phaseConfig[currentPhase], [currentPhase]);

  useEffect(() => {
    if (currentQuestion < currentConfig.sequences.length) {
      startNewQuestion();
    } else {
      checkPhaseCompletion();
    }
  }, [currentQuestion, currentPhase]);

  useEffect(() => {
    setPhaseProgress((score.correct / currentConfig.sequences.length) * 100);
  }, [score, currentPhase]);

  const startNewQuestion = useCallback(() => {
    const sequence = currentConfig.sequences[currentQuestion];
    setCurrentSequence(sequence as NoteSequence);
    setUserAnswer(null);
    setFeedback(null);
    setHintUsed(false);
    setUserEchoSequence([]);
    
    // For echo phase, set listening mode
    if (currentPhase === 'echo') {
      setEchoMode('listening');
    } else {
      setEchoMode(null);
    }
    
    // Play the sequence after a short delay
    setTimeout(() => {
      playSequence(sequence.notes);
    }, 500);
  }, [currentConfig, currentQuestion, currentPhase]);

  const playSequence = useCallback(async (notes: string[]) => {
    setIsPlaying(true);
    setHighlightNotes([]);
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      setHighlightNotes([note]);
      
      try {
        const asset = toAssetName(note);
        const path = `/instruments/piano/${asset}.mp3`;
        const mediaUrl = resolveMediaUrl(path);
        if (mediaUrl) await audioPlayer.play(mediaUrl);
      } catch (error) {
        console.error('Error playing note:', error);
      }
      
      if (i < notes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, SEQUENCE_DELAY_MS));
      }
    }
    
    setTimeout(() => {
      setHighlightNotes([]);
      setIsPlaying(false);
      
      // For echo phase, switch to playing mode after listening
      if (currentPhase === 'echo') {
        setEchoMode('playing');
      }
    }, 500);
  }, [currentPhase]);

  const handleAnswer = useCallback((answer: string) => {
    if (userAnswer !== null || isPlaying) return;
    
    setUserAnswer(answer);
    const isCorrect = answer === currentSequence?.answer;
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setStreak(prev => prev + 1);
      setFeedback('correct');
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      setStreak(0);
      setFeedback('incorrect');
      
      // In practice mode, show correct answer and allow retry
      if (practiceMode) {
        setTimeout(() => {
          setFeedback(null);
          setUserAnswer(null);
          // Don't advance to next question, allow retry
        }, PROMPT_DELAY_MS);
        return;
      }
    }
    
    // Clear feedback after delay
    setTimeout(() => {
      setFeedback(null);
      setCurrentQuestion(prev => prev + 1);
    }, PROMPT_DELAY_MS);
  }, [userAnswer, isPlaying, currentSequence, practiceMode]);

  const handleHint = useCallback(() => {
    if (hintUsed || !currentSequence) return;
    setHintUsed(true);
    setShowKeyboard(true);
    setHighlightNotes(currentSequence.notes);
    
    // Clear hint after 3 seconds
    setTimeout(() => {
      setHighlightNotes([]);
    }, 3000);
  }, [hintUsed, currentSequence]);

  const handleReplay = useCallback(() => {
    if (currentSequence && !isPlaying) {
      playSequence(currentSequence.notes);
    }
  }, [currentSequence, isPlaying, playSequence]);

  const checkPhaseCompletion = useCallback(() => {
    const accuracy = (score.correct / score.total) * 100;
    const passed = score.correct >= currentConfig.targetScore;
    
    if (passed) {
      if (currentPhase === 'echo') {
        Alert.alert(
          'Congratulations! 🎉',
          `You've completed all ear training phases with ${Math.round(accuracy)}% accuracy!`,
          [{ text: 'Continue', onPress: () => {} }]
        );
      } else {
        const nextPhase = getNextPhase(currentPhase);
        setCurrentPhase(nextPhase);
        setCurrentQuestion(0);
        setScore({ correct: 0, total: 0 });
        setStreak(0);
      }
    } else {
      Alert.alert(
        'Keep Practicing!',
        `You got ${score.correct}/${currentConfig.targetScore} exercises correct. Try again to improve your ear!`,
        [
          { text: 'Retry Phase', onPress: () => {
            setCurrentQuestion(0);
            setScore({ correct: 0, total: 0 });
            setStreak(0);
          }},
          { text: 'Continue Anyway', onPress: () => {
            const nextPhase = getNextPhase(currentPhase);
            setCurrentPhase(nextPhase);
            setCurrentQuestion(0);
            setScore({ correct: 0, total: 0 });
            setStreak(0);
          }}
        ]
      );
    }
  }, [score, currentConfig, currentPhase]);

  const getNextPhase = useCallback((current: Phase): Phase => {
    const phases: Phase[] = ['note-recognition', 'direction', 'step-skip', 'echo', 'scale-degrees', 'intervals', 'chord-tones', 'melodic-patterns'];
    const currentIndex = phases.indexOf(current);
    return phases[currentIndex + 1] || 'melodic-patterns';
  }, []);

  const handleKeyPress = useCallback((note: string) => {
    if (currentPhase === 'echo' && currentSequence && echoMode === 'playing') {
      // Echo mode: track user's input sequence
      setUserEchoSequence(prev => {
        const newSequence = [...prev, note];
        
        // Check if sequence is complete
        if (newSequence.length === currentSequence.notes.length) {
          const isCorrect = newSequence.every((userNote, index) => userNote === currentSequence.notes[index]);
          
          if (isCorrect) {
            setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
            setStreak(prev => prev + 1);
            setFeedback('correct');
            
            // Advance to next question after delay
            setTimeout(() => {
              setFeedback(null);
              setCurrentQuestion(prev => prev + 1);
            }, PROMPT_DELAY_MS);
          } else {
            setScore(prev => ({ ...prev, total: prev.total + 1 }));
            setStreak(0);
            setFeedback('incorrect');
            
            // In practice mode, allow retry
            if (practiceMode) {
              setTimeout(() => {
                setFeedback(null);
                setUserEchoSequence([]);
              }, PROMPT_DELAY_MS);
            } else {
              setTimeout(() => {
                setFeedback(null);
                setCurrentQuestion(prev => prev + 1);
              }, PROMPT_DELAY_MS);
            }
          }
        }
        
        return newSequence;
      });
      
      // Play the note for feedback
      const asset = toAssetName(note);
      const path = `/instruments/piano/${asset}.mp3`;
      const mediaUrl = resolveMediaUrl(path);
      if (mediaUrl) void audioPlayer.play(mediaUrl);
    } else if (currentPhase !== 'echo' || echoMode !== 'listening') {
      // Other modes: play the note for feedback
      const asset = toAssetName(note);
      const path = `/instruments/piano/${asset}.mp3`;
      const mediaUrl = resolveMediaUrl(path);
      if (mediaUrl) void audioPlayer.play(mediaUrl);
    }
  }, [currentPhase, currentSequence, isPlaying, echoMode, practiceMode]);

  const getEncouragementMessage = useCallback(() => {
    if (streak >= 5) return "🎵 Amazing ear! You're on fire!";
    if (streak >= 3) return "🎶 Great job! Keep it up!";
    if (streak >= 1) return "👍 Nice work!";
    return "💪 You've got this!";
  }, [streak]);

  const getDifficultyIndicator = useCallback(() => {
    switch (currentPhase) {
      case 'note-recognition': return { level: 'Easy', emoji: '🎯', color: '#10b981' };
      case 'direction': return { level: 'Easy+', emoji: '🎵', color: '#10b981' };
      case 'step-skip': return { level: 'Medium', emoji: '🎼', color: '#f59e0b' };
      case 'echo': return { level: 'Medium+', emoji: '🎹', color: '#f59e0b' };
      case 'scale-degrees': return { level: 'Hard', emoji: '🎼', color: '#ef4444' };
      case 'intervals': return { level: 'Hard+', emoji: '🎵', color: '#ef4444' };
      case 'chord-tones': return { level: 'Expert', emoji: '🎹', color: '#8b5cf6' };
      case 'melodic-patterns': return { level: 'Expert+', emoji: '🎼', color: '#8b5cf6' };
      default: return { level: 'Easy', emoji: '🎯', color: '#10b981' };
    }
  }, [currentPhase]);

  const getPhaseTipContent = useCallback(() => {
    switch (currentPhase) {
      case 'note-recognition': 
        return "🎯 Try hiding the keyboard to test your ears without visual help!";
      case 'direction': 
        return "🎵 Focus on whether the second note is higher, lower, or the same pitch.";
      case 'step-skip': 
        return "👣 Steps move to adjacent notes, skips jump over notes.";
      case 'echo': 
        return "🎧 Listen carefully and try to match the rhythm and pitch exactly.";
      case 'scale-degrees': 
        return "🎼 Think of the note's position in the C major scale (C-D-E-F-G-A-B-C).";
      case 'intervals': 
        return "🎹 Perfect 5ths sound strong and stable, major 3rds are bright and happy.";
      case 'chord-tones': 
        return "🎶 Listen for the chord's overall sound, then identify the specific note.";
      case 'melodic-patterns': 
        return "🎵 Recognize the pattern first, then identify the target note within it.";
      default: return "";
    }
  }, [currentPhase]);

  const handlePhaseSwitch = useCallback((newPhase: Phase) => {
    setCurrentPhase(newPhase);
    setCurrentQuestion(0);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setShowPhaseDropdown(false);
  }, []);

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'note-recognition':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              Listen to the note and identify it by letter name
            </Text>
            <View style={styles.answerButtons}>
              {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
                <TouchableOpacity
                  key={note}
                  style={[
                    styles.answerButton,
                    { backgroundColor: colors.card },
                    userAnswer === note && feedback === 'correct' && styles.correctAnswer,
                    userAnswer === note && feedback === 'incorrect' && styles.incorrectAnswer,
                  ]}
                  onPress={() => handleAnswer(note)}
                  disabled={userAnswer !== null || isPlaying}
                >
                  <Text style={[styles.answerButtonText, { color: colors.text }]}>{note}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'direction':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              Does the melody go up, down, or stay the same?
            </Text>
            <View style={styles.answerButtons}>
              {['up', 'down', 'same'].map(direction => (
                <TouchableOpacity
                  key={direction}
                  style={[
                    styles.answerButton,
                    { backgroundColor: colors.card },
                    userAnswer === direction && feedback === 'correct' && styles.correctAnswer,
                    userAnswer === direction && feedback === 'incorrect' && styles.incorrectAnswer,
                  ]}
                  onPress={() => handleAnswer(direction)}
                  disabled={userAnswer !== null || isPlaying}
                >
                  <Text style={[styles.answerButtonText, { color: colors.text }]}>
                    {direction === 'up' ? '↗️ Up' : direction === 'down' ? '↘️ Down' : '→ Same'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'step-skip':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              Are the notes moving by steps (adjacent) or skips (jumping)?
            </Text>
            <View style={styles.answerButtons}>
              {['steps', 'skips', 'mixed'].map(pattern => (
                <TouchableOpacity
                  key={pattern}
                  style={[
                    styles.answerButton,
                    { backgroundColor: colors.card },
                    userAnswer === pattern && feedback === 'correct' && styles.correctAnswer,
                    userAnswer === pattern && feedback === 'incorrect' && styles.incorrectAnswer,
                  ]}
                  onPress={() => handleAnswer(pattern)}
                  disabled={userAnswer !== null || isPlaying}
                >
                  <Text style={[styles.answerButtonText, { color: colors.text }]}>
                    {pattern === 'steps' ? '👣 Steps' : pattern === 'skips' ? '🦘 Skips' : '🔄 Mixed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'echo':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              {echoMode === 'listening' 
                ? 'Listen to the melody carefully...' 
                : 'Now play it back by tapping the keys in order'
              }
            </Text>
            
            {echoMode === 'playing' && (
              <View style={styles.echoProgress}>
                <Text style={[styles.echoProgressText, { color: colors.muted }]}>
                  Progress: {userEchoSequence.length}/{currentSequence?.notes.length || 0} notes
                </Text>
                <View style={styles.echoSequence}>
                  {currentSequence?.notes.map((note, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.echoNote,
                        { 
                          backgroundColor: index < userEchoSequence.length 
                            ? (userEchoSequence[index] === note ? '#10b981' : '#ef4444')
                            : colors.border 
                        }
                      ]}
                    >
                      <Text style={[
                        styles.echoNoteText, 
                        { color: index < userEchoSequence.length ? 'white' : colors.text }
                      ]}>
                        {note}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.replayButton, { backgroundColor: colors.primary }]}
              onPress={() => currentSequence && playSequence(currentSequence.notes)}
              disabled={isPlaying}
            >
              <Text style={[styles.replayButtonText, { color: colors.background }]}>
                🔄 Replay Melody
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'scale-degrees':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              What's the {currentSequence?.degree} degree of {currentSequence?.scale} major scale?
            </Text>
            <View style={styles.answerButtons}>
              {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
                <TouchableOpacity
                  key={note}
                  style={[
                    styles.answerButton,
                    { backgroundColor: colors.card },
                    userAnswer === note && feedback === 'correct' && styles.correctAnswer,
                    userAnswer === note && feedback === 'incorrect' && styles.incorrectAnswer,
                  ]}
                  onPress={() => handleAnswer(note)}
                  disabled={userAnswer !== null || isPlaying}
                >
                  <Text style={[styles.answerButtonText, { color: colors.text }]}>{note}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'intervals':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              What's the {currentSequence?.interval} above the first note?
            </Text>
            <View style={styles.answerButtons}>
              {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
                <TouchableOpacity
                  key={note}
                  style={[
                    styles.answerButton,
                    { backgroundColor: colors.card },
                    userAnswer === note && feedback === 'correct' && styles.correctAnswer,
                    userAnswer === note && feedback === 'incorrect' && styles.incorrectAnswer,
                  ]}
                  onPress={() => handleAnswer(note)}
                  disabled={userAnswer !== null || isPlaying}
                >
                  <Text style={[styles.answerButtonText, { color: colors.text }]}>{note}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'chord-tones':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              What's the {currentSequence?.chord?.includes('root') ? 'root' : currentSequence?.chord?.includes('3rd') ? '3rd' : '5th'} of {currentSequence?.chord}?
            </Text>
            <View style={styles.answerButtons}>
              {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
                <TouchableOpacity
                  key={note}
                  style={[
                    styles.answerButton,
                    { backgroundColor: colors.card },
                    userAnswer === note && feedback === 'correct' && styles.correctAnswer,
                    userAnswer === note && feedback === 'incorrect' && styles.incorrectAnswer,
                  ]}
                  onPress={() => handleAnswer(note)}
                  disabled={userAnswer !== null || isPlaying}
                >
                  <Text style={[styles.answerButtonText, { color: colors.text }]}>{note}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'melodic-patterns':
        return (
          <View style={styles.phaseContent}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              What's the last note in this {currentSequence?.pattern}?
            </Text>
            <View style={styles.answerButtons}>
              {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
                <TouchableOpacity
                  key={note}
                  style={[
                    styles.answerButton,
                    { backgroundColor: colors.card },
                    userAnswer === note && feedback === 'correct' && styles.correctAnswer,
                    userAnswer === note && feedback === 'incorrect' && styles.incorrectAnswer,
                  ]}
                  onPress={() => handleAnswer(note)}
                  disabled={userAnswer !== null || isPlaying}
                >
                  <Text style={[styles.answerButtonText, { color: colors.text }]}>{note}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Breadcrumb Navigation */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity
          style={styles.breadcrumbButton}
          onPress={() => navigation.navigate('LessonDetail', { id: 'western-theory-intro' })}
        >
          <Text style={[styles.breadcrumbText, { color: colors.primary }]}>← Beginner Lessons</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>{currentConfig.title}</Text>
          <TouchableOpacity
            style={[styles.phaseDropdownButton, { backgroundColor: colors.card }]}
            onPress={() => setShowPhaseDropdown(true)}
          >
            <Text style={[styles.phaseDropdownText, { color: colors.text }]}>
              🔄 Switch Phase
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.description, { color: colors.muted }]}>{currentConfig.description}</Text>
        
        {/* Difficulty Indicator */}
        <View style={styles.difficultyContainer}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyIndicator().color }]}>
            <Text style={styles.difficultyText}>
              {getDifficultyIndicator().emoji} {getDifficultyIndicator().level}
            </Text>
          </View>
        </View>
      </View>

      {/* Combined Progress and Exercise Counter */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            Exercise {currentQuestion + 1} of {currentConfig.sequences.length}
          </Text>
          <Text style={[styles.progressText, { color: colors.primary, fontWeight: '600' }]}>
            {Math.round(phaseProgress)}% Complete
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary, 
                width: `${Math.min(phaseProgress, 100)}%` 
              }
            ]} 
          />
        </View>
      </View>

      {/* Streak and Encouragement */}
      {streak > 0 && (
        <View style={styles.streakContainer}>
          <Text style={[styles.streakText, { color: colors.primary }]}>
            🔥 {streak} in a row! {getEncouragementMessage()}
          </Text>
        </View>
      )}

      {/* Phase Content - EXERCISE FIRST! */}
      {renderPhaseContent()}

      {/* Phase Tip - MOVED AFTER EXERCISE */}
      <View style={[styles.tipContainer, { 
        backgroundColor: colors.background === '#0b1220' ? '#1e293b' : '#f0f9ff',
        borderColor: colors.primary,
        shadowColor: colors.primary,
      }]}>
        <View style={styles.tipHeader}>
          <Text style={[styles.tipIcon, { opacity: 0.9 }]}>✨</Text>
          <Text style={[styles.tipLabel, { color: colors.primary }]}>Pro Tip</Text>
        </View>
        <Text style={[styles.tipText, { color: colors.text }]}>{getPhaseTipContent()}</Text>
      </View>

      {/* Mode Selection */}
      <View style={styles.modeSelectionContainer}>
        <Text style={[styles.modeSelectionTitle, { color: colors.text }]}>
          Choose Your Mode:
        </Text>
        <View style={styles.modeButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { 
                backgroundColor: !showKeyboard ? colors.primary : colors.card,
                borderColor: colors.primary,
              }
            ]}
            onPress={() => setShowKeyboard(false)}
          >
            <Text style={[
              styles.modeButtonIcon,
              { color: !showKeyboard ? colors.background : colors.primary }
            ]}>
              🎧
            </Text>
            <Text style={[
              styles.modeButtonText,
              { color: !showKeyboard ? colors.background : colors.text }
            ]}>
              Audio Only
            </Text>
            <Text style={[
              styles.modeButtonSubtext,
              { color: !showKeyboard ? colors.background : colors.muted }
            ]}>
              Pure ear training
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              { 
                backgroundColor: showKeyboard ? colors.primary : colors.card,
                borderColor: colors.primary,
              }
            ]}
            onPress={() => setShowKeyboard(true)}
          >
            <Text style={[
              styles.modeButtonIcon,
              { color: showKeyboard ? colors.background : colors.primary }
            ]}>
              🎹
            </Text>
            <Text style={[
              styles.modeButtonText,
              { color: showKeyboard ? colors.background : colors.text }
            ]}>
              Piano Mode
            </Text>
            <Text style={[
              styles.modeButtonSubtext,
              { color: showKeyboard ? colors.background : colors.muted }
            ]}>
              Visual + audio
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Piano Keyboard */}
      {showKeyboard && (
        <View style={styles.pianoContainer}>
          {currentPhase === 'echo' && echoMode === 'listening' ? (
            <View style={styles.listeningContainer}>
              <Text style={[styles.listeningText, { color: colors.muted }]}>
                🎧 Listening... Tap keys after the melody finishes
              </Text>
            </View>
          ) : (
            <PianoView
              octaves={[4, 5]}
              scrollable={true}
              whiteKeyWidth={35}
              whiteKeyHeight={80}
              initialOctave={4}
              showLabels={showLabels}
              highlightNotes={highlightNotes}
              onKeyDown={handleKeyPress}
              enableTouch={currentPhase !== 'echo' || echoMode === 'playing'}
              context="default"
            />
          )}
        </View>
      )}

      {/* Audio Only Mode Message */}
      {!showKeyboard && (
        <View style={styles.audioOnlyContainer}>
          <Text style={[styles.audioOnlyIcon, { color: colors.primary }]}>🎧</Text>
          <Text style={[styles.audioOnlyTitle, { color: colors.text }]}>
            Audio Only Mode (Default)
          </Text>
          <Text style={[styles.audioOnlySubtitle, { color: colors.muted }]}>
            Focus on your hearing - no visual distractions
          </Text>
          <Text style={[styles.audioOnlyBenefit, { color: colors.primary }]}>
            💡 Best for developing your ear!
          </Text>
        </View>
      )}

      {/* Consolidated Controls */}
      <View style={styles.controls}>
        {showKeyboard && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.card }]}
            onPress={() => setShowLabels(!showLabels)}
          >
            <Text style={[styles.controlButtonText, { color: colors.text }]}>
              {showLabels ? '🏷️ Hide Labels' : '🏷️ Show Labels'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.primary }]}
          onPress={handleReplay}
          disabled={isPlaying}
        >
          <Text style={[styles.controlButtonText, { color: colors.background }]}>
            🔄 Replay
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.controlButton, 
            { backgroundColor: hintUsed ? colors.border : colors.card }
          ]}
          onPress={handleHint}
          disabled={hintUsed || !currentSequence}
        >
          <Text style={[
            styles.controlButtonText, 
            { color: hintUsed ? colors.muted : colors.text }
          ]}>
            💡 Hint
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton, 
            { backgroundColor: practiceMode ? colors.primary : colors.card }
          ]}
          onPress={() => setPracticeMode(!practiceMode)}
        >
          <Text style={[
            styles.controlButtonText, 
            { color: practiceMode ? colors.background : colors.text }
          ]}>
            {practiceMode ? '🎯 Practice ON' : '🎯 Practice OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phase Dropdown Modal */}
      <Modal
        visible={showPhaseDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhaseDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Phase</Text>
            
            {(['note-recognition', 'direction', 'step-skip', 'echo', 'scale-degrees', 'intervals', 'chord-tones', 'melodic-patterns'] as Phase[]).map((phase) => {
              const phaseInfo = phaseConfig[phase];
              const isCurrent = phase === currentPhase;
              
              return (
                <TouchableOpacity
                  key={phase}
                  style={[
                    styles.phaseOption,
                    { backgroundColor: isCurrent ? colors.primary : colors.card },
                    isCurrent && { opacity: 0.7 }
                  ]}
                  onPress={() => handlePhaseSwitch(phase)}
                  disabled={isCurrent}
                >
                  <Text style={[
                    styles.phaseOptionText,
                    { color: isCurrent ? colors.background : colors.text }
                  ]}>
                    {phaseInfo.title}
                  </Text>
                  <Text style={[
                    styles.phaseOptionSubtext,
                    { color: isCurrent ? colors.background : colors.muted }
                  ]}>
                    {phaseInfo.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => setShowPhaseDropdown(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  breadcrumb: { marginBottom: 8 },
  breadcrumbButton: { alignSelf: 'flex-start' },
  breadcrumbText: { fontSize: 16, fontWeight: '600' },
  header: { alignItems: 'flex-start', gap: 8 },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '100%',
    marginBottom: 8
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'left', flex: 1 },
  description: { fontSize: 16, textAlign: 'left', lineHeight: 22 },
  phaseDropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  phaseDropdownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyContainer: { marginTop: 8 },
  difficultyBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
    alignSelf: 'flex-start'
  },
  difficultyText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  tipContainer: { 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: { 
    fontSize: 15, 
    fontWeight: '500',
    lineHeight: 22,
  },
  modeSelectionContainer: {
    marginVertical: 12,
    gap: 12,
  },
  modeSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonIcon: {
    fontSize: 24,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modeButtonSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  audioOnlyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 8,
  },
  audioOnlyIcon: {
    fontSize: 32,
  },
  audioOnlyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  audioOnlySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  audioOnlyBenefit: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  progressContainer: { gap: 6 },
  progressRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 4
  },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '500' },
  streakContainer: { alignItems: 'flex-start' },
  streakText: { fontSize: 16, fontWeight: '600' },
  questionCounter: { alignItems: 'flex-start' },
  questionText: { fontSize: 14, fontWeight: '500' },
  pianoContainer: { marginVertical: 12 },
  controls: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' },
  controlButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  controlButtonText: { fontSize: 12, fontWeight: '600' },
  phaseContent: { gap: 12 },
  instruction: { fontSize: 16, textAlign: 'left', fontWeight: '600', lineHeight: 20 },
  answerButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
  answerButton: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 10, 
    minWidth: 60,
    alignItems: 'center'
  },
  answerButtonText: { fontSize: 14, fontWeight: '600' },
  correctAnswer: { backgroundColor: '#10b981' },
  incorrectAnswer: { backgroundColor: '#ef4444' },
  replayButton: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  replayButtonText: { fontSize: 16, fontWeight: '600' },

  listeningContainer: {
    height: 80,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  listeningText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  echoProgress: {
    alignItems: 'flex-start',
    gap: 8,
  },
  echoProgressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  echoSequence: {
    flexDirection: 'row',
    gap: 6,
  },
  echoNote: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  echoNoteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 8,
  },
  phaseOption: {
    padding: 16,
    borderRadius: 8,
    gap: 4,
  },
  phaseOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  phaseOptionSubtext: {
    fontSize: 14,
    lineHeight: 18,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});


