'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useDeviceStore } from '@/stores/device-store';
import { useBookingStore } from '@/stores/booking-store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DeviceCard } from '@/components/devices/device-card';
import { FilterBar } from '@/components/devices/filter-bar';
import { cn, getTodayDate } from '@/lib/utils';
import type { Device, DashboardStats, DeviceStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { Monitor, CalendarCheck, Clock, LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

const quickLinks = [
  { href: '/bookings', label: 'Bookings', desc: 'Kelola pemesanan', icon: CalendarCheck },
  { href: '/activity', label: 'Activity', desc: 'Lihat aktivitas', icon: Clock },
];

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-3.5 lg:p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gaming-500">{label}</span>
        <span className={cn('text-lg font-semibold', color)}>{value}</span>
      </div>
    </div>
  );
}

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

    const newStatus = nextStatus[device.status];
    await updateDeviceStatus(device.id, newStatus);

    await supabase.from('activity_logs').insert({
      action: 'device_status_change',
      actor_id: user?.id,
      actor_name: user?.display_name || 'Unknown',
      target_type: 'device',
      target_id: device.id,
      details: {
        from_status: device.status,
        to_status: newStatus,
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
      <div className="flex min-h-screen items-center justify-center bg-gaming-950">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gaming-950 pb-20 lg:pb-24">
      <header className="page-header">
        <div className="app-container py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base lg:text-lg font-semibold text-gaming-100">Dashboard</h1>
                {user && (
                  <span className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-md border',
                    user.role === 'owner'
                      ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  )}>
                    {user.role === 'owner' ? 'Owner' : user.shift === 'morning' ? 'Pagi' : 'Malam'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gaming-500 mt-0.5">{getTodayDate()}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost btn-sm">
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="app-container pt-4 space-y-5">
        {/* Welcome */}
        {user && (
          <div className="card p-4">
            <p className="text-xs text-gaming-500">Selamat datang,</p>
            <p className="text-base font-semibold text-gaming-100 mt-0.5">{user.display_name}</p>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard label="Ready" value={stats.devices_ready} color="text-emerald-400" />
            <StatCard label="In Use" value={stats.devices_in_use} color="text-amber-400" />
            <StatCard label="Pending" value={stats.pending_bookings} color="text-yellow-400" />
            <StatCard label="Maint." value={stats.devices_maintenance} color="text-red-400" />
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2.5">
          {quickLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className="card card-hover p-3.5 lg:p-4 text-left"
            >
              <link.icon className="h-5 w-5 text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-gaming-200">{link.label}</p>
              <p className="text-xs text-gaming-500 mt-0.5">{link.desc}</p>
            </button>
          ))}
        </div>

        {/* Device Management */}
        <div>
          <h2 className="text-sm font-semibold text-gaming-200 mb-3">Status Device</h2>
          <FilterBar />
          <div className="mt-3 space-y-2.5">
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