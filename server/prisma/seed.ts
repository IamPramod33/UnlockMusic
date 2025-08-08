import { PrismaClient } from '@prisma/client';

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
    },
  });

  console.log('✅ Users created:', { user1: user1.name, user2: user2.name });

  // Create Western music lessons
  const westernLesson1 = await prisma.lesson.upsert({
    where: { id: 'western-basic-notes' },
    update: {},
    create: {
      id: 'western-basic-notes',
      title: 'Introduction to Musical Notes',
      content: 'Learn the fundamental notes in Western music: C, D, E, F, G, A, B. This lesson covers note names, their positions on the staff, and basic reading skills.',
      difficulty: 'beginner',
      musicSystem: 'Western',
      category: 'Theory',
      duration: 15, // minutes
      prerequisites: null,
    },
  });

  const westernLesson2 = await prisma.lesson.upsert({
    where: { id: 'western-major-scales' },
    update: {},
    create: {
      id: 'western-major-scales',
      title: 'Major Scales',
      content: 'Master the C major scale and understand the pattern of whole and half steps that creates the major scale sound.',
      difficulty: 'beginner',
      musicSystem: 'Western',
      category: 'Scales',
      duration: 20,
      prerequisites: 'western-basic-notes',
    },
  });

  // Create Carnatic music lessons
  const carnaticLesson1 = await prisma.lesson.upsert({
    where: { id: 'carnatic-swaras' },
    update: {},
    create: {
      id: 'carnatic-swaras',
      title: 'Introduction to Swaras',
      content: 'Learn the seven basic swaras in Carnatic music: Sa, Re, Ga, Ma, Pa, Dha, Ni. Understand their relationship and basic pronunciation.',
      difficulty: 'beginner',
      musicSystem: 'Carnatic',
      category: 'Theory',
      duration: 18,
      prerequisites: null,
    },
  });

  const carnaticLesson2 = await prisma.lesson.upsert({
    where: { id: 'carnatic-mayamalavagowla' },
    update: {},
    create: {
      id: 'carnatic-mayamalavagowla',
      title: 'Mayamalavagowla Raga',
      content: 'Explore the Mayamalavagowla raga, one of the fundamental ragas in Carnatic music. Learn its arohanam and avarohanam.',
      difficulty: 'intermediate',
      musicSystem: 'Carnatic',
      category: 'Ragas',
      duration: 25,
      prerequisites: 'carnatic-swaras',
    },
  });

  console.log('✅ Lessons created:', {
    western: [westernLesson1.title, westernLesson2.title],
    carnatic: [carnaticLesson1.title, carnaticLesson2.title],
  });

  // Create exercises for lessons
  const exercises = await Promise.all([
    // Western exercises
    prisma.exercise.upsert({
      where: { id: 'western-exercise-1' },
      update: {},
      create: {
        id: 'western-exercise-1',
        lessonId: westernLesson1.id,
        type: 'note_reading',
        audioFile: '/audio/western/notes-c-major.mp3',
        notation: 'C D E F G A B C',
        difficulty: 'beginner',
        instructions: 'Play the C major scale ascending and descending',
        hints: 'Start with middle C and follow the pattern: whole, whole, half, whole, whole, whole, half',
      },
    }),

    prisma.exercise.upsert({
      where: { id: 'western-exercise-2' },
      update: {},
      create: {
        id: 'western-exercise-2',
        lessonId: westernLesson2.id,
        type: 'scale_practice',
        audioFile: '/audio/western/c-major-scale.mp3',
        notation: 'C D E F G A B C B A G F E D C',
        difficulty: 'beginner',
        instructions: 'Practice the C major scale with proper fingering',
        hints: 'Use the correct finger pattern: 1-2-3, 1-2-3-4-5 for the right hand',
      },
    }),

    // Carnatic exercises
    prisma.exercise.upsert({
      where: { id: 'carnatic-exercise-1' },
      update: {},
      create: {
        id: 'carnatic-exercise-1',
        lessonId: carnaticLesson1.id,
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
        lessonId: carnaticLesson2.id,
        type: 'raga_practice',
        audioFile: '/audio/carnatic/mayamalavagowla.mp3',
        notation: 'Sa Re Ga Ma Pa Dha Ni Sa Ni Dha Pa Ma Ga Re Sa',
        difficulty: 'intermediate',
        instructions: 'Practice the Mayamalavagowla raga arohanam and avarohanam',
        hints: 'Pay attention to the gamakas (ornamentations) characteristic of this raga',
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
        lessonId: westernLesson1.id,
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
        lessonId: carnaticLesson1.id,
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
