import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      skillLevel: 'beginner',
      preferences: { theme: 'dark', language: 'en' },
      subscriptionStatus: 'free',
      passwordHash: await bcrypt.hash('Password123!', 10),
      emailVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      skillLevel: 'intermediate',
      preferences: { theme: 'light', language: 'en' },
      subscriptionStatus: 'premium',
      passwordHash: await bcrypt.hash('Password123!', 10),
      emailVerified: true,
    },
  });

  console.log('✅ Users created:', { user1: user1.name, user2: user2.name });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      skillLevel: 'advanced',
      subscriptionStatus: 'premium',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      emailVerified: true,
      role: 'admin',
    },
  });

  console.log('✅ Admin created:', admin.email);

  // Prune lessons not in the current curriculum
  const allowedLessonIds = [
    'carnatic-theory-intro',
    'western-theory-intro',
    'western-theory-intermediate',
    'western-theory-advanced',
    'western-scales',
    'carnatic-ragas',
  ];
  // Remove dependent records first to satisfy FKs
  await prisma.userProgress.deleteMany({
    where: { lessonId: { notIn: allowedLessonIds } },
  });
  await prisma.exercise.deleteMany({
    where: { lessonId: { notIn: allowedLessonIds } },
  });
  await prisma.lesson.deleteMany({
    where: { id: { notIn: allowedLessonIds } },
  });

  // Create Western music lessons
  const westernTheory = await prisma.lesson.upsert({
    where: { id: 'western-theory-intro' },
    update: { title: 'Western Music Theory — Beginner' },
    create: {
      id: 'western-theory-intro',
      title: 'Western Music Theory — Beginner',
      content: 'Learn staff notation, note names (C, D, E, F, G, A, B), accidentals, and the concept of key signatures. This lesson builds a foundation for scales and chords.',
      difficulty: 'beginner',
      musicSystem: 'Western',
      category: 'Theory',
      duration: 15, // minutes
      prerequisites: null,
    },
  });

  const westernTheoryIntermediate = await prisma.lesson.upsert({
    where: { id: 'western-theory-intermediate' },
    update: {},
    create: {
      id: 'western-theory-intermediate',
      title: 'Western Music Theory — Intermediate',
      content:
        'Intervals (quality & inversion), minor scales (natural/harmonic/melodic), modal overview, triads & seventh chords with inversions, functional harmony (T–PD–D), cadences, and intro to voice leading.',
      difficulty: 'intermediate',
      musicSystem: 'Western',
      category: 'Theory',
      duration: 25,
      prerequisites: 'western-theory-intro',
    },
  });

  const westernTheoryAdvanced = await prisma.lesson.upsert({
    where: { id: 'western-theory-advanced' },
    update: {},
    create: {
      id: 'western-theory-advanced',
      title: 'Western Music Theory — Advanced',
      content:
        'Secondary dominants/leading-tone chords, borrowed chords (modal interchange), extended chords, pivot-chord modulation, basic counterpoint concepts, odd/compound meters, arranging & simple improvisation.',
      difficulty: 'advanced',
      musicSystem: 'Western',
      category: 'Theory',
      duration: 30,
      prerequisites: 'western-theory-intermediate',
    },
  });

  const westernScales = await prisma.lesson.upsert({
    where: { id: 'western-scales' },
    update: {},
    create: {
      id: 'western-scales',
      title: 'Western Music Scales',
      content: 'Practice major and minor scales with interactive playback and piano visualization. Select scale pattern, key, and direction.',
      difficulty: 'beginner',
      musicSystem: 'Western',
      category: 'Scales',
      duration: 20,
      prerequisites: 'western-theory-intro',
    },
  });

  // Create Carnatic music lessons
  const carnaticTheory = await prisma.lesson.upsert({
    where: { id: 'carnatic-theory-intro' },
    update: {},
    create: {
      id: 'carnatic-theory-intro',
      title: 'Introduction to Carnatic Music Theory',
      content: 'Learn the seven basic swaras (Sa, Re, Ga, Ma, Pa, Dha, Ni), the concept of sruti, and an overview of the Melakarta framework.',
      difficulty: 'beginner',
      musicSystem: 'Carnatic',
      category: 'Theory',
      duration: 18,
      prerequisites: null,
    },
  });

  const carnaticRagas = await prisma.lesson.upsert({
    where: { id: 'carnatic-ragas' },
    update: {},
    create: {
      id: 'carnatic-ragas',
      title: 'Carnatic Ragas',
      content: 'Explore Carnatic ragas with interactive playback: select ragas (Melakarta and Janya), choose tonic, play arohana/avarohana with piano visualization and optional tanpura support.',
      difficulty: 'beginner',
      musicSystem: 'Carnatic',
      category: 'Ragas',
      duration: 25,
      prerequisites: 'carnatic-theory-intro',
    },
  });

  console.log('✅ Lessons created:', {
    western: [
      westernTheory.title,
      westernTheoryIntermediate.title,
      westernTheoryAdvanced.title,
      westernScales.title,
    ],
    carnatic: [carnaticTheory.title, carnaticRagas.title],
  });

  // Create exercises for lessons
  const exercises = await Promise.all([
    // Western exercises
    // Keep a simple exercise for Western theory intro (optional listening)
    prisma.exercise.upsert({
      where: { id: 'western-exercise-1' },
      update: {},
      create: {
        id: 'western-exercise-1',
        lessonId: westernTheory.id,
        type: 'note_reading',
        audioFile: '/audio/western/notes-c-major.mp3',
        notation: 'C D E F G A B C',
        difficulty: 'beginner',
        instructions: 'Listen to the note names and locate them on the keyboard visualization in the next lesson.',
        hints: 'Start with middle C (C4).',
      },
    }),

    prisma.exercise.upsert({
      where: { id: 'western-exercise-2' },
      update: {},
      create: {
        id: 'western-exercise-2',
        lessonId: westernScales.id,
        type: 'scale_practice',
        audioFile: '/audio/western/c-major-scale.mp3',
        notation: 'C D E F G A B C B A G F E D C',
        difficulty: 'beginner',
        instructions: 'Practice the C major scale with proper fingering',
        hints: 'Use the correct finger pattern: 1-2-3, 1-2-3-4-5 for the right hand',
      },
    }),

    // Intermediate theory quick drill
    prisma.exercise.upsert({
      where: { id: 'western-exercise-3' },
      update: {},
      create: {
        id: 'western-exercise-3',
        lessonId: westernTheoryIntermediate.id,
        type: 'interval_identification',
        audioFile: null,
        notation: 'Randomized interval prompts (M3, m6, P4, etc.)',
        difficulty: 'intermediate',
        instructions:
          'Identify the interval quality and size between two shown notes. Aim for accuracy over speed.',
        hints: 'Count letter names first (size), then adjust for accidentals (quality).',
      },
    }),

    // Advanced harmony quick drill
    prisma.exercise.upsert({
      where: { id: 'western-exercise-4' },
      update: {},
      create: {
        id: 'western-exercise-4',
        lessonId: westernTheoryAdvanced.id,
        type: 'harmony_analysis',
        audioFile: null,
        notation:
          'Analyze: I – vi – ii – V; add one secondary dominant and label Roman numerals.',
        difficulty: 'advanced',
        instructions:
          'Choose a key, label functions (T–PD–D), insert a secondary dominant (e.g., V/V) and update Roman numerals.',
        hints: 'Target the next chord: V of ii or V of V are common introductions.',
      },
    }),

    // Carnatic exercises
    prisma.exercise.upsert({
      where: { id: 'carnatic-exercise-1' },
      update: {},
      create: {
        id: 'carnatic-exercise-1',
        lessonId: carnaticTheory.id,
        type: 'swara_practice',
        audioFile: '/audio/carnatic/swaras-basic.mp3',
        notation: 'Sa Re Ga Ma Pa Dha Ni Sa',
        difficulty: 'beginner',
        instructions: 'Practice the basic swaras in order',
        hints: 'Focus on clear pronunciation and maintaining sruti (pitch)',
      },
    }),

    prisma.exercise.upsert({
      where: { id: 'carnatic-exercise-2' },
      update: {},
      create: {
        id: 'carnatic-exercise-2',
        lessonId: carnaticRagas.id,
        type: 'raga_practice',
        audioFile: '/audio/carnatic/mayamalavagowla.mp3',
        notation: 'Sa Re Ga Ma Pa Dha Ni Sa Ni Dha Pa Ma Ga Re Sa',
        difficulty: 'beginner',
        instructions: 'From the Carnatic Ragas lesson, select Mayamalavagowla and practice its arohana and avarohana with the piano visualization.',
        hints: 'Use tanpura for sruti stability; focus on clean transitions between swaras.',
      },
    }),
  ]);

  console.log('✅ Exercises created:', exercises.length);

  // Create user progress records
  const progressRecords = await Promise.all([
    prisma.userProgress.upsert({
      where: { id: 'progress-1' },
      update: {},
      create: {
        id: 'progress-1',
        userId: user1.id,
        lessonId: westernTheory.id,
        completionStatus: 'in_progress',
        score: 75,
        timeSpent: 600, // 10 minutes
        attempts: 2,
      },
    }),

    prisma.userProgress.upsert({
      where: { id: 'progress-2' },
      update: {},
      create: {
        id: 'progress-2',
        userId: user2.id,
        lessonId: carnaticTheory.id,
        completionStatus: 'completed',
        score: 95,
        timeSpent: 900, // 15 minutes
        attempts: 1,
      },
    }),
  ]);

  console.log('✅ Progress records created:', progressRecords.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
