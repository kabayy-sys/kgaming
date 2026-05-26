-- =============================================
-- K Gaming XCafe - Migration: Update Categories
-- =============================================
-- Jalankan SQL ini di Supabase SQL Editor
-- untuk update data device yang masih pake
-- kategori LAMA (PS5, VIP, Regular, PC)
-- ke kategori BARU (Reguler, VIP 1.A, VIP 1.B, VIP 2)
-- =============================================

-- 1. Hapus dulu data device lama biar ga dobel
DELETE FROM bookings;
DELETE FROM activity_logs;
DELETE FROM devices;

-- 2. Insert ulang data device dengan kategori baru
INSERT INTO devices (name, category, status, hourly_price, facilities) VALUES
  -- Reguler: 4 PS4 @ Rp10.000/jam
  ('PS4 Reguler 1', 'Reguler', 'Ready', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  ('PS4 Reguler 2', 'Reguler', 'In Use', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  ('PS4 Reguler 3', 'Reguler', 'Ready', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  ('PS4 Reguler 4', 'Reguler', 'Booked', 10000, ARRAY['PS4 Console', 'Controller', 'HD TV']),
  -- VIP 1.A: PS4 Pro, Nintendo, Netflix @ Rp30.000/jam
  ('PS4 Pro VIP 1.A', 'VIP 1.A', 'Ready', 30000, ARRAY['PS4 Pro', '4K TV', 'Wireless Controller', 'Headset']),
  ('Nintendo VIP 1.A', 'VIP 1.A', 'Ready', 30000, ARRAY['Nintendo Switch', '4K TV', 'Joy-Con']),
  ('Netflix VIP 1.A', 'VIP 1.A', 'Ready', 30000, ARRAY['4K TV', 'Streaming Access', 'Mini Fridge']),
  -- VIP 1.B: PS4 Pro, Nintendo, Netflix @ Rp30.000/jam
  ('PS4 Pro VIP 1.B', 'VIP 1.B', 'Ready', 30000, ARRAY['PS4 Pro', '4K TV', 'Wireless Controller', 'Headset']),
  ('Nintendo VIP 1.B', 'VIP 1.B', 'In Use', 30000, ARRAY['Nintendo Switch', '4K TV', 'Joy-Con']),
  ('Netflix VIP 1.B', 'VIP 1.B', 'Ready', 30000, ARRAY['4K TV', 'Streaming Access', 'Mini Fridge']),
  -- VIP 2: PS5, Nintendo, Netflix @ Rp35.000/jam
  ('PS5 VIP 2', 'VIP 2', 'Ready', 35000, ARRAY['PS5', '4K TV', 'Wireless Controller', 'Headset']),
  ('Nintendo VIP 2', 'VIP 2', 'Ready', 35000, ARRAY['Nintendo Switch', '4K TV', 'Joy-Con']),
  ('Netflix VIP 2', 'VIP 2', 'In Use', 35000, ARRAY['4K TV', 'Streaming Access', 'Mini Fridge', 'Sofa']);