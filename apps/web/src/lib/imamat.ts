import { useQuery } from '@tanstack/react-query';
import { api } from './api';

/** فرایند تعیّن امامت: امامت تعیّنی است، نه تعیینی؛ سطح از ارزیابی میدانی راهیار می‌آید. */
export const SECTORS = {
  self: { name: 'خودسازی امام', c: '#8C93B5', soft: '#EEF0F5', ink: '#3E4462' },
  nahad: { name: 'نهاد امامت', c: '#D64A6A', soft: '#FBE6EB', ink: '#A8314F' },
  meydan: { name: 'به پا داشتن مردم', c: '#F08C1A', soft: '#FDEBC4', ink: '#8A5A00' },
  peyvand: { name: 'پیوندهای اجتماعی', c: '#12A58E', soft: '#D3EFEA', ink: '#0B5F52' },
} as const;
export type SectorKey = keyof typeof SECTORS;
export const PETALS: { id: string; sector: SectorKey; name: string; desc: string }[] = [
  ['manavi', 'self', 'مراقبت معنوی', 'مراقبت‌های معنوی امام؛ محاسبه و انس با قرآن.'],
  ['akhlagh', 'self', 'اخلاق عمومی', 'خوش‌رویی، حلم و رفتار مهربانانه با همه، حتی کسانی که مسجدی نیستند.'],
  ['ertebat', 'self', 'ارتباط با مردم', 'سلام پیش‌قدمانه، نام‌دانی، گوش دادن و سراغ گرفتن.'],
  ['orfi', 'self', 'ویژگی‌های عرفی', 'شناخت عرف محله و زبان مردم آن.'],
  ['tashkilat', 'self', 'اخلاق تشکیلاتی', 'کار جمعی، پرهیز از منیت و اعلام کار خوب به نام صاحبش.'],
  ['modiriat', 'self', 'مدیریت', 'مدیریت از جنس اقناع و همکاری از جنس قرار مکتوب.'],
  ['resane', 'self', 'سواد رسانه', 'فهم رسانه و ادارهٔ گروه و کانال محله.'],
  ['sharika', 'nahad', 'شریکة‌الامام', 'همسر امام، امام میدان زنان و دختران محله.'],
  ['bazovan', 'nahad', 'بازوان اجرایی', 'جوانان متعهدی که کار را به سرانجام می‌رسانند.'],
  ['halghe', 'meydan', 'حلقه‌های میانی', 'یافتن کسانی که ذهن فعال و زبان گویا دارند و مردم را به میدان می‌آورند.'],
  ['sahne', 'meydan', 'شناخت صحنه', 'تصویری درست و واقع‌بینانه از محله؛ نه تاریک و نه کاذب.'],
  ['omid', 'meydan', 'نقاط امید', 'نشانه‌هایی که ثابت می‌کند کار شدنی است.'],
  ['tamadon', 'meydan', 'جهت‌گیری تمدنی', 'پیوند کار کوچک محله به مسیر بزرگ انقلاب.'],
  ['rahkar', 'meydan', 'طراحی راهکار', 'از ریشه‌یابی تا راه‌حل قابل سنجش.'],
  ['eghdam', 'meydan', 'طراحی اقدام', 'برنامه‌ای که هر کارش متولی و مهلت دارد.'],
  ['ejra', 'meydan', 'اجرای اقدام', 'اقدام میدانی تیمی و جمعی.'],
  ['arzyabi', 'meydan', 'ارزیابی', 'بازخوردگیری و سنجش اثر؛ تا مسئلهٔ بعدی بهتر حل شود.'],
  ['tabyin', 'meydan', 'تبیین و گفتمان', 'گفت‌وگو و روایت؛ کار خوبی که روایت نشود، می‌میرد.'],
  ['khish', 'peyvand', 'پیوند خویشاوندی', 'صلهٔ رحم امام، الگوی صلهٔ رحم محله.'],
  ['okhovat', 'peyvand', 'ارکان اخوت', 'پلکان اخوت و حقوق همسایگی تا چهل خانه.'],
  ['vefagh', 'peyvand', 'یکرویی و وفاق', 'پاسخ به نیاز انس؛ همدمی اهل مسجد با هم.'],
  ['ettehad', 'peyvand', 'اتحاد و یگانگی', 'رشد با هم؛ پاسخ به نیاز کمال.'],
  ['tavazo', 'peyvand', 'تواضع', 'دیده شدن و احترام؛ پاسخ به نیاز عزت.'],
  ['fotovat', 'peyvand', 'فتوت', 'پشتیبانی بی‌چشمداشت؛ پاسخ به نیاز یاری.'],
].map(([id, sector, name, desc]) => ({ id, sector: sector as SectorKey, name, desc }));
export const LEVELS = [
  { n: 1, name: 'امام جماعت', focus: 'تمرکز بر اقامهٔ نماز' },
  { n: 2, name: 'امام مسجد', focus: 'تمرکز بر مسجد' },
  { n: 3, name: 'امام محله', focus: 'تمرکز بر محله' },
  { n: 4, name: 'امام میانی', focus: 'نقش الگویی و تمدنی' },
];
export const SPIRAL = ['آشنایی و شناخت (۰ تا ۵ نفر)', 'اعتمادسازی و ریشه‌دوانی (۵ تا ۲۰ نفر)', 'ساختارسازی در محله (۲۰ تا ۱۰۰ نفر)', 'بلوغ و تعمیق (بیش از ۱۰۰ نفر)', 'تثبیت و انتقال؛ شبکهٔ شبکه‌ها'];

export interface Person { id: string; name: string; gender: 'MALE' | 'FEMALE' | null; role: 'RAHYAR' | 'IMAM' | null }
export interface Imamat { isImam: boolean; level: number; spiral: number; petals: Record<string, number>; assessments: { id: string; level: number; spiral: number; note: string; createdAt: string; by: Person }[] }
export const useImamat = (enabled = true) => useQuery({ queryKey: ['imamat'], queryFn: () => api<Imamat>('/me/imamat'), enabled });
export const sectorPct = (im: Imamat, k: SectorKey) => { const ps = PETALS.filter((p) => p.sector === k); return (ps.reduce((a, p) => a + (im.petals[p.id] ?? 0), 0) / (ps.length * 4)) * 100; };
