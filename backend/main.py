"""FastAPI backend for PrithviTwin — serves seed district data + recompute endpoints."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
from seed_data import KARNATAKA_DISTRICTS, INDIA_STATE_SUMMARIES
from climate_engine import compute_whatif

app = FastAPI(
    title="PrithviTwin API",
    description="AI Digital Twin of India's Climate — ISRO BAH 2026 PS5",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecomputeRequest(BaseModel):
    baseline_name: str
    rainfall_pct_change: float = 0.0  # -80 to +150
    temp_offset: float = 0.0  # -3 to +5
    consecutive_dry_days: int = 0
    soil_moisture: Literal["Low", "Medium", "High"] = "Medium"
    monsoon_active_days: int | None = None
    monsoon_break_days: int | None = None
    compound_mode: bool = False


@app.get("/")
def root():
    return {"status": "online", "system": "PrithviTwin API", "version": "0.1.0"}


@app.get("/districts/karnataka")
def get_karnataka_districts():
    """Returns all Karnataka district baseline seed data."""
    return {"districts": KARNATAKA_DISTRICTS, "count": len(KARNATAKA_DISTRICTS)}


@app.get("/districts/karnataka/{name}")
def get_district(name: str):
    """Returns baseline data for a specific Karnataka district."""
    name_lower = name.lower().replace("-", " ")
    for d in KARNATAKA_DISTRICTS:
        if str(d["name"]).lower() == name_lower:
            return d
    raise HTTPException(status_code=404, detail=f"District '{name}' not found")


@app.get("/states/india")
def get_india_states():
    """Returns India state-level stability summary."""
    return {"states": INDIA_STATE_SUMMARIES, "count": len(INDIA_STATE_SUMMARIES)}


@app.post("/recompute")
def recompute(req: RecomputeRequest):
    """Accepts baseline + overrides, returns full recomputed climate state."""
    baseline = next(
        (
            d
            for d in KARNATAKA_DISTRICTS
            if str(d["name"]).lower() == req.baseline_name.lower()
        ),
        None,
    )
    if baseline is None:
        raise HTTPException(
            status_code=404, detail=f"Baseline district '{req.baseline_name}' not found"
        )

    overrides = {
        "rainfallPctChange": req.rainfall_pct_change,
        "tempOffset": req.temp_offset,
        "consecutiveDryDays": req.consecutive_dry_days,
        "soilMoisture": req.soil_moisture,
        "monsoonActiveDays": (
            req.monsoon_active_days
            if req.monsoon_active_days is not None
            else baseline["activeMonsoonDays"]
        ),
        "monsoonBreakDays": (
            req.monsoon_break_days
            if req.monsoon_break_days is not None
            else baseline["breakMonsoonDays"]
        ),
        "compoundMode": req.compound_mode,
    }
    return compute_whatif(baseline, overrides)
