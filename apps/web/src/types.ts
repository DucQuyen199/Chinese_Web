export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  roles: Role[];
  profile?: { currentLevel?: string | null; dailyTarget?: number; totalMinutes?: number } | null;
  streak?: { currentStreak: number; longestStreak: number } | null;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary?: string;
  description: string;
  coverColor: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  demoVideoUrl?: string | null;
  demoVideoThumbnailUrl?: string | null;
  durationHours: number;
  lessonCount?: number;
  level: { code: string; name: string };
  category: { slug: string; name: string };
  progress?: { progressPct: number; status: string; lastLessonId?: string | null } | null;
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  subtitle?: string | null;
  sortOrder: number;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  title: string;
  summary: string;
  durationMinutes: number;
  sortOrder: number;
  progress?: { progressPct: number; status: string } | null;
}

export type LessonContentType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'EMBED' | 'CALLOUT' | 'DIVIDER';

export interface LessonContentBlock {
  id: string;
  lessonId: string;
  type: LessonContentType;
  title?: string | null;
  body?: string | null;
  assetUrl?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  durationSeconds?: number | null;
  altText?: string | null;
  caption?: string | null;
  sortOrder: number;
}

export interface Vocabulary {
  id: string;
  simplified: string;
  language: 'zh-CN';
  pinyin: string;
  meaningVi: string;
  partOfSpeech: string;
  hskLevel: string;
  exampleCn: string;
  examplePy: string;
  exampleVi: string;
  progress?: Array<{ status: string; nextReviewAt: string }>;
}

export interface DashboardData {
  user: User | null;
  stats: { xp: number; level: { number: number; label: string }; vocabularyCount: number; learnedCount: number; dueReviews: number; totalMinutes: number };
  streak: { currentStreak: number; longestStreak: number };
  dailyGoal: { target: number; completed: number };
  continueLearning: { course: Course; progress: number; nextLesson: LessonSummary | null } | null;
  recentLessons: Array<{ lesson: LessonSummary & { module: { course: { title: string; coverColor: string; slug: string } } }; status: string; progressPct: number }>;
  achievements: Array<{ achievement: { title: string; description: string; icon: string }; unlockedAt: string }>;
}

export interface LessonDetail extends LessonSummary {
  module: { course: { id: string; slug: string; title: string; coverColor: string } };
  sections: Array<{ id: string; type: string; title: string; body: string }>;
  contentBlocks: LessonContentBlock[];
  lessonWords: Array<{ vocabulary: Vocabulary }>;
  listening: Array<{ id: string; title: string; transcript: string; translation: string; questions: Array<{ prompt: string; options: string[]; answer: string }> }>;
  speaking: Array<{ id: string; promptCn: string; promptPy: string; promptVi: string }>;
  reading: Array<{ id: string; title: string; passageCn: string; passagePy: string; passageVi: string; questions: Array<{ prompt: string; options: string[]; answer: string }> }>;
  writing: Array<{ id: string; promptVi: string; expectedCn: string; hint?: string | null }>;
  quizzes: Array<{ id: string; title: string; questions: Array<{ prompt: string; options: string[]; answers: Array<{ answer: string; isCorrect: boolean }> }> }>;
}

export interface ApiResponse<T> { success: boolean; message: string; data: T }
