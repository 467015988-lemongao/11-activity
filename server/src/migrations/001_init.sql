-- 初始迁移：双十一活动系统六表。迁移只增不删。
-- 通用类型（INTEGER/TEXT），时间统一存 ISO-8601 UTC 文本。

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  rules_text TEXT NOT NULL DEFAULT '',
  updated_by INTEGER,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id),
  threshold INTEGER NOT NULL CHECK (threshold > 0),
  bonus INTEGER NOT NULL CHECK (bonus > 0),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  tier_id INTEGER NOT NULL REFERENCES tiers(id),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','redeemed')),
  created_at TEXT NOT NULL,
  redeemed_at TEXT,
  redeemed_by INTEGER REFERENCES admins(id),
  UNIQUE(activity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_signups_phone ON signups(contact_phone);
CREATE INDEX IF NOT EXISTS idx_signups_created ON signups(created_at);

CREATE TABLE IF NOT EXISTS admin_op_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES admins(id),
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);
