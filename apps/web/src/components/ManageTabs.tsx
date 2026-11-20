import { CalendarCog, Flag, Megaphone } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { useManage } from './Shell';

/** سربرگ مشترک «برگزاری»: برنامه، پویش و پیام گروهی سه زبانهٔ یک جا هستند، نه سه منو */
export function ManageTabs() {
  const m = useManage();
  const { pathname } = useLocation();
  const tabs = [
    m.events && { to: '/manage/events', label: 'برنامه‌ها', icon: CalendarCog },
    m.campaigns && { to: '/manage/campaigns', label: 'پویش‌ها', icon: Flag },
    m.broadcast && { to: '/broadcast', label: 'پیام گروهی', icon: Megaphone },
  ].filter(Boolean) as { to: string; label: string; icon: typeof Flag }[];
  if (pathname.startsWith('/admin') || tabs.length < 2) return null;
  return (
    <nav className="-mt-1 mb-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="بخش‌های برگزاری">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end className={({ isActive }) => `-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-[15px] font-bold no-underline ${isActive ? 'border-leaf text-leaf-ink' : 'border-transparent text-muted hover:text-ink'}`}>
          <t.icon className="size-[18px]" />{t.label}
        </NavLink>
      ))}
    </nav>
  );
}
