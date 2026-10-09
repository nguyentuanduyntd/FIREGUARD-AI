import os
import json
from datetime import datetime
from app.core.config import settings

class AILogRepository:
    @staticmethod
    def save_log(task_name: str, request_data: dict, response_data: dict, provider: str):
        log_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "task": task_name,
            "provider": provider,
            "request": request_data,
            "response": response_data
        }
        
        # Save to a daily log file (e.g. logs/ai/ai_logs_2026-07-16.jsonl)
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        file_path = os.path.join(settings.AI_LOGS_DIR, f"ai_logs_{date_str}.jsonl")
        
        try:
            with open(file_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_payload, ensure_ascii=False) + "\n")
        except Exception as e:
            # Fallback to console print if writing to file fails
            import logging
            logging.getLogger("ai_log").error(f"Failed to write AI log to file: {e}")
