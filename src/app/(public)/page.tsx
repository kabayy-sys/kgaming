'use client';

import { useEffect, useState } from 'react';
import { DeviceCard } from '@/components/devices/device-card';
import { FilterBar } from '@/components/devices/filter-bar';
import { BookingForm } from '@/components/booking/booking-form';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useDeviceStore } from '@/stores/device-store';
import { cn, getTodayDate } from '@/lib/utils';
import type { Device } from '@/types';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { devices, isLoading, filteredDevices, fetchDevices, subscribeToDevices } = useDeviceStore();
  const [bookingDevice, setBookingDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchDevices();
    const unsubscribe = subscribeToDevices();
    return () => unsubscribe();
  }, []);

  const availableCount = devices.filter((d) => d.status === 'Ready' && !d.is_archived).length;
  const visibleDevices = filteredDevices();

  return (
    <main className="min-h-screen bg-gaming-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gaming-500/20 bg-gaming-900/95 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-wider text-gaming-50" style={{ fontFamily: 'var(--font-display)' }}>
                K Gaming <span className="text-neon-cyan">XCafe</span>
              </h1>
              <p className="mt-0.5 text-xs text-gaming-500">Realtime Device Monitor</p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5">
              <span className="status-dot bg-emerald-400 animate-status-pulse" />
              <span className="text-[10px] font-medium text-emerald-400">Live</span>
            </div>
          </div>

          {/* Date + Availability */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gaming-400">{getTodayDate()}</span>
            <span className="text-xs text-gaming-300">
              <span className="font-bold text-neon-cyan">{availableCount}</span> devices ready
            </span>
          </div>

          {/* Filter */}
          <FilterBar />
        </div>
      </header>

      {/* Device Grid */}
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : visibleDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-4xl">🎮</div>
            <h3 className="text-lg font-bold text-gaming-300">No Devices Found</h3>
            <p className="mt-1 text-sm text-gaming-500">
              No devices available in this category
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onBook={(d) => setBookingDevice(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {bookingDevice && (
        <BookingForm
          device={bookingDevice}
          onClose={() => setBookingDevice(null)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </main>
  );
}