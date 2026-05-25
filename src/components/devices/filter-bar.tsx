'use client';

import { cn } from '@/lib/utils';
import { useDeviceStore } from '@/stores/device-store';
import type { DeviceCategory } from '@/types';

const filters: { value: DeviceCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'PS5', label: 'PS5', icon: '🎮' },
  { value: 'VIP', label: 'VIP', icon: '⭐' },
  { value: 'Regular', label: 'Regular', icon: '🖥️' },
  { value: 'PC', label: 'PC', icon: '💻' },
];

export function FilterBar() {
  const { filter, setFilter } = useDeviceStore();

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-2">
      {filters.map((item) => (
        <button
          key={item.value}
          onClick={() => setFilter(item.value)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
            filter === item.value
              ? 'bg-neon-cyan text-gaming-900 shadow-[0_0_20px_rgba(0,245,212,0.3)]'
              : 'bg-gaming-700/50 text-gaming-300 hover:bg-gaming-600/50 hover:text-gaming-100'
          )}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}