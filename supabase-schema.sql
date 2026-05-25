-- =============================================
-- K Gaming XCafe - Supabase Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- =============================================
-- STAFF PROFILES (Authentication)
-- =============================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  shift TEXT CHECK (shift IN ('morning', 'night')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial staff accounts (per docs)
INSERT INTO staff_profiles (username, display_name, role, shift) VALUES
  ('pagi01', 'Staff Pagi 01', 'staff', 'morning'),
  ('malam01', 'Staff Malam 01', 'staff', 'night'),
  ('owner', 'Owner', 'owner', NULL)
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- DEVICES
-- =============================================
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('PS5', 'VIP', 'Regular', 'PC')),
  status TEXT NOT NULL DEFAULT 'Ready' CHECK (status IN ('Ready', 'In Use', 'Booked', 'Pending', 'Maintenance')),
  hourly_price INTEGER NOT NULL DEFAULT 0,
  facilities TEXT[] DEFAULT '{}',
  notes TEXT,
  estimated_available_at TIMESTAMPTZ,
  last_updated_by TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample devices
INSERT INTO devices (name, category, status, hourly_price, facilities) VALUES
  ('PS5 VIP 1', 'PS5', 'Ready', 25000, ARRAY['4K TV', 'Wireless Controller', 'Headset']),
  ('PS5 VIP 2', 'PS5', 'Ready', 25000, ARRAY['4K TV', 'Wireless Controller']),
  ('PS5 Regular 1', 'PS5', 'In Use', 15000, ARRAY['HD TV', 'Controller']),
  ('PS5 Regular 2', 'PS5', 'Ready', 15000, ARRAY['HD TV', 'Controller']),
  ('VIP Room 1', 'VIP', 'Ready', 35000, ARRAY['AC', 'Sofa', '4K TV', 'Mini Fridge']),
  ('VIP Room 2', 'VIP', 'Maintenance', 35000, ARRAY['AC', 'Sofa', '4K TV']),
  ('Regular 1', 'Regular', 'Ready', 10000, ARRAY['Monitor 24"', 'Headset']),
  ('Regular 2', 'Regular', 'In Use', 10000, ARRAY['Monitor 24"', 'Headset']),
  ('Regular 3', 'Regular', 'Ready', 10000, ARRAY['Monitor 27"', 'Headset']),
  ('PC Gaming 1', 'PC', 'Ready', 20000, ARRAY['RTX 4060', '144Hz Monitor', 'RGB Keyboard']),
  ('PC Gaming 2', 'PC', 'In Use', 20000, ARRAY['RTX 4060', '144Hz Monitor', 'RGB Keyboard']),
  ('PC Gaming 3', 'PC', 'Booked', 20000, ARRAY['RTX 4070', '165Hz Monitor', 'RGB Setup'])
ON CONFLICT DO NOTHING;

-- =============================================
-- BOOKINGS
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'completed')),
  notes TEXT,
  approved_by UUID REFERENCES staff_profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_device_id ON bookings(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- =============================================
-- SHIFT NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS shift_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff_profiles(id),
  staff_name TEXT NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'night')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();