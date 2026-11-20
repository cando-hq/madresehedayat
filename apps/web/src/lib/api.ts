/** درخواست به API با کوکی؛ اگر توکن منقضی شده بود یک بار تازه‌اش می‌کند. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public data: any = {}) { super(message); }
}

/** پیام فارسی برای وقتی پاسخ سرور JSON نیست (مثلاً صفحهٔ خطای nginx هنگام به‌روزرسانی) */
const BY_STATUS: Record<number, [string, string]> = {
  0: ['offline', 'اتصال برقرار نشد؛ اینترنت را بررسی کن'],
  401: ['unauthenticated', 'اول وارد شو'],
  403: ['forbidden', 'به این بخش دسترسی نداری'],
  404: ['not_found', 'پیدا نشد'],
  408: ['timeout', 'پاسخ دیر آمد؛ دوباره امتحان کن'],
  413: ['too_large', 'حجم فرستاده‌شده بیش از اندازه است؛ فایل یا متن کوچک‌تری بفرست'],
  429: ['too_many', 'درخواست‌ها پشت سر هم زیاد شد؛ یک دقیقه صبر کن و دوباره امتحان کن'],
  500: ['server_error', 'خطایی در سرور پیش آمد؛ کمی بعد دوباره امتحان کن'],
  502: ['unavailable', 'سامانه در حال به‌روزرسانی یا لحظه‌ای در دسترس نیست؛ چند دقیقهٔ دیگر دوباره امتحان کن'],
  503: ['unavailable', 'سامانه در حال به‌روزرسانی یا لحظه‌ای در دسترس نیست؛ چند دقیقهٔ دیگر دوباره امتحان کن'],
  504: ['timeout', 'سامانه دیر پاسخ داد؛ چند دقیقهٔ دیگر دوباره امتحان کن'],
};
export const statusError = (status: number): [string, string] => BY_STATUS[status] ?? (status >= 500 ? BY_STATUS[500] : ['error', 'این کار انجام نشد؛ دوباره امتحان کن']);

/** پیام یک خطا برای نمایش؛ هر چیزی که ApiError نباشد پیام عمومی می‌گیرد */
export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'خطایی پیش آمد؛ دوباره امتحان کن');
/** پیام هر خانه از خطای اعتبارسنجی سرور: { title: '«عنوان» لازم است' } */
export const fieldErrors = (e: unknown): Record<string, string> => (e instanceof ApiError && e.code === 'invalid' && e.data?.fields && !Array.isArray(e.data.fields) ? e.data.fields : {});

let refreshing: Promise<boolean> | null = null;
async function refresh() {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then((r) => r.ok).finally(() => { setTimeout(() => (refreshing = null), 0); });
  return refreshing;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData; retry?: boolean } = {}): Promise<T> {
  if (import.meta.env.VITE_DEMO) {
    const { demoApi } = await import('../demo/server');
    try { return await demoApi(path, opts.method ?? (opts.body || opts.form ? 'POST' : 'GET'), opts.body); }
    catch (e: any) { throw new ApiError(e.status ?? 500, e.code ?? 'error', e.message, e.data); }
  }
  const init: RequestInit = { method: opts.method ?? (opts.body || opts.form ? 'POST' : 'GET'), credentials: 'include', headers: {} };
  if (opts.form) init.body = opts.form;
  else if (opts.body !== undefined) { init.body = JSON.stringify(opts.body); (init.headers as Record<string, string>)['content-type'] = 'application/json'; }
  let res: Response;
  try { res = await fetch('/api' + path, init); } catch {
    const [code, message] = BY_STATUS[0];
    throw new ApiError(0, code, typeof navigator !== 'undefined' && navigator.onLine === false ? 'اینترنت وصل نیست؛ وصل که شد دوباره امتحان کن' : message);
  }
  // ‌/auth/me هم تازه می‌شود (وگرنه بعد از ۱۵ دقیقه دوری، کاربر بیرون افتاده دیده می‌شد)
  if (res.status === 401 && opts.retry !== false && (!path.startsWith('/auth/') || path.startsWith('/auth/me') || path.startsWith('/auth/mfa'))) {
    const data = await res.clone().json().catch(() => ({}));
    if (data.code === 'token_expired' || data.code === 'unauthenticated') {
      if (await refresh()) return api<T>(path, { ...opts, retry: false });
      if (path === '/auth/me') throw new ApiError(401, 'unauthenticated', 'اول وارد شو');
      // نشست تمام شده: برنامه به صفحهٔ ورود می‌رود و پیام می‌دهد
      window.dispatchEvent(new CustomEvent('mh:session-expired'));
      throw new ApiError(401, 'session_expired', 'نشست تو تمام شده است؛ دوباره وارد شو');
    }
  }
  // نقش تازه (مثلاً «مدیر برگزارکننده» که ستاد همین الان داده) در توکنِ قبلی نیست؛ یک بار توکن را تازه کن و دوباره بخواه
  if (res.status === 403 && opts.retry !== false && !path.startsWith('/auth/')) {
    if (await refresh()) return api<T>(path, { ...opts, retry: false });
  }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const [code, message] = statusError(res.status);
    throw new ApiError(res.status, typeof data?.code === 'string' ? data.code : code, typeof data?.message === 'string' ? data.message : message, data ?? {});
  }
  if (text && data === null) throw new ApiError(502, 'unavailable', BY_STATUS[502][1]);
  return data as T;
}

/**
 * بارگذاری یک فایل با درصد پیشرفت (fetch درصد بارگذاری نمی‌دهد).
 * پیش از شروع نشست را تازه می‌کند تا بارگذاری چنددقیقه‌ای وسط کار با «اول وارد شو» نیفتد.
 */
export async function uploadFile<T = any>(path: string, file: File, onProgress: (sent: number, total: number) => void, signal?: AbortSignal): Promise<T> {
  if (import.meta.env.VITE_DEMO) {
    for (let i = 1; i <= 10; i++) { if (signal?.aborted) throw new ApiError(0, 'aborted', 'بارگذاری لغو شد'); await new Promise((r) => setTimeout(r, 120)); onProgress((file.size * i) / 10, file.size); }
    return { key: `demo-${Date.now()}`, name: file.name, size: file.size, type: file.type } as T;
  }
  await api('/auth/me').catch(() => {});
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api' + path);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded, e.total); };
    xhr.onerror = () => { const [code, message] = BY_STATUS[0]; reject(new ApiError(0, code, navigator.onLine === false ? 'اینترنت قطع شد؛ وصل که شد دوباره بارگذاری کن' : message)); };
    xhr.onabort = () => reject(new ApiError(0, 'aborted', 'بارگذاری لغو شد'));
    xhr.onload = () => {
      let data: any = null;
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { data = null; }
      if (xhr.status >= 200 && xhr.status < 300 && data) return resolve(data as T);
      if (xhr.status === 401) window.dispatchEvent(new CustomEvent('mh:session-expired'));
      const [code, message] = statusError(xhr.status);
      reject(new ApiError(xhr.status, typeof data?.code === 'string' ? data.code : code, typeof data?.message === 'string' ? data.message : message, data ?? {}));
    };
    signal?.addEventListener('abort', () => xhr.abort());
    const fd = new FormData(); fd.append('file', file);
    xhr.send(fd);
  });
}
