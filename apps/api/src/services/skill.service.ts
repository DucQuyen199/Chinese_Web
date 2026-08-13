import { prisma } from '../lib/prisma.js';

export async function getSkillExercises(type: 'listening' | 'speaking' | 'reading' | 'writing') {
  if (type === 'listening') return prisma.listeningExercise.findMany({ take: 100, orderBy: { sortOrder: 'asc' }, include: { questions: true, lesson: { select: { id: true, title: true } } } });
  if (type === 'speaking') return prisma.speakingExercise.findMany({ take: 100, orderBy: { sortOrder: 'asc' }, include: { lesson: { select: { id: true, title: true } } } });
  if (type === 'reading') return prisma.readingExercise.findMany({ take: 100, orderBy: { sortOrder: 'asc' }, include: { questions: true, lesson: { select: { id: true, title: true } } } });
  return prisma.writingExercise.findMany({ take: 100, orderBy: { sortOrder: 'asc' }, include: { lesson: { select: { id: true, title: true } } } });
}

export async function getCharacters() {
  return prisma.character.findMany({ orderBy: [{ hskLevel: 'asc' }, { glyph: 'asc' }], include: { radical: true }, take: 100 });
}

export async function getRadicals() {
  return prisma.radical.findMany({ orderBy: { frequency: 'desc' }, include: { characters: { take: 5 } }, take: 100 });
}

export async function getGrammar() {
  return prisma.grammarPoint.findMany({ orderBy: { hskLevel: 'asc' }, take: 100 });
}

export async function getHskLevels(userId: string) {
  const levels = await prisma.hskLevel.findMany({ orderBy: { order: 'asc' }, include: { vocabulary: { include: { vocabulary: true }, take: 20 }, _count: { select: { vocabulary: true } } } });
  return Promise.all(levels.map(async (level) => {
    const courseLevel = await prisma.courseLevel.findUnique({ where: { code: level.code }, select: { id: true } });
    const courses = courseLevel ? await prisma.course.findMany({ where: { levelId: courseLevel.id }, select: { id: true } }) : [];
    const courseIds = courses.map((course) => course.id);
    const exerciseWhere = { lesson: { module: { courseId: { in: courseIds } } } };
    const [learnedCount, listening, speaking, reading, writing] = await prisma.$transaction([
      prisma.userVocabularyProgress.count({ where: { userId, vocabulary: { hskLevels: { some: { hskLevelId: level.id } } } } }),
      prisma.listeningExercise.count({ where: exerciseWhere }),
      prisma.speakingExercise.count({ where: exerciseWhere }),
      prisma.readingExercise.count({ where: exerciseWhere }),
      prisma.writingExercise.count({ where: exerciseWhere }),
    ]);
    return { ...level, vocabularyCount: level._count.vocabulary, learnedCount, progressPct: level._count.vocabulary ? Math.round((learnedCount / level._count.vocabulary) * 100) : 0, courseCount: courses.length, exerciseCount: listening + speaking + reading + writing, skillBreakdown: { listening, speaking, reading, writing } };
  }));
}
