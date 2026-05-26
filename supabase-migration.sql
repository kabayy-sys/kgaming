-- =============================================
-- K Gaming XCafe - Migration: Fix Categories
-- =============================================
-- MASALAH: Database constraint masih pake kategori LAMA
--   ('Reguler', 'VIP 1.A', 'VIP 1.B', 'VIP 2')
-- Tapi kode udah pake kategori BARU
--   ('Reguler', 'VIP 1', 'VIP 2')
-- SEHINGGA: waktu Sync Database, insert device kategori
--   'VIP 1' gagal karena database ga nerima.
-- =============================================
-- CARA PAKAI:
-- 1. Buka https://supabase.com
-- 2. Masuk ke project → SQL Editor
-- 3. Paste query di bawah ini
-- 4. Klik RUN
-- 5. Selesai! Login ke aplikasi → Sync Database → beres
-- =============================================

-- 1. Hapus constraint category yang lama
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_category_check;

-- 2. Buat constraint category yang baru
ALTER TABLE devices ADD CONSTRAINT devices_category_check
  CHECK (category IN ('Reguler', 'VIP 1', 'VIP 2'));

-- 3. Hapus data lama
DELETE FROM activity_logs;
DELETE FROM bookings;
DELETE FROM devices;

-- 4. Insert ulang 7 device dengan kategori & harga baru
INSERT INTO devices (name, category, status, hourly_price, facilities) VALUES
  -- Reguler: 4 PS4 biasa @ Rp10.000
  ('PS4 Reguler 1', 'Reguler', 'Ready', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  ('PS4 Reguler 2', 'Reguler', 'In Use', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  ('PS4 Reguler 3', 'Reguler', 'Ready', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  ('PS4 Reguler 4', 'Reguler', 'Booked', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  -- VIP 1: 2 unit (1.A & 1.B) @ Rp30.000
  ('VIP 1.A - PS4 Pro, Netflix, Nintendo', 'VIP 1', 'Ready', 30000, ARRAY['PS4 Pro', '4K TV', 'Wireless Controller', 'Netflix', 'Nintendo Switch', 'Headset']),
  ('VIP 1.B - PS4 Pro, Netflix, Nintendo', 'VIP 1', 'In Use', 30000, ARRAY['PS4 Pro', '4K TV', 'Wireless Controller', 'Netflix', 'Nintendo Switch', 'Headset', 'Mini Fridge']),
  -- VIP 2: 1 unit @ Rp35.000
  ('VIP 2 - PS5, Nintendo, Netflix', 'VIP 2', 'Ready', 35000, ARRAY['PS5', '4K TV', 'Wireless Controller', 'Nintendo Switch', 'Netflix', 'Sofa']);