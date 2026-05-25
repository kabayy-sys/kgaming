'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useDeviceStore } from '@/stores/device-store';
import { useBookingStore } from '@/stores/booking-store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DeviceCard } from '@/components/devices/device-card';
import { FilterBar } from '@/components/devices/filter-bar';
import { cn, statusColors, getTodayDate } from '@/lib/utils';
import type { Device, DashboardStats, DeviceStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  Monitor,
  Users,
  CalendarCheck,
  Clock,
  LogOut,
  ChevronRight,
  Activity,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const { devices, filteredDevices, fetchDevices, subscribeToDevices, updateDeviceStatus } = useDeviceStore();
  const { fetchBookings, subscribeToBookings, pendingCount } = useBookingStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetchDevices();
      fetchBookings();
      const unsubDevices = subscribeToDevices();
      const unsubBookings = subscribeToBookings();
      return () => {
        unsubDevices();
        unsubBookings();
      };
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (devices.length > 0) {
      setStats({
        total_devices: devices.filter((d) => !d.is_archived).length,
        devices_in_use: devices.filter((d) => d.status === 'In Use').length,
        devices_ready: devices.filter((d) => d.status === 'Ready').length,
        devices_maintenance: devices.filter((d) => d.status === 'Maintenance').length,
        pending_bookings: pendingCount,
        active_bookings: devices.filter((d) => d.status === 'Booked' || d.status === 'Pending').length,
        total_staff: 0,
      });
    }
  }, [devices, pendingCount]);

  const handleStatusChange = async (device: Device) => {
    const nextStatus: Record<DeviceStatus, DeviceStatus> = {
      Ready: 'In Use',
      'In Use': 'Ready',
      Booked: 'In Use',
      Pending: 'Ready',
      Maintenance: 'Ready',
    };
    await updateDeviceStatus(device.id, nextStatus[device.status]);
    await supabase.from('activity_logs').insert({
      action: 'device_status_change',
      actor_id: user?.id,
      actor_name: user?.display_name || 'Unknown',
      target_type: 'device',
      target_id: device.id,
      details: {
        from_status: device.status,
        to_status: nextStatus[device.status],
        device_name: device.name,
      },
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gaming-500/20 bg-gaming-900/95 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gaming-50">Dashboard</h1>
                {user && (
                  <span className={cn(
                    'badge text-[10px]',
                    user.role === 'owner' ? 'bg-neon-purple/20 text-neon-purple' : 'bg-neon-cyan/20 text-neon-cyan'
                  )}>
                    {user.role === 'owner' ? 'Owner' : user.shift === 'morning' ? 'Pagi' : 'Malam'}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gaming-500">{getTodayDate()}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost px-3 py-2 text-xs">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-4">
        {/* Welcome */}
        {user && (
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm text-gaming-400">Welcome back,</p>
            <p className="text-lg font-bold text-gaming-50">{user.display_name}</p>
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Monitor className="h-5 w-5" />}
              label="In Use"
              value={stats.devices_in_use}
              color="text-orange-400"
              bg="bg-orange-500/10"
            />
            <StatCard
              icon={<Monitor className="h-5 w-5" />}
              label="Ready"
              value={stats.devices_ready}
              color="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <StatCard
              icon={<CalendarCheck className="h-5 w-5" />}
              label="Pending"
              value={stats.pending_bookings}
              color="text-yellow-400"
              bg="bg-yellow-500/10"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Active Bookings"
              value={stats.active_bookings}
              color="text-purple-400"
              bg="bg-purple-500/10"
            />
          </div>
        )}

        {/* Device Management Section */}
        <div>
          <h2 className="section-header">Device Status</h2>
          <FilterBar />
          <div className="mt-3 space-y-3">
            {filteredDevices().map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onStatusChange={(d) => handleStatusChange(d)}
                compact
              />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

// Stat Card Sub-component
function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn('glass-card rounded-2xl p-4', bg)}>
      <div className="mb-2 flex items-center justify-between">
        <span className={color}>{icon}</span>
        <span className="text-2xl font-bold text-gaming-50">{value}</span>
      </div>
      <p className="text-xs text-gaming-400">{label}</p>
    </div>
  );
}