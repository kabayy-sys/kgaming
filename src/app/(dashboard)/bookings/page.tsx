'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useBookingStore } from '@/stores/booking-store';
import { useDeviceStore } from '@/stores/device-store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { cn, formatDateTime, formatDuration } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Clock, User, Monitor, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { bookings, isLoading, fetchBookings, subscribeToBookings, approveBooking, rejectBooking } = useBookingStore();
  const { devices, fetchDevices } = useDeviceStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetchBookings();
      fetchDevices();
      const unsub = subscribeToBookings();
      return () => unsub();
    }
  }, [isAuthenticated, authLoading]);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const handleApprove = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await approveBooking(bookingId, user?.id || '');
      await supabase.from('activity_logs').insert({
        action: 'booking_approved',
        actor_id: user?.id,
        actor_name: user?.display_name || 'Unknown',
        target_type: 'booking',
        target_id: bookingId,
        details: { booking_id: bookingId },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await rejectBooking(bookingId, user?.id || '');
      await supabase.from('activity_logs').insert({
        action: 'booking_rejected',
        actor_id: user?.id,
        actor_name: user?.display_name || 'Unknown',
        target_type: 'booking',
        target_id: bookingId,
        details: { booking_id: bookingId },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceName = (deviceId: string) => {
    return devices.find((d) => d.id === deviceId)?.name || 'Unknown Device';
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gaming-950">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gaming-950 pb-20 lg:pb-24">
      <header className="page-header">
        <div className="app-container py-3 lg:py-4">
          <h1 className="text-base lg:text-lg font-semibold text-gaming-100">Bookings</h1>
        </div>
      </header>

      <div className="app-container pt-4">
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(['pending', 'approved', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-gaming-700 text-gaming-100 border border-gaming-600'
                  : 'text-gaming-500 hover:text-gaming-300'
              )}
            >
              {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl skeleton" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <AlertCircle className="h-10 w-10 text-gaming-600 mb-3" />
            <p className="text-sm text-gaming-500">
              {filter === 'pending' ? 'Tidak ada booking pending' : 'Tidak ada booking'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredBookings.map((booking) => {
              const statusStyle = {
                pending: 'status-pending',
                approved: 'status-ready',
                rejected: 'status-maintenance',
                expired: 'bg-gaming-800/50 text-gaming-500 border-gaming-700/50',
                completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              }[booking.status];

              return (
                <div key={booking.id} className="card p-4 lg:p-5 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Monitor className="h-4 w-4 text-gaming-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gaming-200 truncate">
                        {getDeviceName(booking.device_id)}
                      </span>
                    </div>
                    <span className={cn('badge border', statusStyle)}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gaming-400">
                      <User className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gaming-500">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatDateTime(booking.start_time)} • {formatDuration(booking.duration_hours)}</span>
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="btn-success btn-sm flex-1"
                      >
                        {actionLoading === booking.id ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Setujui
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="btn-danger btn-sm flex-1"
                      >
                        {actionLoading === booking.id ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Tolak
                      </button>
                    </div>
                  )}

                  <p className="mt-2 text-[10px] text-gaming-600">
                    {new Date(booking.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
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