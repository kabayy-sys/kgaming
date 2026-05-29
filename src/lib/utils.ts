import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DeviceStatus, BookingStatus, DeviceCategory, TimeSlot, SlotStatus } from '@/types';

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

export const slotStatusColors: Record<SlotStatus, { bg: string; text: string; border: string }> = {
  available: { bg: 'bg-gaming-800', text: 'text-gaming-200', border: 'border-gaming-700' },
  booked: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  blocked: { bg: 'bg-gaming-900', text: 'text-gaming-600', border: 'border-gaming-800' },
};

// ---- Category Display Config ----
export const categoryConfig: Record<DeviceCategory, { icon: string; label: string; defaultPrice: number; description: string }> = {
  Reguler: { icon: '🖥️', label: 'Reguler', defaultPrice: 10000, description: 'PS4 Biasa - 4 unit' },
  'VIP 1': { icon: '⭐', label: 'VIP 1', defaultPrice: 30000, description: 'PS4 Pro, Netflix, Nintendo - 2 unit' },
  'VIP 2': { icon: '🎮', label: 'VIP 2', defaultPrice: 35000, description: 'PS5, Nintendo, Netflix - 1 unit' },
};

// ---- Status Display Config ----
export const statusLabels: Record<DeviceStatus, string> = {
  Ready: 'Ready',
  'In Use': 'In Use',
  Booked: 'Booked',
  Pending: 'Pending',
  Maintenance: 'Maintenance',
};

// ---- V2 Slot Generation ----
// Operational hours: 10:00 - 01:00 (next day)
const OPERATIONAL_START_HOUR = 10;
const OPERATIONAL_END_HOUR = 26; // 01:00 next day = 25 in 24h format, need 26 to include 25:00
const SLOT_INTERVAL_MINUTES = 30;

/**
 * Generate all possible time slots for a given date
 * Generates 30-minute interval slots from 10:00 to 01:00 (next day)
 * Final slot is 01:00 (no 01:30)
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = OPERATIONAL_START_HOUR; hour < OPERATIONAL_END_HOUR; hour++) {
    // For the last hour (01:00 = hour 25), only generate minute 0 to avoid 01:30
    const maxMinute = hour === OPERATIONAL_END_HOUR - 1 ? 1 : 60;
    for (let minute = 0; minute < maxMinute; minute += SLOT_INTERVAL_MINUTES) {
      const displayHour = hour >= 24 ? hour - 24 : hour;
      slots.push(
        `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  return slots;
}

/**
 * Calculate blocked slots based on start_time and duration
 */
export function getBlockedSlots(startTime: string, durationMinutes: number): string[] {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startTotalMinutes = hours * 60 + minutes;
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  const blocked: string[] = [];

  let current = startTotalMinutes;
  while (current < endTotalMinutes) {
    const h = Math.floor(current / 60) % 24;
    const m = current % 60;
    blocked.push(
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    );
    current += SLOT_INTERVAL_MINUTES;
  }

  return blocked;
}

/**
 * Parse a time string (HH:mm) to total minutes for comparison
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format minutes to duration string
 */
export function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  if (hours === 1) return '1 Jam';
  return `${hours} Jam`;
}

/**
 * Format time to display
 */
export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (h === 0) return `12:${m.toString().padStart(2, '0')} AM`;
  if (h < 12) return `${h}:${m.toString().padStart(2, '0')} AM`;
  if (h === 12) return `12:${m.toString().padStart(2, '0')} PM`;
  return `${h - 12}:${m.toString().padStart(2, '0')} PM`;
}

/**
 * Generate slots with availability status based on existing bookings
 * Handles midnight-crossing bookings correctly (e.g., 23:00 -> 01:00)
 */
export function generateSlotsWithAvailability(
  allSlots: string[],
  existingBookings: Array<{ start_time: string; end_time: string; status: string; id: string }>
): TimeSlot[] {
  // Collect all booked/pending slot times
  const unavailableSlots = new Map<string, { status: SlotStatus; bookingId: string }>();

  for (const booking of existingBookings) {
    let durationMinutes = timeToMinutes(booking.end_time) - timeToMinutes(booking.start_time);
    // Handle midnight crossing: if end_time < start_time, add 24h (1440 min)
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }
    const blockedSlots = getBlockedSlots(booking.start_time, durationMinutes);
    const slotStatus: SlotStatus = booking.status === 'approved' ? 'booked' : 'pending';
    for (const slot of blockedSlots) {
      unavailableSlots.set(slot, { status: slotStatus, bookingId: booking.id });
    }
  }

  return allSlots.map((time) => {
    const existing = unavailableSlots.get(time);
    if (existing) {
      return { time, status: existing.status, bookingId: existing.bookingId };
    }
    return { time, status: 'available' };
  });
}

// ---- WA Message Template ----
export function generateWhatsAppMessage(params: {
  deviceName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  customerName: string;
}): string {
  const { deviceName, date, startTime, durationMinutes, customerName } = params;
  const hours = durationMinutes / 60;
  return `Halo admin K Gaming XCafe

Saya ingin booking:

Device: ${deviceName}
Tanggal: ${date}
Jam: ${startTime}
Durasi: ${hours} Jam
Nama: ${customerName}`;
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

export function formatIndonesianDate(date: Date): string {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
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

// ---- Estimated Available Time ----
export function formatDurationHours(hours: number): string {
  if (hours === 1) return '1 Jam';
  return `${hours} Jam`;
}