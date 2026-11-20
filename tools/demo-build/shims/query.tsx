import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';

const hash = (k: unknown) => JSON.stringify(k);
type Entry = { key: unknown[]; data: any; error: any; status: 'pending' | 'success' | 'error'; updatedAt: number; fetching?: Promise<any>; fn?: () => Promise<any>; subs: Set<() => void>; stale?: boolean };

export class MutationCache { constructor(public config: { onError?: (...a: any[]) => void; onSuccess?: (...a: any[]) => void } = {}) {} }

export class QueryClient {
  cache = new Map<string, Entry>();
  mutationCache: MutationCache;
  defaultOptions: any;
  constructor(cfg: { mutationCache?: MutationCache; defaultOptions?: any } = {}) { this.mutationCache = cfg.mutationCache ?? new MutationCache(); this.defaultOptions = cfg.defaultOptions ?? {}; }
  entry(key: unknown[]) {
    const h = hash(key);
    let e = this.cache.get(h);
    if (!e) { e = { key, data: undefined, error: null, status: 'pending', updatedAt: 0, subs: new Set() }; this.cache.set(h, e); }
    return e;
  }
  fetchSubs = new Set<() => void>();
  fetching() { let n = 0; this.cache.forEach((e) => { if (e.fetching) n++; }); return n; }
  notify(e: Entry) { e.subs.forEach((f) => f()); this.fetchSubs.forEach((f) => f()); }
  fetch(e: Entry) {
    if (e.fetching || !e.fn) return e.fetching;
    const p = e.fn().then((d) => { e.data = d; e.error = null; e.status = 'success'; e.updatedAt = Date.now(); e.stale = false; },
      (err) => { e.error = err; e.status = 'error'; e.updatedAt = Date.now(); })
      .finally(() => { e.fetching = undefined; this.notify(e); });
    e.fetching = p; this.notify(e);
    return p;
  }
  match(filter?: { queryKey?: unknown[]; exact?: boolean }) {
    return [...this.cache.values()].filter((e) => {
      if (!filter?.queryKey) return true;
      const k = filter.queryKey;
      if (filter.exact) return hash(k) === hash(e.key);
      return k.every((v, i) => hash(v) === hash(e.key[i]));
    });
  }
  invalidateQueries(filter?: { queryKey?: unknown[]; exact?: boolean }) {
    return Promise.all(this.match(filter).map((e) => { e.stale = true; return e.subs.size ? this.fetch(e) : undefined; }));
  }
  refetchQueries(f?: any) { return this.invalidateQueries(f); }
  removeQueries(f?: any) { this.match(f).forEach((e) => this.cache.delete(hash(e.key))); }
  resetQueries(f?: any) { return this.invalidateQueries(f); }
  cancelQueries() { return Promise.resolve(); }
  getQueryData(key: unknown[]) { return this.cache.get(hash(key))?.data; }
  setQueryData(key: unknown[], upd: any) {
    const e = this.entry(key);
    e.data = typeof upd === 'function' ? upd(e.data) : upd; e.status = 'success'; e.error = null; e.updatedAt = Date.now();
    this.notify(e); return e.data;
  }
  clear() { this.cache.forEach((e) => { e.data = undefined; e.status = 'pending'; e.stale = true; }); this.cache.forEach((e) => e.subs.size && this.fetch(e)); }
}

const Ctx = createContext<QueryClient | null>(null);
export const QueryClientProvider = ({ client, children }: { client: QueryClient; children: ReactNode }) => <Ctx.Provider value={client}>{children}</Ctx.Provider>;
export const useQueryClient = () => useContext(Ctx)!;

export function useQuery(o: any) {
  const qc = useQueryClient();
  const opts = { ...(qc.defaultOptions.queries ?? {}), ...o };
  const enabled = opts.enabled !== false;
  const e = qc.entry(opts.queryKey);
  e.fn = () => Promise.resolve().then(() => opts.queryFn({ queryKey: opts.queryKey, signal: new AbortController().signal }));
  if (e.status === 'pending' && e.data === undefined && opts.initialData !== undefined) { e.data = typeof opts.initialData === 'function' ? opts.initialData() : opts.initialData; e.status = 'success'; e.updatedAt = Date.now(); }
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    e.subs.add(force);
    if (enabled) {
      const stale = e.stale || e.status !== 'success' || Date.now() - e.updatedAt > (opts.staleTime ?? 0);
      if (stale && !(e.status === 'error' && Date.now() - e.updatedAt < 1000)) qc.fetch(e);
    }
    return () => { e.subs.delete(force); };
  }, [hash(opts.queryKey), enabled]);
  useEffect(() => {
    if (!enabled || !opts.refetchInterval) return;
    const ms = typeof opts.refetchInterval === 'function' ? opts.refetchInterval({ state: { data: e.data } }) : opts.refetchInterval;
    if (!ms) return;
    const t = setInterval(() => qc.fetch(e), ms); return () => clearInterval(t);
  }, [hash(opts.queryKey), enabled, opts.refetchInterval]);
  let data = e.data;
  if (data !== undefined && opts.select) { try { data = opts.select(data); } catch { /* */ } }
  const status = e.status;
  const fetching = !!e.fetching;
  return {
    data, error: e.error, status,
    isPending: status === 'pending', isLoading: status === 'pending' && enabled,
    isError: status === 'error', isSuccess: status === 'success', isFetching: fetching || (status === 'pending' && enabled), isRefetching: fetching && status !== 'pending',
    fetchStatus: fetching ? 'fetching' : 'idle', dataUpdatedAt: e.updatedAt,
    refetch: () => { e.stale = true; return qc.fetch(e)!.then(() => ({ data: e.data, error: e.error })); },
  };
}

export function useMutation(o: any) {
  const qc = useQueryClient();
  const ref = useRef(o); ref.current = o;
  const [s, set] = useState<{ status: string; data?: any; error?: any; variables?: any }>({ status: 'idle' });
  const mutateAsync = useCallback(async (vars?: any, per?: any) => {
    const opt = ref.current;
    set({ status: 'pending', variables: vars });
    let ctx: any;
    try {
      ctx = await opt.onMutate?.(vars);
      const data = await opt.mutationFn(vars);
      set({ status: 'success', data, variables: vars });
      await opt.onSuccess?.(data, vars, ctx); per?.onSuccess?.(data, vars, ctx);
      await opt.onSettled?.(data, null, vars, ctx); per?.onSettled?.(data, null, vars, ctx);
      return data;
    } catch (err) {
      set({ status: 'error', error: err, variables: vars });
      qc.mutationCache.config.onError?.(err, vars, ctx, { options: { ...opt, onError: opt.onError ?? per?.onError }, meta: opt.meta });
      opt.onError?.(err, vars, ctx); per?.onError?.(err, vars, ctx);
      opt.onSettled?.(undefined, err, vars, ctx); per?.onSettled?.(undefined, err, vars, ctx);
      throw err;
    }
  }, []);
  const mutate = useCallback((v?: any, per?: any) => { mutateAsync(v, per).catch(() => {}); }, []);
  return { ...s, mutate, mutateAsync, isPending: s.status === 'pending', isIdle: s.status === 'idle', isError: s.status === 'error', isSuccess: s.status === 'success', reset: () => set({ status: 'idle' }) };
}

export function useIsFetching() {
  const qc = useQueryClient();
  const [n, set] = useState(() => qc.fetching());
  useEffect(() => { const f = () => set(qc.fetching()); qc.fetchSubs.add(f); return () => { qc.fetchSubs.delete(f); }; }, []);
  return n;
}
