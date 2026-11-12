/* مرور با فاصله: چند روز پس از پایان دوره، سه پرسش کوتاه از همان دوره. بی‌نمرهٔ منفی و بی‌اثر روی گواهی. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Clock, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Empty, ErrorBox, InlineSpinner, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { fa, jDate, jShort } from '../lib/fa';
import type { ReviewDetail } from '../lib/growth';

type Result = { score: number | null; results: { id: string; ok: boolean; correct: string[]; explain: string }[] };

export default function Review() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['review', id], queryFn: () => api<ReviewDetail>(`/reviews/${id}`) });
  const [ans, setAns] = useState<Record<string, string[]>>({});
  const [res, setRes] = useState<Result | null>(null);
  const send = useMutation({
    mutationFn: () => api<Result>(`/reviews/${id}`, { body: { answers: ans } }),
    onSuccess: (r) => { setRes(r); qc.invalidateQueries({ queryKey: ['reviews'] }); qc.invalidateQueries({ queryKey: ['review', id] }); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const r = q.data!;
  const head = (
    <header className="grid gap-2">
      <nav className="text-sm text-muted"><Link to={`/courses/${r.course.slug}`} className="text-leaf-ink">{r.course.title}</Link> / مرور</nav>
      <h1 className="flex items-center gap-3 text-[clamp(22px,3vw,30px)] font-extrabold"><RotateCcw className="size-7 text-dome-ink" />مرور «{r.course.title}»</h1>
    </header>
  );

  if (res) {
    const ok = res.results.filter((x) => x.ok).length;
    const all = res.results.length;
    return (
      <div className="rise mx-auto grid max-w-2xl gap-6">
        {head}
        <section className="card grid gap-3 p-6">
          <b className="text-xl text-ink">{!all ? 'این مرور بسته شد' : ok === all ? 'همه را به یاد داشتید' : ok ? `${fa(ok)} از ${fa(all)} را به یاد داشتید` : 'این‌ها کمی کم‌رنگ شده بودند'}</b>
          <p className="text-body">{!all ? 'پرسش‌های این مرور از دوره برداشته شده بود.' : ok === all ? 'آموخته‌ها جا افتاده‌اند. مرور بعدی، اگر باشد، چند روز دیگر است.' : 'همین که حالا دوباره دیدیدشان، بیشتر می‌مانند. توضیح هر پرسش این پایین است.'}</p>
          {all > 0 && <ol className="grid gap-2">{r.questions.map((qq, i) => { const x = res.results.find((y) => y.id === qq.id); return (
            <li key={qq.id} className={`rounded-xl p-3 text-sm ${x?.ok ? 'bg-leaf-soft' : 'bg-sunken'}`}>
              <b className="flex items-start gap-2 text-ink">{x?.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-leaf" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose" />}{fa(i + 1)}. {qq.text}</b>
              {!x?.ok && <p className="mt-1">پاسخ درست: {qq.options.filter((o) => x?.correct.includes(o.id)).map((o) => o.text).join('، ')}</p>}
              {x?.explain && <p className="mt-1 text-muted">{x.explain}</p>}
            </li>); })}</ol>}
          <div className="flex flex-wrap gap-2 pt-2"><Link className="btn btn-primary" to="/">بازگشت به خانه</Link><Link className="btn btn-ghost" to={`/courses/${r.course.slug}`}>دیدن دوبارهٔ دوره</Link></div>
        </section>
      </div>
    );
  }

  if (r.doneAt) return (
    <div className="rise mx-auto grid max-w-2xl gap-6">{head}
      <Empty icon={CircleCheck} title="این مرور را انجام داده‌اید">{jDate(r.doneAt)}{r.score != null ? ` · ٪${fa(r.score)} را به یاد داشتید` : ''}. <Link to="/" className="font-bold text-leaf-ink">بازگشت به خانه</Link></Empty>
    </div>
  );
  if (!r.open) return (
    <div className="rise mx-auto grid max-w-2xl gap-6">{head}
      <Empty icon={Clock} title="هنوز وقت این مرور نرسیده">از {jShort(r.dueAt)} باز می‌شود و همان روز خبرتان می‌کنیم. فاصله است که مرور را اثرگذار می‌کند.</Empty>
    </div>
  );

  const pick = (qq: ReviewDetail['questions'][number], o: string) => setAns((a) => ({ ...a, [qq.id]: qq.kind === 'multi' ? (a[qq.id]?.includes(o) ? a[qq.id].filter((x) => x !== o) : [...(a[qq.id] ?? []), o]) : [o] }));
  const answered = r.questions.every((qq) => ans[qq.id]?.length);
  return (
    <div className="rise mx-auto grid max-w-2xl gap-6">
      {head}
      <p className="text-body">{fa(r.questions.length)} پرسش از همین دوره. نمره‌ای ثبت نمی‌شود که روی گواهی اثر بگذارد؛ فقط برای این است که ببینید چه مانده و چه کم‌رنگ شده.</p>
      {r.questions.length ? (
        <>
          <ol className="grid gap-4">{r.questions.map((qq, i) => (
            <li key={qq.id} className="card p-5"><p className="font-bold text-ink"><span className="text-muted">{fa(i + 1)}. </span>{qq.text}{qq.kind === 'multi' && <span className="ms-1 text-sm font-normal text-muted">(چند گزینه)</span>}</p>
              <div className="mt-3 grid gap-2">{qq.options.map((o) => { const sel = ans[qq.id]?.includes(o.id); return (
                <button key={o.id} type="button" onClick={() => pick(qq, o.id)} aria-pressed={!!sel} className={`opt rounded-xl border px-4 py-3 text-start ${sel ? 'border-leaf bg-leaf-soft' : 'border-line hover:border-line-strong'}`}>{o.text}</button>); })}</div></li>
          ))}</ol>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary btn-lg" disabled={!answered || send.isPending} onClick={() => send.mutate()}>{send.isPending && <InlineSpinner />}دیدن نتیجه</button>
            {!answered && <span className="hint">به همهٔ پرسش‌ها پاسخ دهید.</span>}
          </div>
        </>
      ) : (
        <div className="card grid gap-3 p-5"><p>پرسش‌های این مرور از دوره برداشته شده‌اند.</p><div><button className="btn btn-secondary" disabled={send.isPending} onClick={() => send.mutate()}>بستن این مرور</button></div></div>
      )}
    </div>
  );
}
