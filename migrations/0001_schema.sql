-- AnsepZero schema v1 (D1/SQLite). Waktu disimpan sebagai epoch detik (UTC).
CREATE TABLE players(id TEXT PRIMARY KEY, display_name TEXT NOT NULL, secret_hash TEXT NOT NULL, created_at INTEGER NOT NULL, last_seen INTEGER, is_demo INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0);
CREATE TABLE quiz_questions(id INTEGER PRIMARY KEY AUTOINCREMENT, level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 5), category TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'level' CHECK(kind IN('level','pre','post')), question TEXT NOT NULL, options_json TEXT NOT NULL, correct_index INTEGER NOT NULL, explanation TEXT NOT NULL, source_ref TEXT, active INTEGER NOT NULL DEFAULT 1, is_demo INTEGER NOT NULL DEFAULT 0);
CREATE INDEX idx_q_level ON quiz_questions(kind,level,active);
CREATE TABLE quiz_attempts(id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id), kind TEXT NOT NULL, level INTEGER, started_at INTEGER NOT NULL, submitted_at INTEGER, correct INTEGER, total INTEGER, points INTEGER, duration_s INTEGER, flagged INTEGER NOT NULL DEFAULT 0);
CREATE INDEX idx_att_player ON quiz_attempts(player_id,kind,level);
CREATE TABLE quiz_answers(attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id), question_id INTEGER NOT NULL, chosen_index INTEGER, is_correct INTEGER NOT NULL, category TEXT NOT NULL, PRIMARY KEY(attempt_id,question_id));
CREATE INDEX idx_ans_q ON quiz_answers(question_id,is_correct);
CREATE TABLE learning_assessments(id INTEGER PRIMARY KEY AUTOINCREMENT, player_id TEXT NOT NULL REFERENCES players(id), attempt_id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL CHECK(kind IN('pre','post')), correct INTEGER NOT NULL, total INTEGER NOT NULL, score_pct REAL NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX idx_la_player ON learning_assessments(player_id,kind,created_at);
CREATE TABLE game_sessions(id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id), started_at INTEGER NOT NULL, last_event_at INTEGER);
CREATE TABLE game_mission_defs(mission_id TEXT PRIMARY KEY, title TEXT NOT NULL, max_points INTEGER NOT NULL, min_duration_s INTEGER NOT NULL DEFAULT 20, educational INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE game_missions(player_id TEXT NOT NULL REFERENCES players(id), mission_id TEXT NOT NULL REFERENCES game_mission_defs(mission_id), stars INTEGER NOT NULL, points INTEGER NOT NULL, duration_s INTEGER, completed_at INTEGER NOT NULL, flagged INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(player_id,mission_id));
CREATE TABLE leaderboard_scores(player_id TEXT PRIMARY KEY REFERENCES players(id), quiz_points INTEGER NOT NULL DEFAULT 0, adventure_points INTEGER NOT NULL DEFAULT 0, total_points INTEGER NOT NULL DEFAULT 0, missions_done INTEGER NOT NULL DEFAULT 0, levels_done INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0);
CREATE INDEX idx_lb_total ON leaderboard_scores(hidden,total_points DESC);
CREATE TABLE education_content(slug TEXT PRIMARY KEY, title TEXT NOT NULL, body_md TEXT NOT NULL, sources_json TEXT NOT NULL DEFAULT '[]', sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
CREATE TABLE contacts(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone_intl TEXT NOT NULL, note TEXT, verified INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE announcements(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL, published INTEGER NOT NULL DEFAULT 1);
CREATE TABLE ispa_data(period TEXT PRIMARY KEY, label TEXT NOT NULL, cases INTEGER NOT NULL, is_partial INTEGER NOT NULL DEFAULT 0, note TEXT);
CREATE TABLE citizen_reports(id TEXT PRIMARY KEY, description TEXT NOT NULL, lat REAL, lng REAL, location_text TEXT, photo_key TEXT, status TEXT NOT NULL DEFAULT 'menunggu' CHECK(status IN('menunggu','ditinjau','ditindaklanjuti')), created_at INTEGER NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE admin_users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, pass_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
-- Batas 5 admin aktif ditegakkan database (atomik per pernyataan, aman dari permintaan bersamaan).
CREATE TRIGGER admin_limit_ins BEFORE INSERT ON admin_users WHEN NEW.active=1 AND (SELECT COUNT(*) FROM admin_users WHERE active=1)>=5 BEGIN SELECT RAISE(ABORT,'ADMIN_LIMIT'); END;
CREATE TRIGGER admin_limit_upd BEFORE UPDATE OF active ON admin_users WHEN NEW.active=1 AND OLD.active=0 AND (SELECT COUNT(*) FROM admin_users WHERE active=1)>=5 BEGIN SELECT RAISE(ABORT,'ADMIN_LIMIT'); END;
CREATE TABLE admin_sessions(token_hash TEXT PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admin_users(id), expires_at INTEGER NOT NULL);
CREATE TABLE audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER, action TEXT NOT NULL, detail TEXT, at INTEGER NOT NULL);
CREATE TABLE app_settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE rate_limits(k TEXT PRIMARY KEY, n INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE TABLE page_visits(day TEXT PRIMARY KEY, hits INTEGER NOT NULL DEFAULT 0);
