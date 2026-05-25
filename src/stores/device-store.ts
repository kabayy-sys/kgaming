import { create } from 'zustand';
import { supabase, DEVICES_CHANNEL } from '@/lib/supabase';
import type { Device, DeviceStatus, DeviceCategory } from '@/types';

interface DeviceState {
  devices: Device[];
  isLoading: boolean;
  filter: DeviceCategory | 'all';
  selectedDevice: Device | null;
  setDevices: (devices: Device[]) => void;
  setFilter: (filter: DeviceCategory | 'all') => void;
  setSelectedDevice: (device: Device | null) => void;
  setLoading: (loading: boolean) => void;
  updateDeviceStatus: (deviceId: string, status: DeviceStatus) => Promise<void>;
  filteredDevices: () => Device[];
  fetchDevices: () => Promise<void>;
  subscribeToDevices: () => () => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  isLoading: true,
  filter: 'all',
  selectedDevice: null,

  setDevices: (devices) => set({ devices, isLoading: false }),

  setFilter: (filter) => set({ filter }),

  setSelectedDevice: (device) => set({ selectedDevice: device }),

  setLoading: (isLoading) => set({ isLoading }),

  updateDeviceStatus: async (deviceId, status) => {
    const device = get().devices.find((d) => d.id === deviceId);
    if (!device) return;

    const { error } = await supabase
      .from('devices')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    if (error) {
      console.error('Failed to update device status:', error);
    }
  },

  filteredDevices: () => {
    const { devices, filter } = get();
    if (filter === 'all') return devices.filter((d) => !d.is_archived);
    return devices.filter((d) => d.category === filter && !d.is_archived);
  },

  fetchDevices: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      set({ devices: data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      set({ isLoading: false });
    }
  },

  subscribeToDevices: () => {
    const channel = supabase
      .channel(DEVICES_CHANNEL)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
        },
        () => {
          get().fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));