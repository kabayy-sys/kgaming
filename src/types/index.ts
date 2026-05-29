// ============================================
// K Gaming XCafe - Core Type Definitions
// ============================================

// ---- Device Types ----
export type DeviceCategory = 'Reguler' | 'VIP 1' | 'VIP 2';

export type DeviceStatus = 'Ready' | 'In Use' | 'Booked' | 'Pending' | 'Maintenance';

export interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  status: DeviceStatus;
  hourly_price: number;
  facilities: string[];
  notes: string | null;
  estimated_available_at: string | null;
  last_updated_by: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ---- V2 Slot-based Booking Types ----
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'completed';
export type SlotStatus = 'available' | 'booked' | 'pending' | 'blocked';

export interface TimeSlot {
  time: string; // HH:mm format
  status: SlotStatus;
  bookingId?: string;
}

export interface Booking {
  id: string;
  device_id: string;
  customer_name: string;
  customer_phone: string | null;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // TIMESTAMPTZ (old field)
  duration_hours: number; // old field
  slot_start: string; // HH:mm (V2 field)
  slot_end: string; // HH:mm (V2 field)
  duration_minutes: number;
  status: BookingStatus;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- User / Auth Types ----
export type UserRole = 'owner' | 'staff';

export interface StaffProfile {
  id: string;
  user_id: string;
  username: string;
  role: UserRole;
  display_name: string;
  shift: 'morning' | 'night' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Slot Override Types ----
export type SlotOverrideStatus = 'maintenance' | 'in_use';

export interface SlotOverride {
  id: string;
  device_id: string;
  slot_start: string; // HH:mm
  slot_end: string; // HH:mm
  override_date: string; // YYYY-MM-DD
  status: SlotOverrideStatus;
  staff_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Activity Log Types ----
export type ActivityAction =
  | 'device_status_change'
  | 'device_created'
  | 'device_edited'
  | 'device_archived'
  | 'booking_created'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_completed'
  | 'user_login'
  | 'user_logout'
  | 'staff_created'
  | 'staff_disabled'
  | 'password_reset'
  | 'shift_note_created'
  | 'slot_updated'
  | 'session_started'
  | 'maintenance_enabled'
  | 'slot_cleared';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  actor_id: string | null;
  actor_name: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// ---- Shift Notes ----
export interface ShiftNote {
  id: string;
  staff_id: string;
  staff_name: string;
  shift: 'morning' | 'night';
  content: string;
  created_at: string;
}

// ---- UI State Types ----
export type DeviceFilter = DeviceCategory | 'all';

export interface DeviceCardProps {
  device: Device;
  onBook?: (device: Device) => void;
  onStatusChange?: (device: Device, status: DeviceStatus) => void;
  compact?: boolean;
  isPublic?: boolean;
}

// ---- Dashboard Stats ----
export interface DashboardStats {
  total_devices: number;
  devices_in_use: number;
  devices_ready: number;
  devices_maintenance: number;
  pending_bookings: number;
  active_bookings: number;
  total_staff: number;
}