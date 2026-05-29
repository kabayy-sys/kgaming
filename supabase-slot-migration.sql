-- =============================================
-- K Gaming XCafe - Slot Override System Migration
-- =============================================
-- CARA PAKAI:
-- 1. Buka https://supabase.com → login
-- 2. Masuk ke project → SQL Editor
-- 3. Klik + New Query
-- 4. Paste SEMUA query di bawah ini
-- 5. Klik RUN
-- =============================================

-- =============================================
-- 1. Create slot_overrides table
-- =============================================
CREATE TABLE IF NOT EXISTS slot_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  slot_start TIME NOT NULL,
  slot_end TIME NOT NULL,
  override_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('maintenance', 'in_use')),
  staff_id UUID REFERENCES staff_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. Add index for fast queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_slot_overrides_date_device
  ON slot_overrides(override_date, device_id);

-- =============================================
-- 3. Enable RLS (basic)
-- =============================================
ALTER TABLE slot_overrides ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can read slot_overrides"
  ON slot_overrides FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert slot_overrides"
  ON slot_overrides FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update slot_overrides"
  ON slot_overrides FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete slot_overrides"
  ON slot_overrides FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================
-- 4. Enable realtime
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'slot_overrides'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE slot_overrides;
  END IF;
END $$;

-- =============================================
-- 5. Add new activity actions to the check constraint
-- =============================================
-- Note: If activity_logs has an action check constraint,
-- add new actions. Check first.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_logs'
    AND column_name = 'action'
    AND character_maximum_length IS NOT NULL
  ) THEN
    -- It's a varchar column, no constraint needed
    RAISE NOTICE 'action column is varchar, no constraint update needed';
  END IF;
END $$;

-- =============================================
-- ✅ SELESAI! Slot override system siap
-- =============================================