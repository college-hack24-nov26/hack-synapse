"""
NeuroGlove CSV Exporter
Exports clinical session summaries and repetition time-series data to CSV format.
"""

import csv
import io
from typing import Dict, Any, List

def export_session_reps_csv(session_data: Dict[str, Any]) -> str:
    """Exports repetition records for a session into a CSV formatted string."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header metadata
    writer.writerow(["# NeuroGlove Session Export"])
    writer.writerow(["Session ID", session_data.get("id")])
    writer.writerow(["Patient Name", session_data.get("user_name", "Anonymous")])
    writer.writerow(["User Code", session_data.get("user_code", "N/A")])
    writer.writerow(["Affected Hand", session_data.get("affected_hand", "Right")])
    writer.writerow(["Exercise", session_data.get("exercise_name")])
    writer.writerow(["Start Time", session_data.get("start_time")])
    writer.writerow(["End Time", session_data.get("end_time")])
    writer.writerow(["Total Reps", session_data.get("total_repetitions")])
    writer.writerow(["Avg ROM (%)", session_data.get("avg_rom_percentage")])
    writer.writerow(["Avg Duration (s)", session_data.get("avg_duration_sec")])
    writer.writerow(["Consistency Score", session_data.get("consistency_score")])
    writer.writerow([])

    # Table columns
    writer.writerow([
        "Rep Number", "Duration (s)", "Peak ROM (%)", "Classification",
        "Attempt Status", "Consistency Score", "Timestamp"
    ])

    reps = session_data.get("repetitions", [])
    for rep in reps:
        writer.writerow([
            rep.get("rep_number"),
            rep.get("duration_sec"),
            rep.get("peak_rom"),
            rep.get("movement_class"),
            rep.get("attempt_status"),
            rep.get("consistency_score"),
            rep.get("timestamp")
        ])

    return output.getvalue()
