/* صفحهٔ یک دورهٔ گروهی: زمان‌بندی ایستگاه‌ها و همراهی. پیوند اعلان‌های دورهٔ گروهی به این‌جا می‌آید. */
import { useQuery } from '@tanstack/react-query';
import { CircleCheck, Clock, Users } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { CohortCard } from '../components/Growth';
import { Empty, ErrorBox, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { fa, jShort } from '../lib/fa';
import type { Cohort } from '../lib/growth';

export default function CohortPage() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['cohorts', 'one', id], queryFn: () => api<Cohort>(`/cohorts/${id}`) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const c = q.data!;
  if (c.cancelled) return (
    <Empty icon={Users} title="این دورهٔ گروهی لغو شده است">پیشرفت شما در دوره‌ها سر جایش است. <Link to={`/paths/${c.path.slug}`} className="font-bold text-leaf-ink">ادامهٔ مسیر «{c.path.title}»</Link></Empty>
  );
  return (
    <div className="rise mx-auto grid max-w-3xl gap-6">
      <nav className="text-sm text-muted"><Link to={`/cores/${c.core.id}`} className="text-leaf-ink">{c.core.name}</Link> / مسیر گروهی</nav>
      <CohortCard c={c} linkSelf={false} />
      <section aria-labelledby="sch-h">
        <h2 id="sch-h" className="mb-1 text-lg font-extrabold">زمان‌بندی ایستگاه‌ها</h2>
        <p className="mb-4 text-sm text-muted">هر ایستگاه از تاریخ خودش «ایستگاه این هفته» است. جلوتر رفتن آزاد است؛ عقب ماندن هم جریمه ندارد.</p>
        <ol className="grid gap-2">
          {c.stations.map((s, i) => {
            const now = i === c.currentStation; const open = new Date(s.opensAt) <= new Date();
            return (
              <li key={s.course.slug}>
                <Link to={`/courses/${s.course.slug}`} className={`card is-link flex items-center gap-3 p-4 no-underline ${now ? 'border-flame/50' : ''}`}>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${s.doneByMe ? 'bg-leaf text-on-action' : now ? 'bg-flame-soft text-flame-ink' : 'bg-sunken text-muted'}`}>{s.doneByMe ? <CircleCheck className="size-5" /> : fa(i + 1)}</span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-ink">{s.course.title}</b>
                    <span className="flex items-center gap-1 text-xs text-muted"><Clock className="size-3" />{now ? 'ایستگاه این هفته' : open ? `از ${jShort(s.opensAt)}` : `از ${jShort(s.opensAt)} باز می‌شود`}{s.doneCount ? ` · ${fa(s.doneCount)} نفر تمامش کرده‌اند` : ''}</span></span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
