-- Opt-in tampil di leaderboard publik (default: tidak tampil)
ALTER TABLE participants ADD COLUMN public_leaderboard INTEGER NOT NULL DEFAULT 0;
