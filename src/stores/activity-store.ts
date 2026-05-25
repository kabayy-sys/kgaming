import { create } from 'zustand';
import { supabase, ACTIVITY_CHANNEL } from '@/lib/supabase';
import type { ActivityLog } from '@/types';

interface ActivityState {
  logs: ActivityLog[];
  isLoading: boolean;
  setLogs: (logs: ActivityLog[]) => void;
  setLoading: (loading: boolean) => void;
  fetchLogs: () => Promise<void>;
  fetchRecentLogs: (limit?: number) => Promise<void>;
  subscribeToActivity: () => () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  logs: [],
  isLoading: true,

  setLogs: (logs) => set({ logs }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchLogs: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ logs: data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      set({ isLoading: false });
    }
  },

  fetchRecentLogs: async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      set({ logs: data || [] });
    } catch (error) {
      console.error('Failed to fetch recent logs:', error);
    }
  },

  subscribeToActivity: () => {
    const channel = supabase
      .channel(ACTIVITY_CHANNEL)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        (payload) => {
          const newLog = payload.new as ActivityLog;
          set({ logs: [newLog, ...get().logs.slice(0, 49)] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));