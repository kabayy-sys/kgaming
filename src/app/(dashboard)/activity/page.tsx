'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useActivityStore } from '@/stores/activity-store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { cn, timeAgo } from '@/lib/utils';
import {
  Activity,
  LogIn,
  LogOut,
  Monitor,
  CalendarCheck,
  UserPlus,
  UserX,
  KeyRound,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { ActivityAction } from '@/types';

const actionConfig: Record<ActivityAction, { icon: React.ReactNode; color: string; label: string }> = {
  device_status_change: { icon: <Monitor className="h-4 w-4" />, color: 'text-orange-400', label: 'Status Change' },
  device_created: { icon: <Monitor className="h-4 w-4" />, color: 'text-emerald-400', label: 'Device Created' },
  device_edited: { icon: <Monitor className="h-4 w-4" />, color: 'text-blue-400', label: 'Device Edited' },
  device_archived: { icon: <Monitor className="h-4 w-4" />, color: 'text-rose-400', label: 'Device Archived' },
  booking_created: { icon: <CalendarCheck className="h-4 w-4" />, color: 'text-yellow-400', label: 'Booking Created' },
  booking_approved: { icon: <CalendarCheck className="h-4 w-4" />, color: 'text-emerald-400', label: 'Booking Approved' },
  booking_rejected: { icon: <CalendarCheck className="h-4 w-4" />, color: 'text-rose-400', label: 'Booking Rejected' },
  booking_completed: { icon: <CalendarCheck className="h-4 w-4" />, color: 'text-blue-400', label: 'Booking Completed' },
  user_login: { icon: <LogIn className="h-4 w-4" />, color: 'text-cyan-400', label: 'Login' },
  user_logout: { icon: <LogOut className="h-4 w-4" />, color: 'text-gray-400', label: 'Logout' },
  staff_created: { icon: <UserPlus className="h-4 w-4" />, color: 'text-purple-400', label: 'Staff Created' },
  staff_disabled: { icon: <UserX className="h-4 w-4" />, color: 'text-rose-400', label: 'Staff Disabled' },
  password_reset: { icon: <KeyRound className="h-4 w-4" />, color: 'text-yellow-400', label: 'Password Reset' },
  shift_note_created: { icon: <FileText className="h-4 w-4" />, color: 'text-blue-400', label: 'Shift Note' },
};

export const dynamic = 'force-dynamic';

export default function ActivityPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { logs, isLoading, fetchRecentLogs, subscribeToActivity } = useActivityStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetchRecentLogs(50);
      const unsub = subscribeToActivity();
      return () => unsub();
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gaming-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gaming-900 pb-24">
      <header className="sticky top-0 z-40 border-b border-gaming-500/20 bg-gaming-900/95 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-neon-cyan" />
            <h1 className="text-lg font-bold text-gaming-50">Activity Log</h1>
          </div>
          <p className="mt-0.5 text-xs text-gaming-500">
            Realtime operational activity
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="mb-4 h-12 w-12 text-gaming-500" />
            <h3 className="text-lg font-bold text-gaming-300">No Activity Yet</h3>
            <p className="mt-1 text-sm text-gaming-500">
              Logs will appear here as actions are performed
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => {
              const config = actionConfig[log.action] || {
                icon: <AlertCircle className="h-4 w-4" />,
                color: 'text-gaming-400',
                label: log.action,
              };
              return (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-start gap-3 rounded-xl p-3 transition-all',
                    'glass-card',
                    index < 3 && 'border-l-2 border-l-neon-cyan/30'
                  )}
                >
                  <div className={cn('mt-0.5', config.color)}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gaming-200">
                        {log.actor_name}
                      </span>
                      <span className="text-[10px] text-gaming-600">•</span>
                      <span className={cn('text-[10px] font-medium', config.color)}>
                        {config.label}
                      </span>
                    </div>
                    {log.details && (
                      <p className="mt-0.5 text-xs text-gaming-500">
                        {JSON.stringify(log.details).slice(0, 80)}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-gaming-600">
                      {timeAgo(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}