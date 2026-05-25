import { create } from 'zustand';
import type { StaffProfile, UserRole } from '@/types';

interface AuthState {
  user: StaffProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: StaffProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  isOwner: () => boolean;
  isStaff: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),

  hasRole: (role) => get().user?.role === role,

  isOwner: () => get().user?.role === 'owner',

  isStaff: () => get().user?.role === 'staff',
}));