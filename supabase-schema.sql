-- =============================================
-- K Gaming XCafe - Supabase Database Schema
-- =============================================
-- Cara pakai:
-- 1. Buka https://supabase.com
-- 2. Masuk ke project kamu
-- 3. Klik "SQL Editor" di sidebar kiri
-- 4. Klik "New Query"
-- 5. Paste semua isi file ini
-- 6. Klik "Run" (atau Ctrl+Enter)
-- 7. Jangan centang RLS / Row Level Security
-- =============================================

-- =============================================
-- 1. TABEL: Staff Profiles (untuk login)
-- =============================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  shift TEXT CHECK (shift IN ('morning', 'night')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. TABEL: Devices (gaming device/PC/PS5)
-- =============================================
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Regular', 'VIP 1', 'VIP 2')),
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

-- =============================================
-- 3. TABEL: Bookings (pemesanan)
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 4. TABEL: Activity Logs (catatan aktivitas)
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. TABEL: Shift Notes (catatan shift)
-- =============================================
CREATE TABLE IF NOT EXISTS shift_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id),
  staff_name TEXT NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'night')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. INDEXES (biar query cepat)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_device_id ON bookings(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- =============================================
-- 7. AUTO-UPDATE TIMESTAMPS (trigger)
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

-- =============================================
-- 8. AKTIFKAN REALTIME (WAJIB untuk fitur realtime)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- =============================================
-- 9. DATA AWAL: Staff Accounts
-- =============================================
INSERT INTO staff_profiles (username, display_name, role, shift) VALUES
  ('pagi01', 'Staff Pagi 01', 'staff', 'morning'),
  ('malam01', 'Staff Malam 01', 'staff', 'night'),
  ('owner', 'Owner', 'owner', NULL)
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- 10. DATA AWAL: Sample Devices
-- =============================================
-- HAPUS DULU DATA LAMA kalau ada (jalanin ini kalo sebelumnya udah ada data lama)
-- DELETE FROM devices;

INSERT INTO devices (name, category, status, hourly_price, facilities) VALUES
  -- REGULER: 4 device PS4 @ Rp 10.000/jam
  ('PS4 Reguler 1', 'Regular', 'Ready', 10000, ARRAY['PS4', 'Monitor 24"', 'Headset']),
  ('PS4 Reguler 2', 'Regular', 'Ready', 10000, ARRAY['PS4', 'Monitor 24"', 'Headset']),
  ('PS4 Reguler 3', 'Regular', 'In Use', 10000, ARRAY['PS4', 'Monitor 24"', 'Headset']),
  ('PS4 Reguler 4', 'Regular', 'Ready', 10000, ARRAY['PS4', 'Monitor 24"', 'Headset']),

  -- VIP 1: PS4 Pro, Nintendo, Netflix @ Rp 30.000/jam
  ('VIP 1.A - PS4 Pro', 'VIP 1', 'Ready', 30000, ARRAY['PS4 Pro', '4K TV 55"', 'Headset Wireless']),
  ('VIP 1.A - Nintendo', 'VIP 1', 'Ready', 30000, ARRAY['Nintendo Switch', '4K TV 55"', 'Joycon']),
  ('VIP 1.A - Netflix', 'VIP 1', 'In Use', 30000, ARRAY['Netflix 4K', 'Smart TV 55"', 'AC', 'Sofa']),
  ('VIP 1.B - PS4 Pro', 'VIP 1', 'Ready', 30000, ARRAY['PS4 Pro', '4K TV 55"', 'Headset Wireless']),
  ('VIP 1.B - Nintendo', 'VIP 1', 'Maintenance', 30000, ARRAY['Nintendo Switch', '4K TV 55"', 'Joycon']),
  ('VIP 1.B - Netflix', 'VIP 1', 'Ready', 30000, ARRAY['Netflix 4K', 'Smart TV 55"', 'AC', 'Sofa']),

  -- VIP 2: PS5, Nintendo, Netflix @ Rp 35.000/jam
  ('VIP 2 - PS5', 'VIP 2', 'Ready', 35000, ARRAY['PS5', '4K TV 65"', 'Headset Wireless', 'RGB Light']),
  ('VIP 2 - Nintendo', 'VIP 2', 'Ready', 35000, ARRAY['Nintendo Switch OLED', '4K TV 65"', 'AC']),
  ('VIP 2 - Netflix', 'VIP 2', 'Booked', 35000, ARRAY['Netflix 4K', 'Smart TV 65"', 'AC', 'Sofa Bed', 'Mini Fridge'])
ON CONFLICT DO NOTHING;

-- =============================================
-- ✅ SELESAI! Schema berhasil diinstall
-- =============================================