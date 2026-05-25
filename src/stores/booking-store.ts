import { create } from 'zustand';
import { supabase, BOOKINGS_CHANNEL } from '@/lib/supabase';
import type { Booking, BookingStatus } from '@/types';

interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  pendingCount: number;
  setBookings: (bookings: Booking[]) => void;
  setLoading: (loading: boolean) => void;
  fetchBookings: () => Promise<void>;
  fetchPendingCount: () => Promise<void>;
  approveBooking: (bookingId: string, staffId: string) => Promise<void>;
  rejectBooking: (bookingId: string, staffId: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;
  subscribeToBookings: () => () => void;
  getBookingsByDevice: (deviceId: string) => Booking[];
  hasActiveBooking: (deviceId: string) => boolean;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  isLoading: true,
  pendingCount: 0,

  setBookings: (bookings) => set({ bookings }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchBookings: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ bookings: data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      set({ isLoading: false });
    }
  },

  fetchPendingCount: async () => {
    try {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      set({ pendingCount: count || 0 });
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    }
  },

  approveBooking: async (bookingId, staffId) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'approved',
        approved_by: staffId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Failed to approve booking:', error);
      throw error;
    }
  },

  rejectBooking: async (bookingId, staffId) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'rejected',
        approved_by: staffId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Failed to reject booking:', error);
      throw error;
    }
  },

  completeBooking: async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Failed to complete booking:', error);
      throw error;
    }
  },

  subscribeToBookings: () => {
    const channel = supabase
      .channel(BOOKINGS_CHANNEL)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          get().fetchBookings();
          get().fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  getBookingsByDevice: (deviceId) => {
    return get().bookings.filter((b) => b.device_id === deviceId);
  },

  hasActiveBooking: (deviceId) => {
    return get().bookings.some(
      (b) =>
        b.device_id === deviceId &&
        (b.status === 'approved' || b.status === 'pending')
    );
  },
}));