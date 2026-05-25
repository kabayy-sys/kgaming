'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  Home,
  Monitor,
  CalendarCheck,
  LogIn,
  LayoutDashboard,
  Clock,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home, authRequired: false },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, authRequired: true },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck, authRequired: true },
  { href: '/activity', label: 'Activity', icon: Clock, authRequired: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Don't show on auth pages
  if (pathname.startsWith('/login')) return null;

  return (
    <nav className="bottom-nav safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isVisible = !item.authRequired || (item.authRequired && isAuthenticated);
          if (!isVisible) return null;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all duration-200',
                isActive
                  ? 'text-neon-cyan'
                  : 'text-gaming-400 hover:text-gaming-200'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5',
                isActive && 'drop-shadow-[0_0_8px_rgba(0,245,212,0.5)]'
              )} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}