-- AnsepZero: skema awal D1 (SQLite). Tidak ada perintah DROP.
PRAGMA foreign_keys = ON;

CREATE TABLE participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 2 AND 30),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE quiz_questions (
  id TEXT PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  question TEXT NOT NULL,
  choices_json TEXT NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation TEXT NOT NULL,
  source TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);
CREATE INDEX idx_questions_level ON quiz_questions(level, active);

CREATE TABLE quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  attempt_key TEXT NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  percent REAL NOT NULL,
  passed INTEGER NOT NULL CHECK (passed IN (0,1)),
  threshold_percent INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (participant_id, attempt_key)
);
CREATE INDEX idx_attempts_participant ON quiz_attempts(participant_id, level);

CREATE TABLE quiz_answers (
  attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id),
  question_id TEXT NOT NULL REFERENCES quiz_questions(id),
  choice_index INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  submission_key TEXT NOT NULL,
  game_version TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 0 AND 3),
  missions_done INTEGER NOT NULL,
  finished INTEGER NOT NULL CHECK (finished IN (0,1)),
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (participant_id, submission_key)
);
CREATE INDEX idx_game_participant ON game_scores(participant_id, finished);

CREATE TABLE certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cert_no TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('quiz','game')),
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  name_snapshot TEXT NOT NULL,
  game_score_id INTEGER REFERENCES game_scores(id),
  issued_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (participant_id, type)
);

CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin','admin')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX idx_one_superadmin ON admin_users(role) WHERE role = 'superadmin';

CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO app_settings(key, value) VALUES ('pass_percent', '80');

CREATE TABLE rate_limits (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
