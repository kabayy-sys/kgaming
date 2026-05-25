'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useBookingStore } from '@/stores/booking-store';
import { useDeviceStore } from '@/stores/device-store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { cn, bookingStatusColors, formatDateTime, formatDuration } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Monitor,
  AlertCircle,
} from 'lucide-react';

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
      console.error('Failed to approve:', err);
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
      console.error('Failed to reject:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceName = (deviceId: string) => {
    return devices.find((d) => d.id === deviceId)?.name || 'Unknown Device';
  };

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
          <h1 className="text-lg font-bold text-gaming-50">Bookings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Filter Tabs */}
        <div className="mb-4 flex gap-2">
          {(['pending', 'approved', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium transition-all',
                filter === f
                  ? 'bg-neon-cyan text-gaming-900'
                  : 'bg-gaming-700/50 text-gaming-400 hover:text-gaming-200'
              )}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-gaming-500" />
            <h3 className="text-lg font-bold text-gaming-300">No Bookings</h3>
            <p className="mt-1 text-sm text-gaming-500">
              {filter === 'pending' ? 'No pending bookings' : 'No bookings found'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const colors = bookingStatusColors[booking.status];
              return (
                <div
                  key={booking.id}
                  className="glass-card animate-fade-in rounded-2xl p-4"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gaming-400" />
                      <span className="text-sm font-medium text-gaming-50">
                        {getDeviceName(booking.device_id)}
                      </span>
                    </div>
                    <span className={cn('badge', colors.bg, colors.text)}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gaming-300">
                      <User className="h-3.5 w-3.5" />
                      <span>{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gaming-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formatDateTime(booking.start_time)} • {formatDuration(booking.duration_hours)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="btn-success flex-1 text-xs"
                      >
                        {actionLoading === booking.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="btn-danger flex-1 text-xs"
                      >
                        {actionLoading === booking.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Submitted time */}
                  <p className="mt-2 text-[10px] text-gaming-600">
                    Submitted {new Date(booking.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
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