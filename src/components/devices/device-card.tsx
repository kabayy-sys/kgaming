'use client';

import { cn, statusColors, categoryConfig, formatTime, formatDuration } from '@/lib/utils';
import type { Device } from '@/types';
import { Clock, DollarSign, BookOpen, Wrench } from 'lucide-react';
import { useState } from 'react';

interface DeviceCardProps {
  device: Device;
  onBook?: (device: Device) => void;
  onStatusChange?: (device: Device) => void;
  compact?: boolean;
}

export function DeviceCard({ device, onBook, onStatusChange, compact }: DeviceCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const colors = statusColors[device.status];
  const category = categoryConfig[device.category];

  const statusActionLabel = {
    Ready: 'Book Now',
    'In Use': 'Set Ready',
    Booked: 'Complete',
    Pending: 'Approve',
    Maintenance: 'Set Ready',
  }[device.status];

  const handleAction = () => {
    if (device.status === 'Ready' && onBook) {
      onBook(device);
    } else if (onStatusChange) {
      onStatusChange(device);
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all duration-200',
        'interactive-card',
        isPressed && 'scale-[0.98]',
        colors.bg.replace('bg-', 'border-').replace('/20', '/30'),
        'border-gaming-500/20'
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* Status Bar - top color strip */}
      <div className={cn('h-1.5 w-full', colors.dot.replace('bg-', 'bg-'))} />

      <div className={cn('p-4', compact ? 'space-y-2' : 'space-y-3')}>
        {/* Header: Category Icon + Name */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h3 className={cn('font-bold text-gaming-50', compact ? 'text-sm' : 'text-base')}>
                {device.name}
              </h3>
              <span className="text-xs text-gaming-400">{category.label}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn('badge', colors.bg, colors.text)}>
            <span className={cn('status-dot', colors.dot)} />
            <span>{device.status}</span>
          </div>
        </div>

        {/* Info Row: Price & Facilities */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gaming-300">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-neon-cyan" />
              Rp {device.hourly_price.toLocaleString('id-ID')}/jam
            </span>
            {device.facilities.length > 0 && (
              <span className="flex items-center gap-1">
                <span>•</span>
                {device.facilities.slice(0, 3).join(', ')}
                {device.facilities.length > 3 && ` +${device.facilities.length - 3}`}
              </span>
            )}
          </div>
        )}

        {/* Estimated Available Time */}
        {device.estimated_available_at && device.status !== 'Ready' && (
          <div className="flex items-center gap-1.5 text-xs text-gaming-400">
            <Clock className="h-3.5 w-3.5" />
            Est. ready at {formatTime(device.estimated_available_at)}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAction}
          className={cn(
            'w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95',
            device.status === 'Ready'
              ? 'bg-neon-cyan text-gaming-900 hover:bg-neon-cyan/90'
              : 'border border-gaming-500/30 text-gaming-200 hover:bg-gaming-700/50'
          )}
        >
          {device.status === 'Ready' && <BookOpen className="h-4 w-4" />}
          {device.status === 'Maintenance' && <Wrench className="h-4 w-4" />}
          {statusActionLabel}
        </button>
      </div>
    </div>
  );
}