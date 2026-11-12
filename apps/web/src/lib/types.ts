export type Role = 'HQ_ADMIN' | 'HQ_OPERATOR' | 'INSTRUCTOR' | 'RAHYAR' | 'IMAM' | 'ORG_ADMIN';
export type LessonType = 'VIDEO' | 'AUDIO' | 'TEXT' | 'QUIZ' | 'PRACTICE' | 'WORKSHEET' | 'MISSION' | 'TOOL' | 'LIVE';

export interface Me {
  id: string; mobile: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null;
  hasNationalId: boolean; county: { id: string; name: string; province: string } | null;
  mosque: { id: string; name: string } | null; nearMosque: string | null; roles: Role[];
  cores: { id: string; name: string; isLeader: boolean }[]; ssoLinked: boolean;
  imamOf: { id: string; name: string }[]; orgs: { id: string; name: string }[]; allowRahyarMessages: boolean;
  notifyMessenger: boolean; mfaEnrolled: boolean; mfaPending: boolean;
  actorRole?: ActorRole | null; mainPathId?: string | null; onboarded?: boolean; publisher?: Pub | null; location?: { lat: number; lng: number } | null;
}

export type RegStatus = 'REGISTERED' | 'WAITLIST' | 'PENDING' | 'REJECTED' | 'CANCELLED';
export interface EventCard {
  id: string; title: string; kind: 'ONLINE' | 'IN_PERSON'; startsAt: string; endsAt: string; location: string | null; hostName: string | null;
  capacity: number | null; seatsLeft: number | null; waitlist: boolean; requiresApproval: boolean; registrationDeadline: string | null;
  audienceGender: 'MALE' | 'FEMALE' | null; status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'; cancelReason: string | null; registered: number;
  feeNote: string | null; scoped: 'ORG' | 'MOSQUE' | 'CORE' | null; useBbb?: boolean; record?: boolean;
  my: { status: RegStatus; checkInCode?: string | null; attendedAt?: string | null; feedback?: { rating: number; comment?: string } | null } | null;
}
export interface EventDetail extends EventCard {
  description: string | null; agenda: string | null; bring: string | null; mapUrl: string | null; onlineUrl: string | null; onlineSoon: boolean;
  blockedReason: string | null; canManage: boolean; ledCores: { id: string; name: string }[];
}
export interface Notice { id: string; kind: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string }

export interface MyState { enrolledAt: string; completedAt: string | null; archived: boolean; percent: number; lastLessonId: string | null }

export interface CourseCard {
  id: string; slug: string; title: string; subtitle: string | null; level: string | null; instructor: string | null;
  color: string; icon: string; hasCertificate: boolean; lessonCount?: number; durationSec?: number; me: MyState | null;
}

export interface PathCard {
  id: string; slug: string; title: string; description: string | null; icon: string; color: string;
  courseCount: number; completedCount: number; courses: CourseCard[]; hasExam?: boolean;
}

export interface LessonRow { id: string; title: string; type: LessonType; durationSec: number; required: boolean; isFinalQuiz: boolean; done: boolean; best: number | null; skillIds?: string[] }
export interface CourseDetail extends CourseCard {
  about: string | null; outcomes: string[]; passScore: number; missionRule: 'ON_SUBMIT' | 'ON_APPROVAL'; sponsor: string | null;
  rating: { avg: number | null; count: number; mine: { stars: number; comment: string | null } | null };
  dependencies: { kind: 'PREREQUISITE' | 'COREQUISITE'; course: CourseCard; done: boolean }[];
  locked: boolean;
  skills?: { id: string; title: string; lessonCount: number; doneCount: number; mastered: boolean }[];
  modules: { id: string; title: string; lessons: LessonRow[] }[];
  me: (MyState & { certificate: { code: string; issuedAt: string; score: number | null } | null }) | null;
}

export interface QuizQuestion { id: string; kind: 'single' | 'multi' | 'tf'; text: string; options: { id: string; text: string }[] }
export interface LessonDetail {
  id: string; title: string; type: LessonType; durationSec: number; required: boolean; isFinalQuiz: boolean;
  content: any;
  course: { id: string; slug: string; title: string; passScore: number };
  progress: { positionSec: number; completedAt: string | null; data: any } | null;
  quiz?: { attempts: { score: number; passed: boolean; at: string }[]; nextAllowedAt: string | null };
}

export interface Completion { completed: boolean; certificate?: { code: string }; waitingFor?: string[] }

/* ───────── منطق مسیر، نسخهٔ ۲ ───────── */
export type ActorRole = 'IMAM' | 'SHARIK' | 'BAZU' | 'HASTEH' | 'OTHER';
export type PathSize = 'micro' | 'mid' | 'macro';
export interface Pub { id: string; name: string; color: string }
export interface PathItemV2 { kind: 'course' | 'path' | 'live' | 'assess'; id: string; slug?: string; title: string; color?: string; icon?: string; publisher: Pub | null; optional: boolean; percent: number; done: boolean; started: boolean; to: string; lessonCount?: number; durationSec?: number; size?: PathSize; sizeFa?: string; startsAt?: string }
export interface PathStepV2 { id: string; title: string; rule: string | null; items: PathItemV2[]; done: boolean; percent: number }
export interface PathV2 {
  id: string; slug: string; title: string; size: PathSize; sizeFa: string; description: string | null; color: string; publisher: Pub | null; audience: ActorRole[]; hasRahyar: boolean; status: string; isMain: boolean; mainFor: ActorRole[];
  steps: PathStepV2[]; percent: number; currentStep: number; stepCount: number; enrolledCount: number; rahyar: { id: string; name: string } | null; gaade: { id: string; title: string; at: string; where: string; topic: string } | null; growthSteps: number;
  me: { enrolled: boolean; enrolledAt: string | null; completedAt: string | null };
}
export interface NextStep { kind: string; kicker: string; title: string; cta: string; to: string; color: string; pct?: number }
export interface Learning { actorRole: ActorRole | null; main: PathV2 | null; mine: PathV2[]; suggestions: PathV2[]; next: NextStep; gaade: PathV2['gaade'] }
export type TaskStatus = 'need' | 'open' | 'wait' | 'back' | 'done';
export interface FieldTask { lessonId: string; title: string; goal: string | null; course: { slug: string; title: string }; path: { slug: string; title: string; color: string } | null; status: TaskStatus; submittedAt: string | null; reviewedAt: string | null; note: string | null; to: string }
