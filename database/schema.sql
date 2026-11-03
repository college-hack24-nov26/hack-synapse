-- NeuroGlove SQLite Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_code TEXT UNIQUE NOT NULL,
    affected_hand TEXT DEFAULT 'Right',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calibrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    flex_calibration_json TEXT NOT NULL,
    emg_baseline REAL DEFAULT 20.0,
    emg_active_threshold REAL DEFAULT 45.0,
    fsr_baseline REAL DEFAULT 100.0,
    fsr_contact_threshold REAL DEFAULT 350.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exercise_name TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_repetitions INTEGER DEFAULT 0,
    avg_duration_sec REAL DEFAULT 0.0,
    avg_rom_percentage REAL DEFAULT 0.0,
    consistency_score REAL DEFAULT 0.0,
    active_attempts_count INTEGER DEFAULT 0,
    passive_movements_count INTEGER DEFAULT 0,
    attempt_no_motion_count INTEGER DEFAULT 0,
    uncertain_count INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repetitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    rep_number INTEGER NOT NULL,
    duration_sec REAL NOT NULL,
    peak_rom REAL NOT NULL,
    movement_class TEXT NOT NULL,
    attempt_status TEXT NOT NULL,
    consistency_score REAL DEFAULT 100.0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exercise_name TEXT NOT NULL,
    target_reps INTEGER DEFAULT 15,
    target_rom_pct REAL DEFAULT 75.0,
    target_sessions_per_week INTEGER DEFAULT 3,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed default user if not exists
CREATE TABLE IF NOT EXISTS guided_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    exercise_key TEXT NOT NULL,
    data_source TEXT NOT NULL CHECK(data_source IN ('simulate','mqtt','serial')),
    protocol_version TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    local_day TEXT,
    utc_offset_minutes INTEGER NOT NULL DEFAULT 330,
    calibration_json TEXT NOT NULL,
    active_seconds REAL NOT NULL DEFAULT 0,
    scored_seconds REAL NOT NULL DEFAULT 0,
    weighted_score_sum REAL NOT NULL DEFAULT 0,
    average_pct REAL CHECK(average_pct IS NULL OR average_pct BETWEEN 0 AND 100),
    sample_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS guided_history_idx ON guided_sessions(user_id,exercise_key,data_source,protocol_version,local_day);

-- Seed default user if not exists
INSERT OR IGNORE INTO users (id, name, user_code, affected_hand, notes)
VALUES (1, 'Participant 01', 'NG-P01', 'Right', 'Stroke rehabilitation monitoring protocol');
