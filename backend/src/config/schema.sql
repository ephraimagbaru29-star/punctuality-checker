-- ============================================================
-- PUNCTUALITY CHECKER — Supabase PostgreSQL Schema
-- Paste the entire file into Supabase → SQL Editor → Run
-- ============================================================

-- Enable UUID extension (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. QR CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_codes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      TEXT        UNIQUE NOT NULL,
  admin_id   UUID        REFERENCES admins(id) ON DELETE CASCADE,
  label      TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clock_in_id     TEXT        UNIQUE NOT NULL,
  full_name       TEXT        NOT NULL,
  email           TEXT        UNIQUE NOT NULL,
  phone           TEXT,
  password_hash   TEXT        NOT NULL,
  profile_picture TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending',
  qr_token        TEXT        REFERENCES qr_codes(token) ON DELETE SET NULL,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT students_status_check CHECK (status IN ('pending', 'active', 'suspended'))
);


-- ============================================================
-- 4. STUDENT DEVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS student_devices (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID        UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  ip_address         TEXT        NOT NULL,
  device_fingerprint TEXT        NOT NULL,
  user_agent         TEXT,
  locked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. DEVICE RESET REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS device_reset_requests (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reason       TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending',
  reset_token  TEXT        UNIQUE,
  token_used   BOOLEAN     NOT NULL DEFAULT FALSE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  CONSTRAINT drr_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);


-- ============================================================
-- 6. ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date               DATE        NOT NULL,
  clock_in_time      TIMESTAMPTZ,
  clock_out_time     TIMESTAMPTZ,
  clock_out_reason   TEXT,
  status             TEXT        NOT NULL DEFAULT 'absent',
  auto_clocked_out   BOOLEAN     NOT NULL DEFAULT FALSE,
  ip_address         TEXT,
  device_fingerprint TEXT,
  location_lat       NUMERIC(9,6),
  location_lng       NUMERIC(9,6),
  location_address   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, date),
  CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'late', 'auto_clocked_out'))
);


-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'info',
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'warning', 'reminder', 'system'))
);


-- ============================================================
-- 8. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date         ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notifications_student   ON notifications(student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_students_status         ON students(status);
CREATE INDEX IF NOT EXISTS idx_qr_token                ON qr_codes(token);
