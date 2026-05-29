'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useDeviceStore } from '@/stores/device-store';
import { useBookingStore } from '@/stores/booking-store';
import { DeviceScheduleView } from '@/components/dashboard/device-schedule-view';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DeviceCard } from '@/components/devices/device-card';
import { FilterBar } from '@/components/devices/filter-bar';
import { cn, getTodayDate } from '@/lib/utils';
import type { Device, DeviceStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  LogOut,
  CalendarCheck,
  Clock,
  Monitor,
  Calendar,
  Activity,
  Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ---- Navigation tiles for quick access ----
const quickLinks = [
  { href: '/bookings', label: 'Bookings', desc: 'Kelola pemesanan', icon: CalendarCheck },
  { href: '/activity', label: 'Activity', desc: 'Lihat aktivitas', icon: Activity },
  { href: '/devices', label: 'Devices', desc: 'Atur device', icon: Monitor },
];

// ---- StatCard component ----
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card p-3.5 lg:p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className="text-gaming-500">{icon}</div>}
        <div>
          <span className="text-xs text-gaming-500">{label}</span>
          <span className={cn('text-lg font-semibold block', color)}>{value}</span>
        </div>
      </div>
    </div>
  );
}

// ---- Welcome Card ----
function WelcomeCard({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']> }) {
  const hours = new Date().getHours();
  const greeting =
    hours < 12 ? 'Selamat Pagi' : hours < 18 ? 'Selamat Sore' : 'Selamat Malam';

  return (
    <div className="card p-4 bg-gradient-to-r from-gaming-900 via-gaming-800/80 to-gaming-900 border-gaming-700/30">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm">
          {user.display_name?.charAt(0)?.toUpperCase() || 'S'}
        </div>
        <div className="flex-1">
          <p className="text-xs text-gaming-400">{greeting},</p>
          <p className="text-sm font-semibold text-gaming-100">{user.display_name || user.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-md border',
              user.role === 'owner'
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            )}>
              {user.role === 'owner' ? 'Owner' : 'Staff'}
            </span>
            {user.shift && (
              <span className="text-[10px] text-gaming-500">
                Shift {user.shift === 'morning' ? 'Pagi' : 'Malam'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gaming-500">{getTodayDate()}</p>
        </div>
      </div>
    </div>
  );
}

// ---- Status quick action buttons ----
function StatusQuickActions({
  stats,
  onStatusFilter,
}: {
  stats: { label: string; value: number; status: DeviceStatus | 'all'; color: string }[];
  onStatusFilter?: (status: DeviceStatus | 'all') => void;
}) {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
      {stats.map((s) => (
        <button
          key={s.status}
          onClick={() => onStatusFilter?.(s.status)}
          className="card p-2.5 text-center hover:bg-gaming-800/80 transition-colors"
        >
          <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
          <div className="text-[10px] text-gaming-500 mt-0.5 truncate">{s.label}</div>
        </button>
      ))}
    </div>
  );
}

// ---- Main Dashboard ----
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const { devices, filteredDevices, fetchDevices, subscribeToDevices, updateDeviceStatus } = useDeviceStore();
  const { fetchBookings, subscribeToBookings, pendingCount } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'devices'>('overview');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');

  const [stats, setStats] = useState({
    total_devices: 0,
    devices_in_use: 0,
    devices_ready: 0,
    devices_pending: 0,
    devices_booked: 0,
    devices_maintenance: 0,
  });

  // ---- Auth + Data Fetching ----
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
        devices_pending: devices.filter((d) => d.status === 'Pending').length,
        devices_booked: devices.filter((d) => d.status === 'Booked').length,
        devices_maintenance: devices.filter((d) => d.status === 'Maintenance').length,
      });
    }
  }, [devices]);

  const handleStatusChange = async (device: Device, newStatus: DeviceStatus) => {
    if (!user) return;

    const oldStatus = device.status;
    await updateDeviceStatus(device.id, newStatus);

    await supabase.from('activity_logs').insert({
      action: 'device_status_change',
      actor_id: user.id,
      actor_name: user.display_name || 'Unknown',
      target_type: 'device',
      target_id: device.id,
      details: {
        from_status: oldStatus,
        to_status: newStatus,
        device_name: device.name,
      },
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // ---- Filter devices by selected status ----
  const getFilteredDevices = () => {
    if (statusFilter === 'all') return filteredDevices();
    return filteredDevices().filter((d) => d.status === statusFilter);
  };

  // ---- Auth loading state ----
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gaming-950">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  // ---- Not authenticated ----
  if (!isAuthenticated || !user) {
    return null;
  }

  const statItems = [
    { label: 'Ready', value: stats.devices_ready, status: 'Ready' as DeviceStatus, color: 'text-emerald-400' },
    { label: 'In Use', value: stats.devices_in_use, status: 'In Use' as DeviceStatus, color: 'text-amber-400' },
    { label: 'Booked', value: stats.devices_booked, status: 'Booked' as DeviceStatus, color: 'text-purple-400' },
    { label: 'Pending', value: stats.devices_pending, status: 'Pending' as DeviceStatus, color: 'text-yellow-400' },
    { label: 'Maint.', value: stats.devices_maintenance, status: 'Maintenance' as DeviceStatus, color: 'text-rose-400' },
    { label: 'Semua', value: stats.total_devices, status: 'all' as const, color: 'text-gaming-200' },
  ];

  return (
    <main className="min-h-screen bg-gaming-950 pb-20 lg:pb-24">
      {/* ============ HEADER ============ */}
      <header className="page-header">
        <div className="app-container py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-base lg:text-lg font-semibold text-gaming-100">Dashboard</h1>
            <button onClick={handleLogout} className="btn-ghost btn-sm">
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="app-container pt-4 space-y-5">
        {/* ============ WELCOME ============ */}
        <WelcomeCard user={user} />

        {/* ============ TAB NAVIGATION ============ */}
        <div className="flex gap-1 p-1 rounded-xl bg-gaming-900/80 border border-gaming-800/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              activeTab === 'overview'
                ? 'bg-gaming-800 text-gaming-100 shadow-sm'
                : 'text-gaming-500 hover:text-gaming-300'
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              activeTab === 'schedule'
                ? 'bg-gaming-800 text-gaming-100 shadow-sm'
                : 'text-gaming-500 hover:text-gaming-300'
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              activeTab === 'devices'
                ? 'bg-gaming-800 text-gaming-100 shadow-sm'
                : 'text-gaming-500 hover:text-gaming-300'
            )}
          >
            <Monitor className="h-3.5 w-3.5" />
            Devices
          </button>
        </div>

        {/* ============ SCHEDULE TAB ============ */}
        {activeTab === 'schedule' && (
          <DeviceScheduleView />
        )}

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Quick Actions */}
            <StatusQuickActions
              stats={statItems}
              onStatusFilter={(s) => {
                setStatusFilter(s);
                setActiveTab('devices');
              }}
            />

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-2.5">
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

            {/* Pending Bookings Alert */}
            {pendingCount > 0 && (
              <div
                className="card p-3 border-yellow-500/20 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10 transition-colors"
                onClick={() => router.push('/bookings')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <CalendarCheck className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      {pendingCount} Booking{pendingCount > 1 ? 's' : ''} Pending
                    </p>
                    <p className="text-[10px] text-gaming-500 mt-0.5">
                      Tap untuk review pemesanan
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Live Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <StatCard
                label="Ready"
                value={stats.devices_ready}
                color="text-emerald-400"
                icon={<Monitor className="h-4 w-4" />}
              />
              <StatCard
                label="In Use"
                value={stats.devices_in_use}
                color="text-amber-400"
                icon={<Users className="h-4 w-4" />}
              />
              <StatCard
                label="Booked"
                value={stats.devices_booked}
                color="text-purple-400"
                icon={<CalendarCheck className="h-4 w-4" />}
              />
              <StatCard
                label="Maintenance"
                value={stats.devices_maintenance}
                color="text-rose-400"
                icon={<Clock className="h-4 w-4" />}
              />
            </div>
          </>
        )}

        {/* ============ DEVICES TAB ============ */}
        {activeTab === 'devices' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gaming-200">
                Status Device
                {statusFilter !== 'all' && (
                  <span className="text-xs font-normal text-gaming-500 ml-2">
                    Filter: {statusFilter}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setStatusFilter('all')}
                className="text-[10px] text-gaming-500 hover:text-gaming-300"
              >
                Reset
              </button>
            </div>

            <FilterBar />
            <div className="mt-3 space-y-2.5">
              {getFilteredDevices().length === 0 && (
                <div className="flex flex-col items-center justify-center pt-8 text-center">
                  <p className="text-sm text-gaming-500">Tidak ada device</p>
                </div>
              )}
              {getFilteredDevices().map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onStatusChange={handleStatusChange}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}