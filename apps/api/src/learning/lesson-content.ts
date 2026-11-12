/**
 * شکل محتوای هر نوع درس (ستون lessons.content).
 * پاسخ درست پرسش‌ها هرگز برای یادگیرنده فرستاده نمی‌شود؛ فقط پس از ثبت پاسخ، توضیح برمی‌گردد.
 */
/** یادگیری فعال: پرسش کوتاهِ وسط درس (متن، ویدیو، صوت). نمره ندارد و جلوی تمام شدن درس را نمی‌گیرد؛ بازخورد فوری می‌دهد */
export interface CheckQuestion { id: string; text: string; options: { id: string; text: string }[]; correct: string[]; explain?: string }
export interface VideoContent { provider: 'aparat' | 'file'; aparatHash?: string; fileKey?: string; summary?: string; transcript?: string; checks?: CheckQuestion[] }
export interface AudioContent { fileKey?: string; url?: string; summary?: string; transcript?: string; checks?: CheckQuestion[] }
export interface TextContent { body: string; keyPoints?: string[]; checks?: CheckQuestion[] }
export interface QuizQuestion {
  id: string;
  kind: 'single' | 'multi' | 'tf';
  text: string;
  options: { id: string; text: string }[];
  correct: string[];
  explain?: string;
}
export interface QuizContent { intro?: string; questions: QuizQuestion[] }
export interface WorksheetContent { prompt: string; fields: { id: string; label: string; hint?: string }[] }
export interface MissionContent { goal: string; steps: string[] }
/** تمرین (سناریوی تصمیم): در هر موقعیت یک انتخاب؛ هر انتخاب بازخورد خودش را دارد. نمره ندارد؛ با پاسخ به همهٔ موقعیت‌ها تمام می‌شود */
export interface PracticeContent {
  intro?: string;
  steps: { id: string; situation: string; choices: { id: string; text: string; score: 0 | 1 | 2; feedback: string }[] }[];
}

/** نسخهٔ امن برای یادگیرنده: پاسخ‌های درست حذف می‌شود */
export function publicContent(type: string, content: any) {
  if (type === 'QUIZ' && content?.questions) {
    return {
      ...content,
      questions: (content as QuizContent).questions.map(({ correct: _c, explain: _e, ...q }) => q),
    };
  }
  if (Array.isArray(content?.checks)) {
    return { ...content, checks: (content.checks as CheckQuestion[]).map(({ correct: _c, explain: _e, ...q }) => q) };
  }
  return content ?? {};
}

/** بررسی یک پرسش کوتاه وسط درس */
export function gradeCheck(content: any, checkId: string, answer: string[]) {
  const q = (content?.checks as CheckQuestion[] | undefined)?.find((x) => x.id === checkId);
  if (!q) return null;
  const given = [...new Set(answer ?? [])].sort();
  const want = [...q.correct].sort();
  return { ok: given.length === want.length && given.every((g, i) => g === want[i]), correct: q.correct, explain: q.explain ?? '' };
}

/** پرسش‌های آزمون یک دوره که برای مرور با فاصله به کار می‌آیند */
export function reviewPool(lessonsOfCourse: { type: string; isFinalQuiz: boolean; content: any }[]): QuizQuestion[] {
  const quizzes = lessonsOfCourse.filter((l) => l.type === 'QUIZ' && Array.isArray(l.content?.questions));
  const ordered = [...quizzes.filter((l) => l.isFinalQuiz), ...quizzes.filter((l) => !l.isFinalQuiz)];
  return ordered.flatMap((l) => (l.content as QuizContent).questions);
}

export function gradeQuiz(content: QuizContent, answers: Record<string, string[]>) {
  const results = content.questions.map((q) => {
    const given = [...new Set(answers[q.id] ?? [])].sort();
    const want = [...q.correct].sort();
    const ok = given.length === want.length && given.every((g, i) => g === want[i]);
    return { id: q.id, ok, correct: q.correct, explain: q.explain ?? '' };
  });
  const score = content.questions.length ? Math.round((results.filter((r) => r.ok).length / content.questions.length) * 100) : 0;
  return { score, results };
}

/** وضعیت مهارت‌های یک دوره برای یک نفر: مهارت وقتی «بلد» است که همهٔ درس‌های وصل‌شده به آن تمام شده باشد */
export function skillStates(skills: { id: string; title: string }[] | null | undefined, lessonRows: { id: string; skillIds: string[] }[], done: Set<string>) {
  return (skills ?? []).map((sk) => {
    const ls = lessonRows.filter((l) => (l.skillIds ?? []).includes(sk.id));
    const d = ls.filter((l) => done.has(l.id)).length;
    return { id: sk.id, title: sk.title, lessonCount: ls.length, doneCount: d, mastered: ls.length > 0 && d === ls.length };
  });
}
