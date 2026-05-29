-- =============================================
-- K Gaming XCafe - V2 Slot-Based Booking Migration
-- =============================================
-- CARA PAKAI:
-- 1. Buka https://supabase.com → login
-- 2. Masuk ke project → SQL Editor
-- 3. Klik + New Query
-- 4. Paste SEMUA query di bawah ini
-- 5. Klik RUN
-- 6. Balik ke aplikasi, refresh
-- =============================================
-- NOTE: Ini ADDITIVE query, tidak menghapus data lama.
-- start_time (TIMESTAMPTZ) dan duration_hours tetap ada.
-- Kolom baru: booking_date, slot_start (TIME), slot_end (TIME), duration_minutes
-- =============================================

-- =============================================
-- 1. Tambah kolom baru (nama berbeda agar tidak konflik)
-- =============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_start TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_end TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- =============================================
-- 2. Isi kolom baru dari data existing (jika ada)
-- =============================================
UPDATE bookings SET booking_date = start_time::DATE WHERE booking_date IS NULL;
UPDATE bookings SET slot_start = start_time::TIME WHERE slot_start IS NULL;
UPDATE bookings SET duration_minutes = duration_hours * 60 WHERE duration_minutes IS NULL;
UPDATE bookings SET slot_end = (booking_date::TIMESTAMPTZ + slot_start + (duration_minutes || ' minutes')::INTERVAL)::TIME WHERE slot_end IS NULL;

-- =============================================
-- 3. Set NOT NULL setelah data diisi
-- =============================================
ALTER TABLE bookings ALTER COLUMN booking_date SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN slot_start SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN slot_end SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN duration_minutes SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN duration_minutes SET DEFAULT 120;

-- =============================================
-- 4. Tambah index untuk query slot availability
-- =============================================
CREATE INDEX IF NOT EXISTS idx_bookings_date_device ON bookings(booking_date, device_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_range ON bookings(slot_start, slot_end);

-- =============================================
-- 5. Aktifkan realtime untuk tabel bookings
--    (skip kalo udah terdaftar)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'bookings'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;
END $$;

-- =============================================
-- 6. SEED DATA: Sample bookings untuk testing V2
--    (jalanin bagian ini kalo data bookings kosong)
-- =============================================
-- Ambil device IDs yang ada
DO $$
DECLARE
  v_device_ids UUID[];
  v_today DATE := CURRENT_DATE;
  v_device_id UUID;
BEGIN
  -- Kumpulin semua device ID
  SELECT ARRAY_AGG(id) INTO v_device_ids FROM devices WHERE is_archived = false;

  -- Hanya insert kalo ada device
  IF array_length(v_device_ids, 1) > 0 THEN
    -- Booking 1: approved, hari ini jam 19:00-21:00, 2 jam
    INSERT INTO bookings (device_id, customer_name, start_time, duration_hours, status, booking_date, slot_start, slot_end, duration_minutes, created_at, updated_at)
    VALUES (v_device_ids[1], 'Raken', v_today::TIMESTAMPTZ + '19:00'::TIME, 2, 'approved', v_today, '19:00', '21:00', 120, NOW(), NOW());

    -- Booking 2: pending, hari ini jam 14:00-16:00, 2 jam
    INSERT INTO bookings (device_id, customer_name, start_time, duration_hours, status, booking_date, slot_start, slot_end, duration_minutes, created_at, updated_at)
    VALUES (v_device_ids[2], 'Budi', v_today::TIMESTAMPTZ + '14:00'::TIME, 2, 'pending', v_today, '14:00', '16:00', 120, NOW(), NOW());

    -- Booking 3: approved, besok jam 20:00-23:00, 3 jam
    INSERT INTO bookings (device_id, customer_name, start_time, duration_hours, status, booking_date, slot_start, slot_end, duration_minutes, created_at, updated_at)
    VALUES (v_device_ids[3], 'Siti', (v_today + 1)::TIMESTAMPTZ + '20:00'::TIME, 3, 'approved', v_today + 1, '20:00', '23:00', 180, NOW(), NOW());

    -- Booking 4: pending, besok jam 10:00-12:00, 2 jam
    INSERT INTO bookings (device_id, customer_name, start_time, duration_hours, status, booking_date, slot_start, slot_end, duration_minutes, created_at, updated_at)
    VALUES (v_device_ids[4], 'Alex', (v_today + 1)::TIMESTAMPTZ + '10:00'::TIME, 2, 'pending', v_today + 1, '10:00', '12:00', 120, NOW(), NOW());

    -- Booking 5: completed, kemarin jam 18:00-20:00
    INSERT INTO bookings (device_id, customer_name, start_time, duration_hours, status, booking_date, slot_start, slot_end, duration_minutes, created_at, updated_at)
    VALUES (v_device_ids[1], 'Doni', (v_today - 1)::TIMESTAMPTZ + '18:00'::TIME, 2, 'completed', v_today - 1, '18:00', '20:00', 120, NOW(), NOW());
  END IF;
END $$;

-- =============================================
-- ✅ SELESAI! V2 slot system siap digunakan
-- =============================================