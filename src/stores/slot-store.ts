import { create } from 'zustand';
import { supabase, SLOT_OVERRIDES_CHANNEL } from '@/lib/supabase';
import type { SlotOverride, Device, Booking } from '@/types';

export interface SlotAvailability {
  time: string;
  status: 'available' | 'booked' | 'pending' | 'blocked';
  bookingId?: string;
  overrideId?: string;
  notes?: string;
}

export interface DeviceSchedule {
  device: Device;
  slots: SlotAvailability[];
}

interface SlotState {
  devicesSchedule: DeviceSchedule[];
  overrides: SlotOverride[];
  isLoading: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  fetchSchedule: (date: string) => Promise<void>;
  fetchOverrides: (date: string) => Promise<void>;
  addOverride: (override: Omit<SlotOverride, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  removeOverride: (overrideId: string) => Promise<void>;
  subscribeToOverrides: () => () => void;
  generateTimeSlots: () => string[];
  getSlotsForDevice: (deviceId: string) => SlotAvailability[];
}

// Operational hours: 10:00 - 01:00 (next day)
const OPERATIONAL_START_HOUR = 10;
const OPERATIONAL_END_HOUR = 26; // 01:00 next day = 25 in 24h format
const SLOT_INTERVAL_MINUTES = 30;

function generateAllSlots(): string[] {
  const slots: string[] = [];
  for (let hour = OPERATIONAL_START_HOUR; hour < OPERATIONAL_END_HOUR; hour++) {
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getBlockedSlots(startTime: string, durationMinutes: number): string[] {
  const startTotalMinutes = timeToMinutes(startTime);
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  const blocked: string[] = [];
  let current = startTotalMinutes;
  while (current < endTotalMinutes) {
    const h = Math.floor(current / 60) % 24;
    const m = current % 60;
    blocked.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += SLOT_INTERVAL_MINUTES;
  }
  return blocked;
}

function isSlotOverlap(slot1Start: string, slot1End: string, slot2Start: string, slot2End: string): boolean {
  const s1Start = timeToMinutes(slot1Start);
  const s1End = timeToMinutes(slot1End);
  const s2Start = timeToMinutes(slot2Start);
  const s2End = timeToMinutes(slot2End);
  return s1Start < s2End && s2Start < s1End;
}

export const useSlotStore = create<SlotState>((set, get) => ({
  devicesSchedule: [],
  overrides: [],
  isLoading: false,
  selectedDate: new Date().toISOString().split('T')[0],

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  generateTimeSlots: generateAllSlots,

  getSlotsForDevice: (deviceId: string) => {
    const schedule = get().devicesSchedule.find(s => s.device.id === deviceId);
    return schedule?.slots || [];
  },

  fetchSchedule: async (date: string) => {
    try {
      set({ isLoading: true });
      
      // Fetch all non-archived devices
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('is_archived', false)
        .order('name');
      
      if (devicesError) throw devicesError;
      if (!devices) throw new Error('No devices found');

      // Fetch bookings for this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', date)
        .in('status', ['approved', 'pending'])
        .order('slot_start');
      
      if (bookingsError) throw bookingsError;

      // Fetch overrides for this date
      const { data: overrides, error: overridesError } = await supabase
        .from('slot_overrides')
        .select('*')
        .eq('override_date', date);
      
      if (overridesError) throw overridesError;

      const allSlots = generateAllSlots();

      const devicesSchedule: DeviceSchedule[] = (devices as Device[]).map((device) => {
        const deviceBookings = (bookings as Booking[] || []).filter(b => b.device_id === device.id);
        const deviceOverrides = (overrides as SlotOverride[] || []).filter(o => o.device_id === device.id);

        const slots: SlotAvailability[] = allSlots.map((time) => {
          // Check for overrides first
          const override = deviceOverrides.find(o => {
            const oStartMinutes = timeToMinutes(o.slot_start);
            const oEndMinutes = timeToMinutes(o.slot_end);
            const timeMinutes = timeToMinutes(time);
            return timeMinutes >= oStartMinutes && timeMinutes < oEndMinutes;
          });

          if (override) {
            return {
              time,
              status: 'blocked',
              overrideId: override.id,
              notes: override.notes || undefined,
            };
          }

          // Check for bookings
          for (const booking of deviceBookings as Booking[]) {
            let durationMinutes = booking.duration_minutes || 120;
            const blockedSlots = getBlockedSlots(booking.slot_start, durationMinutes);
            if (blockedSlots.includes(time)) {
              return {
                time,
                status: booking.status === 'approved' ? 'booked' : 'pending',
                bookingId: booking.id,
              };
            }
          }

          return { time, status: 'available' };
        });

        return { device: device as Device, slots };
      });

      set({
        devicesSchedule,
        overrides: overrides as SlotOverride[],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      set({ isLoading: false });
    }
  },

  fetchOverrides: async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('slot_overrides')
        .select('*')
        .eq('override_date', date);
      
      if (error) throw error;
      set({ overrides: data || [] });
    } catch (error) {
      console.error('Failed to fetch overrides:', error);
    }
  },

  addOverride: async (override) => {
    try {
      const { error } = await supabase
        .from('slot_overrides')
        .insert([override]);
      
      if (error) throw error;

      // Refetch schedule to update UI
      await get().fetchSchedule(get().selectedDate);
    } catch (error) {
      console.error('Failed to add override:', error);
      throw error;
    }
  },

  removeOverride: async (overrideId: string) => {
    try {
      const { error } = await supabase
        .from('slot_overrides')
        .delete()
        .eq('id', overrideId);
      
      if (error) throw error;

      // Refetch schedule to update UI
      await get().fetchSchedule(get().selectedDate);
    } catch (error) {
      console.error('Failed to remove override:', error);
      throw error;
    }
  },

  subscribeToOverrides: () => {
    const channel = supabase
      .channel(SLOT_OVERRIDES_CHANNEL)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slot_overrides',
        },
        () => {
          // Refetch schedule when overrides change
          get().fetchSchedule(get().selectedDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));