'use client';

import { useEffect, useState } from 'react';
import { DeviceCard } from '@/components/devices/device-card';
import { FilterBar } from '@/components/devices/filter-bar';
import { BookingForm } from '@/components/booking/booking-form';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useDeviceStore } from '@/stores/device-store';
import { getTodayDate } from '@/lib/utils';
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
    <main className="min-h-screen bg-gaming-950 pb-20 lg:pb-24">
      {/* Header */}
      <header className="page-header">
        <div className="app-container py-3 lg:py-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg lg:text-xl font-bold text-gaming-100 tracking-tight">
              K Gaming <span className="text-emerald-400">XCafe</span>
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">Live</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gaming-500">{getTodayDate()}</span>
            <span className="text-xs text-gaming-400">
              <span className="text-emerald-400 font-semibold">{availableCount}</span> tersedia
            </span>
          </div>

          <div className="mt-3">
            <FilterBar />
          </div>
        </div>
      </header>

      {/* Device List */}
      <div className="app-container pt-4 pb-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl skeleton" />
            ))}
          </div>
        ) : visibleDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 pb-32 text-center">
            <span className="text-3xl mb-3">🎮</span>
            <p className="text-sm text-gaming-500">Tidak ada device tersedia</p>
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

      {bookingDevice && (
        <BookingForm
          device={bookingDevice}
          onClose={() => setBookingDevice(null)}
        />
      )}

      <BottomNav />
    </main>
  );
}