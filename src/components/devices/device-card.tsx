'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Device, DeviceStatus } from '@/types';
import { Clock, DollarSign } from 'lucide-react';

interface DeviceCardProps {
  device: Device;
  onBook?: (device: Device) => void;
  onStatusChange?: (device: Device, newStatus: DeviceStatus) => void;
  compact?: boolean;
  isPublic?: boolean;
}

const STATUS_OPTIONS: DeviceStatus[] = ['Ready', 'In Use', 'Booked', 'Pending', 'Maintenance'];

const statusConfig: Record<DeviceStatus, { dot: string; bg: string; border: string; text: string; label: string }> = {
  Ready: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Ready' },
  'In Use': { dot: 'bg-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/20', text: 'text-amber-400', label: 'In Use' },
  Booked: { dot: 'bg-violet-400', bg: 'bg-violet-500/8', border: 'border-violet-500/20', text: 'text-violet-400', label: 'Booked' },
  Pending: { dot: 'bg-yellow-400', bg: 'bg-yellow-500/8', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
  Maintenance: { dot: 'bg-red-400', bg: 'bg-red-500/8', border: 'border-red-500/20', text: 'text-red-400', label: 'Maint.' },
};

const categoryIcons: Record<string, string> = {
  Reguler: '🖥️',
  'VIP 1': '⭐',
  'VIP 2': '🎮',
};

export function DeviceCard({ device, onBook, onStatusChange, compact, isPublic }: DeviceCardProps) {
  const s = statusConfig[device.status];
  const icon = categoryIcons[device.category] || '🖥️';
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const isReady = device.status === 'Ready';

  const handleClick = () => {
    if (isPublic) {
      // Public: only Ready devices can book
      if (isReady && onBook) {
        onBook(device);
      }
    } else {
      // Staff/Owner: show status picker
      setShowStatusPicker(true);
    }
  };

  const handleStatusSelect = (newStatus: DeviceStatus) => {
    if (onStatusChange) {
      onStatusChange(device, newStatus);
    }
    setShowStatusPicker(false);
  };

  return (
    <>
      <div className="card card-hover overflow-hidden" onClick={isPublic && isReady ? handleClick : undefined}>
        <div className="p-4 lg:p-5">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex-shrink-0 text-xl lg:text-2xl">{icon}</span>
              <div className="min-w-0">
                <h3 className="text-sm lg:text-base font-semibold text-gaming-100 truncate">
                  {device.name}
                </h3>
                <p className="text-xs text-gaming-500 mt-0.5">{device.category}</p>
              </div>
            </div>
            <div className={cn('badge flex-shrink-0 border', s.border, s.bg, s.text)}>
              <span className={cn('badge-dot', s.dot)} />
              <span>{s.label}</span>
            </div>
          </div>

          {/* Info Row */}
          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-gaming-400">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Rp{device.hourly_price.toLocaleString('id-ID')}/jam
              </span>
              {device.facilities.length > 0 && (
                <span className="text-xs text-gaming-500">
                  {device.facilities.slice(0, 3).join(' · ')}
                  {device.facilities.length > 3 && (
                    <span className="text-gaming-600 ml-1">+{device.facilities.length - 3}</span>
                  )}
                </span>
              )}
            </div>
          )}

          {/* Estimated Available */}
          {device.estimated_available_at && device.status !== 'Ready' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gaming-500">
              <Clock className="h-3.5 w-3.5" />
              Est. ready {new Date(device.estimated_available_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {/* Action Button */}
          {isPublic ? (
            /* PUBLIC: Book Now only for Ready devices */
            <button
              onClick={() => isReady && onBook?.(device)}
              disabled={!isReady}
              className={cn(
                'btn mt-3 w-full text-sm transition-all',
                isReady
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-gaming-800 text-gaming-600 cursor-not-allowed opacity-60'
              )}
            >
              {isReady ? 'Book Now' : device.status === 'In Use' ? 'Sedang Dipakai' : `Status: ${s.label}`}
            </button>
          ) : (
            /* STAFF/OWNER: tap to change status */
            <button
              onClick={handleClick}
              className="btn mt-3 w-full text-sm border border-gaming-600 text-gaming-300 hover:bg-gaming-800 transition-colors"
            >
              Tap to Change Status
            </button>
          )}
        </div>
      </div>

      {/* Status Picker Modal (Staff/Owner only) */}
      {showStatusPicker && !isPublic && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowStatusPicker(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-sm">
            <div className="rounded-t-2xl lg:rounded-2xl border border-gaming-700 bg-gaming-950 p-5 shadow-elevated">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gaming-100">Ubah Status</h3>
                  <p className="text-xs text-gaming-500 mt-0.5">{device.name}</p>
                </div>
                <button onClick={() => setShowStatusPicker(false)} className="p-1.5 rounded-lg text-gaming-500 hover:text-gaming-300 hover:bg-gaming-800 transition-colors text-xs">
                  Tutup
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((st) => {
                  const cfg = statusConfig[st];
                  const isActive = device.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusSelect(st)}
                      disabled={isActive}
                      className={cn(
                        'rounded-xl p-3 text-left border-2 transition-all flex flex-col gap-1',
                        isActive
                          ? 'border-emerald-500 bg-emerald-500/10 cursor-default'
                          : 'border-gaming-700 bg-gaming-800/50 hover:border-gaming-600 cursor-pointer'
                      )}
                    >
                      <span className={cn('badge border self-start', cfg.border, cfg.bg, cfg.text)}>
                        <span className={cn('badge-dot', cfg.dot)} />
                        <span>{cfg.label}</span>
                      </span>
                      <span className="text-xs text-gaming-500 mt-1">
                        {isActive ? 'Saat ini' : 'Tap untuk ubah'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}