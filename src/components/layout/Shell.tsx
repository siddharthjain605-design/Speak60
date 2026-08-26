import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../authStore';

const NAV_ITEMS = [
  { to: '/', label: 'Today', end: true },
  { to: '/progress', label: 'Progress' },
  { to: '/calendar', label: 'History' },
  { to: '/practice', label: 'Practice' },
  { to: '/topics', label: 'Topic Bank' },
  { to: '/settings', label: 'Settings' },
];

export default function Shell() {
  const isAdmin = useAuthStore((s) => s.profile?.is_admin ?? false);
  const displayName = useAuthStore((s) => s.profile?.display_name);
  const navItems = isAdmin ? [...NAV_ITEMS, { to: '/family', label: 'Family' }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight text-white">Speak<span className="text-violet-400">60</span></span>
            <span className="hidden text-xs text-zinc-500 sm:inline">Think. Structure. Speak.</span>
          </NavLink>
          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {displayName && (
              <span className="ml-2 hidden whitespace-nowrap rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 sm:inline">
                {displayName}
              </span>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
