'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useDeviceStore } from '@/stores/device-store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DeviceFormModal } from '@/components/device/device-form-modal';
import { cn } from '@/lib/utils';
import type { Device, DeviceCategory, DeviceStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Archive, Monitor, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORIES: (DeviceCategory | 'all')[] = ['all', 'PS5', 'VIP', 'Regular', 'PC'];
const STATUS_COLORS: Record<DeviceStatus, string> = {
  Ready: 'text-emerald-400',
  'In Use': 'text-amber-400',
  Booked: 'text-violet-400',
  Pending: 'text-yellow-400',
  Maintenance: 'text-red-400',
};

export default function DevicesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { devices, fetchDevices } = useDeviceStore();
  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [filterCat, setFilterCat] = useState<DeviceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) fetchDevices();
  }, [isAuthenticated, authLoading]);

  const filteredDevices = devices.filter((d) => {
    if (d.is_archived) return false;
    if (filterCat !== 'all' && d.category !== filterCat) return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleArchive = async (deviceId: string) => {
    await supabase.from('devices').update({ is_archived: true, updated_at: new Date().toISOString() }).eq('id', deviceId);
    await supabase.from('activity_logs').insert({
      action: 'device_archived',
      actor_id: user?.id,
      actor_name: user?.display_name || 'Unknown',
      target_type: 'device',
      target_id: deviceId,
      details: { device_id: deviceId },
    });
    setConfirmArchive(null);
    fetchDevices();
  };

  const categoryCounts = {
    all: devices.filter(d => !d.is_archived).length,
    PS5: devices.filter(d => d.category === 'PS5' && !d.is_archived).length,
    VIP: devices.filter(d => d.category === 'VIP' && !d.is_archived).length,
    Regular: devices.filter(d => d.category === 'Regular' && !d.is_archived).length,
    PC: devices.filter(d => d.category === 'PC' && !d.is_archived).length,
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
            <h1 className="text-base lg:text-lg font-semibold text-gaming-100">Manage Devices</h1>
            <button onClick={() => { setEditDevice(null); setShowForm(true); }} className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gaming-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari device..." className="input pl-10" />
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap',
                  filterCat === cat ? 'bg-gaming-700 text-gaming-100 border border-gaming-600' : 'text-gaming-500 hover:text-gaming-300'
                )}>
                {cat === 'all' ? 'Semua' : cat}
                <span className="text-[10px] text-gaming-600">({categoryCounts[cat]})</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="app-container pt-4 space-y-2">
        {filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <Monitor className="h-10 w-10 text-gaming-600 mb-3" />
            <p className="text-sm text-gaming-500">Belum ada device</p>
            <button onClick={() => { setEditDevice(null); setShowForm(true); }} className="btn-secondary btn-sm mt-3">
              <Plus className="h-3.5 w-3.5" /> Tambah Device
            </button>
          </div>
        ) : (
          filteredDevices.map((device) => (
            <div key={device.id} className="card p-4 lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gaming-100 truncate">{device.name}</h3>
                    <span className={cn('text-[10px] font-medium', STATUS_COLORS[device.status])}>{device.status}</span>
                  </div>
                  <p className="text-xs text-gaming-500 mt-0.5">
                    {device.category} • Rp{device.hourly_price.toLocaleString('id-ID')}/jam
                  </p>
                  {device.facilities.length > 0 && (
                    <p className="text-[11px] text-gaming-600 mt-1 truncate">{device.facilities.join(', ')}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditDevice(device); setShowForm(true); }}
                    className="p-2 rounded-lg text-gaming-500 hover:text-gaming-300 hover:bg-gaming-800 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConfirmArchive(device.id)}
                    className="p-2 rounded-lg text-gaming-500 hover:text-red-400 hover:bg-gaming-800 transition-colors">
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <DeviceFormModal
          device={editDevice}
          onClose={() => { setShowForm(false); setEditDevice(null); }}
          onSaved={() => fetchDevices()}
          actorName={user?.display_name}
          actorId={user?.id}
        />
      )}

      {/* Archive Confirm */}
      {confirmArchive && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setConfirmArchive(null)} />
          <div className="fixed inset-x-4 bottom-20 z-50 animate-slide-up lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-sm">
            <div className="rounded-2xl border border-gaming-700 bg-gaming-950 p-5 shadow-elevated">
              <p className="text-sm text-gaming-200 mb-4">Arsipkan device ini?</p>
              <p className="text-xs text-gaming-500 mb-4">Device akan disembunyikan dari tampilan utama. Masih bisa dipulihkan.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmArchive(null)} className="btn-secondary btn-sm flex-1">Batal</button>
                <button onClick={() => handleArchive(confirmArchive)} className="btn-danger btn-sm flex-1">Arsipkan</button>
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}