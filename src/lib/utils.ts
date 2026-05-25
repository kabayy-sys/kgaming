import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DeviceStatus, BookingStatus, DeviceCategory } from '@/types';

// ---- Tailwind Class Merge ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Status Color Map ----
export const statusColors: Record<DeviceStatus, { bg: string; text: string; dot: string }> = {
  Ready: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'In Use': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  Booked: { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  Pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  Maintenance: { bg: 'bg-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-400' },
};

export const bookingStatusColors: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  rejected: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  expired: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
};

// ---- Category Display Config ----
export const categoryConfig: Record<DeviceCategory, { icon: string; label: string }> = {
  Regular: { icon: '🖥️', label: 'Regular' },
  'VIP 1': { icon: '⭐', label: 'VIP Room 1' },
  'VIP 2': { icon: '⭐', label: 'VIP Room 2' },
};

// ---- Status Display Config ----
export const statusLabels: Record<DeviceStatus, string> = {
  Ready: 'Ready',
  'In Use': 'In Use',
  Booked: 'Booked',
  Pending: 'Pending',
  Maintenance: 'Maintenance',
};

// ---- WA Message Template ----
export function generateWhatsAppMessage(params: {
  deviceName: string;
  startTime: string;
  durationHours: number;
  customerName: string;
  date: string;
}): string {
  const { deviceName, startTime, durationHours, customerName, date } = params;
  return `Halo admin K Gaming XCafe

Saya ingin booking:
- Device: ${deviceName}
- Tanggal: ${date}
- Jam: ${startTime}
- Durasi: ${durationHours} Jam
- Nama: ${customerName}`;
}

// ---- Time Formatting ----
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

// ---- Estimated Available Time ----
export function formatDuration(hours: number): string {
  if (hours === 1) return '1 Jam';
  return `${hours} Jam`;
}

// ---- Relative Time ----
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(dateStr);
}

// ---- Indonesian Day Names ----
export function getTodayDate(): string {
  const date = new Date();
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}