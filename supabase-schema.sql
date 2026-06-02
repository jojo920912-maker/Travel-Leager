-- ================================================================
--  旅途記帳 — Supabase 資料表建立腳本
--  執行方式：Supabase Dashboard → SQL Editor → 貼上並執行
-- ================================================================

-- ── 1. users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  BIGSERIAL     PRIMARY KEY,
  username            TEXT          NOT NULL UNIQUE,
  password            TEXT          NOT NULL,
  "displayName"       TEXT          NOT NULL DEFAULT '',
  "securityQuestion"  TEXT          NOT NULL DEFAULT '',
  "securityAnswer"    TEXT          NOT NULL DEFAULT '',  -- 小寫+去空白後儲存
  "createdAt"         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 2. expenses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id              BIGSERIAL   PRIMARY KEY,
  title           TEXT        NOT NULL,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  category        TEXT        NOT NULL DEFAULT 'other',
  "paymentMethod" TEXT        NOT NULL DEFAULT 'cash',
  date            TEXT        NOT NULL,             -- YYYY-MM-DD
  time            TEXT        NOT NULL DEFAULT '',  -- HH:mm
  note            TEXT        NOT NULL DEFAULT '',
  "userId"        BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. trips ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id            BIGSERIAL   PRIMARY KEY,
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  "startDate"   TEXT        NOT NULL,
  "endDate"     TEXT        NOT NULL DEFAULT '',
  currency      TEXT        NOT NULL DEFAULT 'TWD',
  "userId"      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. members ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id        BIGSERIAL   PRIMARY KEY,
  "tripId"  BIGINT      NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name      TEXT        NOT NULL,
  color     TEXT        NOT NULL DEFAULT '#5CC8BE'
);

-- ── 5. tripExpenses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tripExpenses" (
  id              BIGSERIAL   PRIMARY KEY,
  "tripId"        BIGINT      NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  category        TEXT        NOT NULL DEFAULT 'other',
  "paymentMethod" TEXT        NOT NULL DEFAULT 'cash',
  date            TEXT        NOT NULL,
  time            TEXT        NOT NULL DEFAULT '',
  "paidById"      BIGINT,
  "splitAmong"    BIGINT[]    NOT NULL DEFAULT '{}',
  note            TEXT        NOT NULL DEFAULT '',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. budgets ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id            BIGSERIAL   PRIMARY KEY,
  "userId"      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month         TEXT        NOT NULL,               -- YYYY-MM
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  "dailyBudget" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "tripBudget"  NUMERIC(12,2) NOT NULL DEFAULT 0,
  categories    JSONB       NOT NULL DEFAULT '{}',  -- { "food": 5000, ... }
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", month)
);

-- ================================================================
--  RLS（Row Level Security）設定
--  ⚠️  以下設定關閉 RLS，適合開發環境。
--     正式上線前請改為設定細粒度存取政策。
-- ================================================================
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses       DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips          DISABLE ROW LEVEL SECURITY;
ALTER TABLE members        DISABLE ROW LEVEL SECURITY;
ALTER TABLE "tripExpenses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets        DISABLE ROW LEVEL SECURITY;

-- ================================================================
--  允許匿名金鑰（anon key）操作所有資料表
-- ================================================================
GRANT ALL ON users          TO anon, authenticated;
GRANT ALL ON expenses       TO anon, authenticated;
GRANT ALL ON trips          TO anon, authenticated;
GRANT ALL ON members        TO anon, authenticated;
GRANT ALL ON "tripExpenses" TO anon, authenticated;
GRANT ALL ON budgets        TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ================================================================
--  找回密碼功能 — 若 users 資料表已存在，請另外執行此段
-- ================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "securityQuestion" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "securityAnswer"   TEXT NOT NULL DEFAULT '';
