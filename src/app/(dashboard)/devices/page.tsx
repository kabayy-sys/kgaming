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
import { Plus, Pencil, Archive, Monitor, Search, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORIES: (DeviceCategory | 'all')[] = ['all', 'Reguler', 'VIP 1.A', 'VIP 1.B', 'VIP 2'];
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
  const [confirmReset, setConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const seedData = [
    { name: 'PS4 Reguler 1', category: 'Reguler' as const, status: 'Ready' as const, hourly_price: 10000, facilities: ['PS4 Console', 'Controller', 'HD TV'] },
    { name: 'PS4 Reguler 2', category: 'Reguler' as const, status: 'In Use' as const, hourly_price: 10000, facilities: ['PS4 Console', 'Controller', 'HD TV'] },
    { name: 'PS4 Reguler 3', category: 'Reguler' as const, status: 'Ready' as const, hourly_price: 10000, facilities: ['PS4 Console', 'Controller', 'HD TV'] },
    { name: 'PS4 Reguler 4', category: 'Reguler' as const, status: 'Booked' as const, hourly_price: 10000, facilities: ['PS4 Console', 'Controller', 'HD TV'] },
    { name: 'PS4 Pro VIP 1.A', category: 'VIP 1.A' as const, status: 'Ready' as const, hourly_price: 30000, facilities: ['PS4 Pro', '4K TV', 'Wireless Controller', 'Headset'] },
    { name: 'Nintendo VIP 1.A', category: 'VIP 1.A' as const, status: 'Ready' as const, hourly_price: 30000, facilities: ['Nintendo Switch', '4K TV', 'Joy-Con'] },
    { name: 'Netflix VIP 1.A', category: 'VIP 1.A' as const, status: 'Ready' as const, hourly_price: 30000, facilities: ['4K TV', 'Streaming Access', 'Mini Fridge'] },
    { name: 'PS4 Pro VIP 1.B', category: 'VIP 1.B' as const, status: 'Ready' as const, hourly_price: 30000, facilities: ['PS4 Pro', '4K TV', 'Wireless Controller', 'Headset'] },
    { name: 'Nintendo VIP 1.B', category: 'VIP 1.B' as const, status: 'In Use' as const, hourly_price: 30000, facilities: ['Nintendo Switch', '4K TV', 'Joy-Con'] },
    { name: 'Netflix VIP 1.B', category: 'VIP 1.B' as const, status: 'Ready' as const, hourly_price: 30000, facilities: ['4K TV', 'Streaming Access', 'Mini Fridge'] },
    { name: 'PS5 VIP 2', category: 'VIP 2' as const, status: 'Ready' as const, hourly_price: 35000, facilities: ['PS5', '4K TV', 'Wireless Controller', 'Headset'] },
    { name: 'Nintendo VIP 2', category: 'VIP 2' as const, status: 'Ready' as const, hourly_price: 35000, facilities: ['Nintendo Switch', '4K TV', 'Joy-Con'] },
    { name: 'Netflix VIP 2', category: 'VIP 2' as const, status: 'In Use' as const, hourly_price: 35000, facilities: ['4K TV', 'Streaming Access', 'Mini Fridge', 'Sofa'] },
  ];

  const handleResetDatabase = async () => {
    if (!user || user.role !== 'owner') return;
    setIsResetting(true);
    try {
      // Hapus data lama
      await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('devices').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert data baru
      const { error } = await supabase.from('devices').insert(seedData);
      if (error) throw error;

      await supabase.from('activity_logs').insert({
        action: 'device_created',
        actor_id: user.id,
        actor_name: user.display_name,
        target_type: 'system',
        target_id: null,
        details: { message: 'Database devices di-reset dengan kategori baru' },
      });

      setConfirmReset(false);
      fetchDevices();
    } catch (err: any) {
      console.error('Reset failed:', err);
      alert('Gagal reset database: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

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
    Reguler: devices.filter(d => d.category === 'Reguler' && !d.is_archived).length,
    'VIP 1.A': devices.filter(d => d.category === 'VIP 1.A' && !d.is_archived).length,
    'VIP 1.B': devices.filter(d => d.category === 'VIP 1.B' && !d.is_archived).length,
    'VIP 2': devices.filter(d => d.category === 'VIP 2' && !d.is_archived).length,
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

          {/* Owner-only: Sync Database */}
          {user?.role === 'owner' && (
            <button onClick={() => setConfirmReset(true)} disabled={isResetting}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors">
              <RefreshCw className={cn('h-3.5 w-3.5', isResetting && 'animate-spin')} />
              {isResetting ? 'Mereset database...' : 'Sync Database — Reset ulang semua device'}
            </button>
          )}
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

      {/* Reset Database Confirm */}
      {confirmReset && user?.role === 'owner' && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => !isResetting && setConfirmReset(false)} />
          <div className="fixed inset-x-4 bottom-20 z-50 animate-slide-up lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-sm">
            <div className="rounded-2xl border border-amber-500/30 bg-gaming-950 p-5 shadow-elevated">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gaming-100">Reset Database Devices?</p>
                  <p className="text-[11px] text-gaming-500">Hanya untuk Owner</p>
                </div>
              </div>
              <p className="text-xs text-gaming-500 mb-1">Tindakan ini akan:</p>
              <ul className="text-xs text-gaming-500 mb-4 ml-4 list-disc space-y-0.5">
                <li>Menghapus SEMUA device lama</li>
                <li>Menghapus SEMUA booking & activity log</li>
                <li>Insert ulang 13 device dengan kategori & harga baru</li>
              </ul>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)} disabled={isResetting} className="btn-secondary btn-sm flex-1">Batal</button>
                <button onClick={handleResetDatabase} disabled={isResetting} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/25 transition-colors disabled:opacity-50">
                  {isResetting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  {isResetting ? 'Mereset...' : 'Reset Database'}
                </button>
              </div>
            </div>
          </div>
        </>
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