/** نوع‌ها و پرس‌وجوهای راهبردهای یادگیری: رشد، ریتم هفتگی، مرور با فاصله، مهارت، دورهٔ گروهی، داستان میدان */
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface Skill { id: string; title: string; lessonCount: number; doneCount: number; mastered: boolean; course?: { title: string; slug: string } }

export interface Growth {
  stage: 'SEED' | 'SPROUT' | 'SAPLING' | 'TREE'; stageTitle: string; index: number;
  coursesDone: number; missionsDone: number; certificates: number;
  next: { key: string; title: string; coursesLeft: number; missionsLeft: number } | null;
  stages: { key: string; title: string; courses: number; missions: number }[];
  skills: { mastered: number; total: number; list: Skill[] };
}

export interface Rhythm {
  goal: number | null; weekStart: string; doneThisWeek: number; days: number[]; today: number;
  weeks: { weekStart: string; count: number; met: boolean }[];
}

export interface ReviewBrief { id: string; round: number; dueAt: string; questionCount: number; course: { title: string; slug: string } }
export interface MyReviews { due: ReviewBrief[]; next: { dueAt: string; course: { title: string; slug: string } } | null }
export interface ReviewDetail {
  id: string; round: number; dueAt: string; doneAt: string | null; score: number | null; open: boolean;
  course: { title: string; slug: string };
  questions: { id: string; kind: 'single' | 'multi' | 'tf'; text: string; options: { id: string; text: string }[] }[];
}

export interface Story { text: string; authorLabel: string; publishedAt: string; mission: { id: string; title: string }; course: { title: string; slug: string } }

export interface Cohort {
  id: string; startsAt: string; endsAt: string; weeksPerStation: number; note: string | null; cancelled: boolean;
  path: { slug: string; title: string; color: string }; core: { id: string; name: string };
  joined: boolean; canJoin: boolean; canManage: boolean; memberCount: number; coreSize: number;
  currentStation: number; finished: boolean;
  stations: { course: { slug: string; title: string }; opensAt: string; doneCount: number; doneByMe: boolean }[];
}

export const useGrowth = () => useQuery({ queryKey: ['growth'], queryFn: () => api<Growth>('/me/growth') });
export const useRhythm = () => useQuery({ queryKey: ['rhythm'], queryFn: () => api<Rhythm>('/me/rhythm') });
export const useReviews = () => useQuery({ queryKey: ['reviews'], queryFn: () => api<MyReviews>('/me/reviews') });
export const useStories = () => useQuery({ queryKey: ['stories'], queryFn: () => api<Story[]>('/stories'), staleTime: 5 * 60_000 });
export const useMyCohorts = () => useQuery({ queryKey: ['cohorts', 'mine'], queryFn: () => api<Cohort[]>('/cohorts/mine') });

/** کلیدهایی که با تمام شدن یک درس کهنه می‌شوند */
export const GROWTH_KEYS = [['growth'], ['rhythm'], ['reviews'], ['cohorts']] as const;
