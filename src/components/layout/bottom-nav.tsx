'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Home, Monitor, CalendarCheck, Clock } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home, authRequired: false },
  { href: '/dashboard', label: 'Dashboard', icon: Monitor, authRequired: true },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck, authRequired: true },
  { href: '/activity', label: 'Activity', icon: Clock, authRequired: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  if (pathname.startsWith('/login')) return null;

  return (
    <nav className="bottom-nav pb-safe-bottom">
      <div className="mx-auto flex max-w-app-lg items-center justify-between px-3 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isVisible = !item.authRequired || (item.authRequired && isAuthenticated);
          if (!isVisible) return null;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors',
                isActive
                  ? 'text-emerald-400'
                  : 'text-gaming-500 hover:text-gaming-300'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        {!isAuthenticated && (
          <button
            onClick={() => router.push('/login')}
            className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-gaming-500 hover:text-gaming-300 transition-colors"
          >
            <span className="text-lg">🔐</span>
            <span className="text-[10px] font-medium">Login</span>
          </button>
        )}
      </div>
    </nav>
  );
}