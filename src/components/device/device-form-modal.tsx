'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Device, DeviceCategory, DeviceStatus } from '@/types';
import { supabase } from '@/lib/supabase';

interface DeviceFormModalProps {
  device?: Device | null;
  onClose: () => void;
  onSaved: () => void;
  actorName?: string;
  actorId?: string;
}

const CATEGORIES: DeviceCategory[] = ['Regular', 'VIP 1', 'VIP 2'];
const STATUSES: DeviceStatus[] = ['Ready', 'In Use', 'Booked', 'Pending', 'Maintenance'];

export function DeviceFormModal({ device, onClose, onSaved, actorName, actorId }: DeviceFormModalProps) {
  const isEdit = !!device;
  const [name, setName] = useState(device?.name || '');
  const [category, setCategory] = useState<DeviceCategory>(device?.category || 'Regular');
  const [status, setStatus] = useState<DeviceStatus>(device?.status || 'Ready');
  const [hourlyPrice, setHourlyPrice] = useState(device?.hourly_price?.toString() || '');
  const [facilitiesStr, setFacilitiesStr] = useState(device?.facilities?.join(', ') || '');
  const [notes, setNotes] = useState(device?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Nama device wajib diisi'); return; }
    if (!hourlyPrice || parseInt(hourlyPrice) <= 0) { setError('Harga harus diisi dengan benar'); return; }

    setIsLoading(true);
    try {
      const facilities = facilitiesStr.split(',').map(f => f.trim()).filter(Boolean);

      if (isEdit && device) {
        await supabase.from('devices').update({
          name: name.trim(),
          category,
          status,
          hourly_price: parseInt(hourlyPrice),
          facilities,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        }).eq('id', device.id);

        await supabase.from('activity_logs').insert({
          action: 'device_edited',
          actor_id: actorId,
          actor_name: actorName || 'Unknown',
          target_type: 'device',
          target_id: device.id,
          details: { device_name: name.trim(), category, hourly_price: parseInt(hourlyPrice) },
        });
      } else {
        const { data: newDevice } = await supabase.from('devices').insert({
          name: name.trim(),
          category,
          status: 'Ready',
          hourly_price: parseInt(hourlyPrice),
          facilities,
          notes: notes || null,
        }).select().single();

        await supabase.from('activity_logs').insert({
          action: 'device_created',
          actor_id: actorId,
          actor_name: actorName || 'Unknown',
          target_type: 'device',
          target_id: newDevice?.id,
          details: { device_name: name.trim(), category, hourly_price: parseInt(hourlyPrice) },
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md">
        <div className="rounded-t-2xl lg:rounded-2xl border border-gaming-700 bg-gaming-950 p-5 lg:p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gaming-100">
              {isEdit ? 'Edit Device' : 'Tambah Device Baru'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gaming-500 hover:text-gaming-300 hover:bg-gaming-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">Nama Device</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="PS4 Regular 1" className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">Kategori</label>
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={cn('flex-1 rounded-lg py-2 text-xs font-medium transition-colors',
                      category === cat ? 'bg-emerald-500 text-white' : 'bg-gaming-800 text-gaming-400 hover:bg-gaming-700'
                    )}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {isEdit && (
              <div>
                <label className="block text-xs font-medium text-gaming-400 mb-1.5">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => setStatus(s)}
                      className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        status === s ? 'bg-emerald-500 text-white' : 'bg-gaming-800 text-gaming-400 hover:bg-gaming-700'
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">Harga per Jam (Rp)</label>
              <input type="number" value={hourlyPrice} onChange={(e) => setHourlyPrice(e.target.value)} placeholder="25000" className="input" min="0" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">
                Fasilitas <span className="text-gaming-600">(pisahkan dengan koma)</span>
              </label>
              <input type="text" value={facilitiesStr} onChange={(e) => setFacilitiesStr(e.target.value)} placeholder="PS4, Monitor 24" className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">Catatan <span className="text-gaming-600">(opsional)</span></label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="..." className="input min-h-[70px] resize-none" rows={2} />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">{error}</div>
            )}

            <button onClick={handleSave} disabled={isLoading}
              className={cn('btn w-full', isLoading ? 'opacity-50 cursor-not-allowed bg-gaming-800 text-gaming-500' : 'btn-primary')}>
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? 'Simpan Perubahan' : 'Tambah Device'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}