# Scenario Selection Game — HTML UI + FastAPI

This is a playable UI for the choices-based simulation engine.

## Quick start

```bash
python -m venv .venv && . .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

uvicorn app:app --reload
# Open http://127.0.0.1:8000/
```

## API

- `POST /api/start` – start a session (send name, segment_key, mood, pay cycle, base_balance)
- `GET /api/offers?session_id=...` – get today's offers
- `POST /api/commit` – commit today's choices (offer_id -> option_code), returns committed events and next day's offers
- `GET /api/state?session_id=...` – current balance and recent history
- `GET /api/meta` – segments + moods for UI dropdowns

## Files

- `app.py` – FastAPI API + static server
- `static/index.html` / `static/style.css` / `static/app.js` – the UI
- `scenario_engine_choices.py` – the engine with daily options
- `scenarios/` – scenario catalog (JSON files)
