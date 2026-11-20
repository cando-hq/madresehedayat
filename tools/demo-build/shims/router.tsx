import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Route = { path?: string; index?: boolean; element?: ReactNode; errorElement?: ReactNode; children?: Route[] };
type Loc = { pathname: string; search: string; hash: string; state: any; key: string };

const readLoc = (): Loc => {
  const h = window.location.hash.replace(/^#/, '') || '/';
  const i = h.indexOf('?');
  return { pathname: (i < 0 ? h : h.slice(0, i)) || '/', search: i < 0 ? '' : h.slice(i), hash: '', state: (history.state && history.state.usr) ?? null, key: String(Date.now()) };
};

const LocCtx = createContext<Loc>(readLoc());
const OutletCtx = createContext<ReactNode>(null);
const ParamsCtx = createContext<Record<string, string>>({});
const ErrCtx = createContext<unknown>(undefined);
const BaseCtx = createContext<string>('/');

function go(to: string, replace = false) {
  const url = window.location.pathname + window.location.search + '#' + to;
  if (replace) history.replaceState({}, '', url); else history.pushState({}, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function resolve(to: string, base: string) {
  if (to.startsWith('/')) return to;
  const cur = readLoc().pathname;
  const parts = (cur.endsWith('/') ? cur : cur + '/').split('/').filter(Boolean);
  for (const seg of to.split('/')) { if (seg === '..') parts.pop(); else if (seg && seg !== '.') parts.push(seg); }
  return '/' + parts.join('/');
}

type Match = { route: Route; params: Record<string, string> };
function matchRoutes(routes: Route[], segs: string[], parentParams: Record<string, string>, splatOk = false): Match[] | null {
  for (const r of routes) {
    if (!splatOk && (r.path ?? '').includes('*')) continue;
    if (r.index) { if (segs.length === 0) return [{ route: r, params: parentParams }]; continue; }
    const p = (r.path ?? '').replace(/^\//, '');
    const ps = p === '' ? [] : p.split('/');
    const params = { ...parentParams };
    let ok = true, i = 0, splat = false;
    for (; i < ps.length; i++) {
      if (ps[i] === '*') { params['*'] = segs.slice(i).join('/'); splat = true; i = segs.length; break; }
      if (i >= segs.length) { ok = false; break; }
      if (ps[i].startsWith(':')) params[ps[i].slice(1)] = decodeURIComponent(segs[i]);
      else if (ps[i] !== segs[i]) { ok = false; break; }
    }
    if (!ok) continue;
    const rest = splat ? [] : segs.slice(ps.length);
    if (r.children) {
      const sub = matchRoutes(r.children, rest, params, splatOk);
      if (sub) return [{ route: r, params }, ...sub];
      if (rest.length === 0 && !r.children.some((c) => c.index)) return [{ route: r, params }];
      continue;
    }
    if (rest.length === 0) return [{ route: r, params }];
  }
  return null;
}

class Boundary extends React.Component<{ fallback: ReactNode; resetKey: string; children: ReactNode }, { err: unknown; key: string }> {
  state = { err: undefined as unknown, key: this.props.resetKey };
  static getDerivedStateFromError(err: unknown) { return { err }; }
  static getDerivedStateFromProps(p: any, s: any) { return p.resetKey !== s.key ? { err: undefined, key: p.resetKey } : null; }
  render() { return this.state.err !== undefined ? <ErrCtx.Provider value={this.state.err}>{this.props.fallback}</ErrCtx.Provider> : this.props.children; }
}

export function createHashRouter(routes: Route[]) { return { routes }; }
export const createBrowserRouter = createHashRouter;

export function RouterProvider({ router }: { router: { routes: Route[] } }) {
  const [loc, setLoc] = useState(readLoc);
  useEffect(() => {
    const on = () => { setLoc(readLoc()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on); window.addEventListener('popstate', on);
    return () => { window.removeEventListener('hashchange', on); window.removeEventListener('popstate', on); };
  }, []);
  const segs = loc.pathname.split('/').filter(Boolean);
  const matches = useMemo(() => matchRoutes(router.routes, segs, {}) ?? matchRoutes(router.routes, segs, {}, true) ?? [], [loc.pathname]);
  let out: ReactNode = null;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    let el: ReactNode = <OutletCtx.Provider value={out}><ParamsCtx.Provider value={matches[matches.length - 1].params}>{m.route.element ?? out}</ParamsCtx.Provider></OutletCtx.Provider>;
    if (m.route.errorElement) el = <Boundary resetKey={loc.pathname} fallback={m.route.errorElement}>{el}</Boundary>;
    out = el;
  }
  return <LocCtx.Provider value={loc}>{out}</LocCtx.Provider>;
}

export const Outlet = () => <>{useContext(OutletCtx)}</>;
export const useLocation = () => useContext(LocCtx);
export const useParams = <T = Record<string, string>,>() => useContext(ParamsCtx) as any as T;
export const useRouteError = () => useContext(ErrCtx);
export function useNavigate() {
  const base = useContext(BaseCtx);
  return (to: string | number, opts?: { replace?: boolean }) => { if (typeof to === 'number') history.go(to); else go(resolve(to, base), opts?.replace); };
}
export function useSearchParams(): [URLSearchParams, (v: any, o?: { replace?: boolean }) => void] {
  const loc = useLocation();
  const sp = new URLSearchParams(loc.search);
  return [sp, (v, o) => { const n = new URLSearchParams(typeof v === 'function' ? v(sp) : v); const s = n.toString(); go(loc.pathname + (s ? '?' + s : ''), o?.replace); }];
}
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  useEffect(() => { go(resolve(to, '/'), replace); }, [to]);
  return null;
}
type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { to: string; replace?: boolean; end?: boolean; state?: any; className?: any; children?: any };
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, replace, end, state, onClick, target, ...rest }, ref) {
  const href = resolve(to, '/');
  return <a ref={ref} {...rest} target={target} href={'#' + href} onClick={(e) => {
    onClick?.(e);
    if (e.defaultPrevented || target === '_blank' || e.metaKey || e.ctrlKey || e.button !== 0) return;
    e.preventDefault(); go(href, replace);
  }} />;
});
export const NavLink = React.forwardRef<HTMLAnchorElement, LinkProps>(function NavLink({ to, end, className, children, style, ...rest }, ref) {
  const { pathname } = useLocation();
  const href = resolve(to, '/');
  const isActive = end || href === '/' ? pathname === href : pathname === href || pathname.startsWith(href.replace(/\/$/, '') + '/');
  const st = { isActive, isPending: false, isTransitioning: false };
  return <Link ref={ref} to={to} {...rest} aria-current={isActive ? 'page' : undefined}
    className={typeof className === 'function' ? className(st) : [className, isActive ? 'active' : ''].filter(Boolean).join(' ')}
    style={typeof style === 'function' ? (style as any)(st) : style}>{typeof children === 'function' ? children(st) : children}</Link>;
});
