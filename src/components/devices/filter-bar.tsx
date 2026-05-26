'use client';

import { cn } from '@/lib/utils';
import { useDeviceStore } from '@/stores/device-store';
import type { DeviceCategory } from '@/types';

const filters: { value: DeviceCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Semua', icon: '📋' },
  { value: 'Reguler', label: 'Reguler', icon: '🖥️' },
  { value: 'VIP 1.A', label: 'VIP 1.A', icon: '⭐' },
  { value: 'VIP 1.B', label: 'VIP 1.B', icon: '⭐' },
  { value: 'VIP 2', label: 'VIP 2', icon: '🎮' },
];

export function FilterBar() {
  const { filter, setFilter } = useDeviceStore();

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {filters.map((item) => (
        <button
          key={item.value}
          onClick={() => setFilter(item.value)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-all flex-shrink-0',
            filter === item.value
              ? 'bg-gaming-700 text-gaming-100 border border-gaming-600'
              : 'text-gaming-500 hover:text-gaming-300 hover:bg-gaming-800/50'
          )}
        >
          <span className="text-sm">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}