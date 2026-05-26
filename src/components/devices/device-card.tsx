'use client';

import { cn } from '@/lib/utils';
import type { Device } from '@/types';
import { Clock, DollarSign } from 'lucide-react';

interface DeviceCardProps {
  device: Device;
  onBook?: (device: Device) => void;
  onStatusChange?: (device: Device) => void;
  compact?: boolean;
}

const statusConfig = {
  Ready: {
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    label: 'Ready',
    action: 'Book Now',
    actionBtn: 'bg-emerald-500 text-white hover:bg-emerald-600',
  },
  'In Use': {
    dot: 'bg-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    label: 'In Use',
    action: 'Mark Available',
    actionBtn: 'border border-gaming-600 text-gaming-300 hover:bg-gaming-800',
  },
  Booked: {
    dot: 'bg-violet-400',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    label: 'Booked',
    action: 'Complete',
    actionBtn: 'border border-gaming-600 text-gaming-300 hover:bg-gaming-800',
  },
  Pending: {
    dot: 'bg-yellow-400',
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    label: 'Pending',
    action: 'Approve',
    actionBtn: 'border border-gaming-600 text-gaming-300 hover:bg-gaming-800',
  },
  Maintenance: {
    dot: 'bg-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/20',
    text: 'text-red-400',
    label: 'Maint.',
    action: 'Set Ready',
    actionBtn: 'border border-gaming-600 text-gaming-300 hover:bg-gaming-800',
  },
};

const categoryIcons: Record<string, string> = {
  Reguler: '🖥️',
  'VIP 1.A': '⭐',
  'VIP 1.B': '⭐',
  'VIP 2': '🎮',
};

const categoryLabels: Record<string, string> = {
  Reguler: 'Reguler',
  'VIP 1.A': 'VIP 1.A',
  'VIP 1.B': 'VIP 1.B',
  'VIP 2': 'VIP 2',
};

export function DeviceCard({ device, onBook, onStatusChange, compact }: DeviceCardProps) {
  const status = statusConfig[device.status];
  const icon = categoryIcons[device.category] || '🖥️';
  const categoryLabel = categoryLabels[device.category] || device.category;

  const handleAction = () => {
    if (device.status === 'Ready' && onBook) {
      onBook(device);
    } else if (onStatusChange) {
      onStatusChange(device);
    }
  };

  return (
    <div className="card card-hover overflow-hidden">
      <div className="p-4 lg:p-5">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 text-xl lg:text-2xl">{icon}</span>
            <div className="min-w-0">
              <h3 className="text-sm lg:text-base font-semibold text-gaming-100 truncate">
                {device.name}
              </h3>
              <p className="text-xs text-gaming-500 mt-0.5">{categoryLabel}</p>
            </div>
          </div>
          <div className={cn('badge flex-shrink-0 border', status.border, status.bg, status.text)}>
            <span className={cn('badge-dot', status.dot)} />
            <span>{status.label}</span>
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

        {/* Action */}
        <button
          onClick={handleAction}
          className={cn('btn mt-3 w-full text-sm', status.actionBtn)}
        >
          {status.action}
        </button>
      </div>
    </div>
  );
}