# PrithviTwin Backend

FastAPI backend serving seed district data and recompute endpoints.

## Setup & Run

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/districts/karnataka` | All Karnataka district baselines |
| GET | `/districts/karnataka/{name}` | Single district baseline |
| GET | `/states/india` | India state-level summaries |
| POST | `/recompute` | Parametric recompute from baseline + overrides |

## Recompute Example

```bash
curl -X POST http://localhost:8000/recompute \
  -H "Content-Type: application/json" \
  -d '{
    "baseline_name": "Belagavi",
    "rainfall_pct_change": 167,
    "temp_offset": -1.5,
    "consecutive_dry_days": 2,
    "soil_moisture": "High",
    "monsoon_active_days": 18,
    "monsoon_break_days": 2,
    "compound_mode": true
  }'
```

## Interactive Docs
Visit [http://localhost:8000/docs](http://localhost:8000/docs) for Swagger UI.
