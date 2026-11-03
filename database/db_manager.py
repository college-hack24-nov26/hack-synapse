"""
Database Manager for NeuroGlove SQLite Database
Provides thread-safe access to sessions, repetitions, calibration, and patient goals.
"""

import sqlite3
import json
import logging
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import config

logger = logging.getLogger("NeuroGlove.Database")

class DatabaseManager:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or config.DB_PATH
        self.init_db()

    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def init_db(self):
        schema_path = config.BASE_DIR / "database" / "schema.sql"
        try:
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            with self.get_connection() as conn:
                conn.executescript(schema_sql)
                # Provenance stays with each record in the single application database.
                for table in ('guided_sessions', 'sessions', 'game_sessions_v1'):
                    fields = {row[1] for row in conn.execute(f'PRAGMA table_info({table})')}
                    if fields and 'sample' not in fields:
                        conn.execute(f'ALTER TABLE {table} ADD COLUMN sample INTEGER NOT NULL DEFAULT 0 CHECK(sample IN (0,1))')
                conn.execute("CREATE TRIGGER IF NOT EXISTS flag_generated_guided AFTER INSERT ON guided_sessions WHEN NEW.data_source='simulate' BEGIN UPDATE guided_sessions SET sample=1 WHERE id=NEW.id; END")
                if conn.execute("SELECT 1 FROM sqlite_master WHERE name='game_sessions_v1'").fetchone():
                    conn.execute("CREATE TRIGGER IF NOT EXISTS flag_generated_games AFTER INSERT ON game_sessions_v1 WHEN NEW.source IN ('simulate','manual') BEGIN UPDATE game_sessions_v1 SET sample=1 WHERE id=NEW.id; END")
                conn.execute("UPDATE guided_sessions SET sample=1 WHERE data_source='simulate'")
                conn.execute("UPDATE sessions SET sample=1 WHERE notes LIKE '%dashboard-preview-history-v1%' OR exercise_name LIKE 'Simulated%'")
                if conn.execute("SELECT 1 FROM sqlite_master WHERE name='game_sessions_v1'").fetchone():
                    conn.execute("UPDATE game_sessions_v1 SET sample=1 WHERE source IN ('simulate','manual')")
                guided_columns={row[1] for row in conn.execute('PRAGMA table_info(guided_sessions)')}
                for column in ('attempt_count','completed_movements'):
                    if column not in guided_columns:conn.execute(f'ALTER TABLE guided_sessions ADD COLUMN {column} INTEGER NOT NULL DEFAULT 0')
                columns={row[1] for row in conn.execute('PRAGMA table_info(calibrations)')}
                if 'fsr_max_raw' not in columns:conn.execute('ALTER TABLE calibrations ADD COLUMN fsr_max_raw REAL NOT NULL DEFAULT 1300')
                conn.commit()
                original=conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='guided_sessions'").fetchone()[0]
                if "'serial'" not in original:
                    backup=sqlite3.connect(str(self.db_path)+'.before-serial.db')
                    conn.backup(backup);backup.close()
                    migrated=original.replace('CREATE TABLE guided_sessions','CREATE TABLE guided_sessions_serial_migration',1).replace("'simulate','mqtt'","'simulate','mqtt','serial'")
                    names=','.join('"'+row[1]+'"' for row in conn.execute('PRAGMA table_info(guided_sessions)'))
                    with conn:
                        conn.execute(migrated)
                        conn.execute(f'INSERT INTO guided_sessions_serial_migration ({names}) SELECT {names} FROM guided_sessions')
                        conn.execute('DROP TABLE guided_sessions')
                        conn.execute('ALTER TABLE guided_sessions_serial_migration RENAME TO guided_sessions')
                        conn.execute('CREATE INDEX guided_history_idx ON guided_sessions(user_id,exercise_key,data_source,protocol_version,local_day)')
                # Ensure default calibration exists for user 1
                cur = conn.cursor()
                cur.execute("SELECT id FROM calibrations WHERE user_id = 1")
                if not cur.fetchone():
                    calib_json = json.dumps(config.DEFAULT_CALIBRATION["flex"])
                    emg_base = config.DEFAULT_CALIBRATION["emg"]["baseline_envelope"]
                    emg_thresh = config.DEFAULT_CALIBRATION["emg"]["active_threshold"]
                    fsr_base = config.DEFAULT_CALIBRATION["fsr"]["baseline_raw"]
                    fsr_thresh = config.DEFAULT_CALIBRATION["fsr"]["contact_threshold"]
                    cur.execute(
                        """
                        INSERT INTO calibrations (user_id, flex_calibration_json, emg_baseline, emg_active_threshold, fsr_baseline, fsr_contact_threshold)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (1, calib_json, emg_base, emg_thresh, fsr_base, fsr_thresh)
                    )
                # Ensure default goals exist for user 1
                cur.execute("SELECT id FROM goals WHERE user_id = 1")
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO goals (user_id, exercise_name, target_reps, target_rom_pct, target_sessions_per_week)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (1, "Hand Flexion/Extension", 15, 75.0, 3)
                    )
                conn.commit()
            logger.info(f"Database initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise

    # Calibration methods
    def get_calibration(self, user_id: int = 1) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM calibrations WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
            if row:
                return {
                    "flex": json.loads(row["flex_calibration_json"]),
                    "emg_baseline": row["emg_baseline"],
                    "emg_active_threshold": row["emg_active_threshold"],
                    "fsr_baseline": row["fsr_baseline"],
                    "fsr_contact_threshold": row["fsr_contact_threshold"],
                    "fsr_max_raw":row["fsr_max_raw"]
                }
            return config.DEFAULT_CALIBRATION

    def save_calibration(self, user_id: int, flex_calib: dict, emg_base: float, emg_thresh: float, fsr_base: float, fsr_thresh: float, fsr_max_raw: float = 1300):
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO calibrations (user_id, flex_calibration_json, emg_baseline, emg_active_threshold, fsr_baseline, fsr_contact_threshold, fsr_max_raw)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, json.dumps(flex_calib), emg_base, emg_thresh, fsr_base, fsr_thresh,fsr_max_raw)
            )
            conn.commit()

    # Session methods
    def start_session(self, user_id: int, exercise_name: str, notes: str = "") -> int:
        start_time = datetime.now().isoformat()
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO sessions (user_id, exercise_name, start_time, notes)
                VALUES (?, ?, ?, ?)
                """,
                (user_id, exercise_name, start_time, notes)
            )
            conn.commit()
            return cur.lastrowid

    def end_session(self, session_id: int, total_reps: int, avg_dur: float, avg_rom: float,
                    consistency: float, active_attempts: int, passive: int, attempt_no_motion: int, uncertain: int, notes: str = ""):
        end_time = datetime.now().isoformat()
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE sessions
                SET end_time = ?,
                    total_repetitions = ?,
                    avg_duration_sec = ?,
                    avg_rom_percentage = ?,
                    consistency_score = ?,
                    active_attempts_count = ?,
                    passive_movements_count = ?,
                    attempt_no_motion_count = ?,
                    uncertain_count = ?,
                    notes = CASE WHEN ? != '' THEN ? ELSE notes END
                WHERE id = ?
                """,
                (end_time, total_reps, avg_dur, avg_rom, consistency, active_attempts, passive, attempt_no_motion, uncertain, notes, notes, session_id)
            )
            conn.commit()

    def log_repetition(self, session_id: int, rep_number: int, duration_sec: float, peak_rom: float,
                       movement_class: str, attempt_status: str, consistency_score: float = 100.0) -> int:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO repetitions (session_id, rep_number, duration_sec, peak_rom, movement_class, attempt_status, consistency_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (session_id, rep_number, duration_sec, peak_rom, movement_class, attempt_status, consistency_score)
            )
            conn.commit()
            return cur.lastrowid

    def get_session(self, session_id: int) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT s.*, u.name as user_name, u.user_code, u.affected_hand
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = ?
            """, (session_id,))
            row = cur.fetchone()
            if not row:
                return None
            session_data = dict(row)
            
            cur.execute("SELECT * FROM repetitions WHERE session_id = ? ORDER BY rep_number ASC", (session_id,))
            reps = [dict(r) for r in cur.fetchall()]
            session_data["repetitions"] = reps
            return session_data

    def get_all_sessions(self, user_id: Optional[int] = None, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            if user_id:
                cur.execute("""
                    SELECT s.*, u.name as user_name
                    FROM sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.user_id = ?
                    ORDER BY s.id DESC
                    LIMIT ?
                """, (user_id, limit))
            else:
                cur.execute("""
                    SELECT s.*, u.name as user_name
                    FROM sessions s
                    JOIN users u ON s.user_id = u.id
                    ORDER BY s.id DESC
                    LIMIT ?
                """, (limit,))
            return [dict(r) for r in cur.fetchall()]

    def get_goals(self, user_id: int = 1) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM goals WHERE user_id = ? AND is_active = 1", (user_id,))
            return [dict(r) for r in cur.fetchall()]

    def update_goal(self, goal_id: int, target_reps: int, target_rom: float, target_freq: int):
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE goals
                SET target_reps = ?, target_rom_pct = ?, target_sessions_per_week = ?
                WHERE id = ?
                """,
                (target_reps, target_rom, target_freq, goal_id)
            )
            conn.commit()

# Global default instance
db = DatabaseManager()
