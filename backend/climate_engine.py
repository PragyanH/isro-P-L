"""
climate_engine.py
Python port of lib/climateEngine.ts
Single source of truth for server-side recompute validation.
"""

from typing import Literal

SoilMoisture = Literal["Low", "Medium", "High"]

WEIGHTS = {
    "rainfallAnomaly": 0.25,
    "tempAnomaly": 0.15,
    "floodRisk": 0.20,
    "droughtRisk": 0.20,
    "monsoonSpell": 0.12,
    "confidence": 0.08,
}


def z_score(value: float, mean: float, std_dev: float) -> float:
    if std_dev == 0:
        return 0.0
    return (value - mean) / std_dev


def compute_spi(rainfall: float, baseline: float, std_dev: float) -> float:
    return z_score(rainfall, baseline, std_dev)


def compute_monsoon_spell_status(
    active_days: int,
    break_days: int,
    climatological_active_mean: float = 12.0,
    climatological_break_mean: float = 8.0,
) -> dict:
    """SHARED FUNCTION — do not reimplement elsewhere."""
    total = active_days + break_days
    if total == 0:
        return {
            "phase": "Normal",
            "activeStreakDays": 0,
            "breakStreakDays": 0,
            "deviation": 0,
            "label": "Normal — no significant spell",
        }

    active_ratio = active_days / max(total, 1)
    deviation = active_days - climatological_active_mean

    if break_days >= 5 and active_ratio < 0.35:
        phase = "Break"
        label = f"Break spell — {break_days}d dry (climatological mean: {int(climatological_break_mean)}d)"
    elif active_days >= 7 and active_ratio > 0.6:
        phase = "Active"
        label = f"Active spell — {active_days}d wet (climatological mean: {int(climatological_active_mean)}d)"
    elif abs(deviation) > 3:
        phase = "Transition"
        sign = "+" if deviation > 0 else ""
        label = f"Transitioning — {sign}{int(deviation)}d from mean"
    else:
        phase = "Normal"
        label = "Normal — within climatological bounds"

    return {
        "phase": phase,
        "activeStreakDays": active_days,
        "breakStreakDays": break_days,
        "deviation": deviation,
        "label": label,
    }


def compute_flood_risk_index(
    rainfall_anomaly_z: float,
    active_monsoon_days: int,
    soil_moisture: SoilMoisture,
    base_flood_risk: float,
) -> float:
    soil_factor = {"High": 1.3, "Medium": 1.0, "Low": 0.7}[soil_moisture]
    monsoon_factor = min(active_monsoon_days / 10, 1.5)
    anomaly_factor = (1 + rainfall_anomaly_z * 0.3) if rainfall_anomaly_z > 0 else 1.0
    raw = base_flood_risk * anomaly_factor * soil_factor * monsoon_factor
    return min(max(raw, 0.0), 1.0)


def compute_drought_risk_index(
    spi: float,
    consecutive_dry_days: int,
    soil_moisture: SoilMoisture,
    base_drought_risk: float,
) -> float:
    spi_penalty = min(abs(spi) * 0.25, 0.5) if spi < 0 else 0.0
    dry_day_factor = min(consecutive_dry_days / 15, 1.0)
    soil_factor = {"Low": 1.4, "Medium": 1.0, "High": 0.6}[soil_moisture]
    raw = (base_drought_risk + spi_penalty) * soil_factor * (1 + dry_day_factor * 0.4)
    return min(max(raw, 0.0), 1.0)


def compute_stability_score(
    rainfall_anomaly_z: float,
    temp_anomaly_z: float,
    flood_risk_index: float,
    drought_risk_index: float,
    monsoon_spell: dict,
    confidence: float,
) -> dict:
    rainfall_penalty = min(abs(rainfall_anomaly_z) / 3, 1.0)
    temp_penalty = min(abs(temp_anomaly_z) / 3, 1.0)

    phase = monsoon_spell["phase"]
    deviation = monsoon_spell.get("deviation", 0)
    monsoon_penalty = (
        0.7
        if phase == "Break"
        else (
            0.5
            if (phase == "Active" and deviation > 5)
            else 0.35 if phase == "Transition" else 0.1
        )
    )

    confidence_bonus = confidence * 0.8

    instability = (
        WEIGHTS["rainfallAnomaly"] * rainfall_penalty
        + WEIGHTS["tempAnomaly"] * temp_penalty
        + WEIGHTS["floodRisk"] * flood_risk_index
        + WEIGHTS["droughtRisk"] * drought_risk_index
        + WEIGHTS["monsoonSpell"] * monsoon_penalty
    )

    raw_score = (1 - instability) * 100 + WEIGHTS["confidence"] * confidence_bonus * 10
    score = min(max(round(raw_score), 0), 100)

    return {
        "score": score,
        "components": {
            "rainfallContribution": round(
                WEIGHTS["rainfallAnomaly"] * rainfall_penalty * 100
            ),
            "tempContribution": round(WEIGHTS["tempAnomaly"] * temp_penalty * 100),
            "floodContribution": round(WEIGHTS["floodRisk"] * flood_risk_index * 100),
            "droughtContribution": round(
                WEIGHTS["droughtRisk"] * drought_risk_index * 100
            ),
            "monsoonContribution": round(
                WEIGHTS["monsoonSpell"] * monsoon_penalty * 100
            ),
            "confidenceContribution": round(
                WEIGHTS["confidence"] * confidence_bonus * 10
            ),
        },
    }


def get_score_band(score: int) -> dict:
    if score >= 80:
        return {"band": "Stable", "hex": "#00E5FF"}
    if score >= 60:
        return {"band": "Moderate", "hex": "#FFD23F"}
    if score >= 40:
        return {"band": "Elevated Risk", "hex": "#FF6B35"}
    return {"band": "Critical", "hex": "#FF3366"}


def get_advisory_tier(score: int) -> str:
    if score >= 80:
        return "Normal"
    if score >= 65:
        return "Watch"
    if score >= 50:
        return "Advisory"
    if score >= 35:
        return "Alert"
    return "Critical"


def compute_whatif(baseline: dict, overrides: dict) -> dict:
    rainfall = baseline["baselineRainfall"] * (1 + overrides["rainfallPctChange"] / 100)
    temp = baseline["baselineTemp"] + overrides["tempOffset"]

    rain_z = z_score(rainfall, baseline["baselineRainfall"], baseline["rainfallStdDev"])
    temp_z = z_score(temp, baseline["baselineTemp"], baseline["tempStdDev"])
    spi = compute_spi(
        rainfall, baseline["baselineRainfall"], baseline["rainfallStdDev"]
    )

    flood_risk = compute_flood_risk_index(
        rain_z,
        overrides["monsoonActiveDays"],
        overrides["soilMoisture"],
        baseline["floodRiskBase"],
    )
    drought_risk = compute_drought_risk_index(
        spi,
        overrides["consecutiveDryDays"],
        overrides["soilMoisture"],
        baseline["droughtRiskBase"],
    )
    spell = compute_monsoon_spell_status(
        overrides["monsoonActiveDays"],
        overrides["monsoonBreakDays"],
        baseline["activeMonsoonDays"],
        baseline["breakMonsoonDays"],
    )

    score_data = compute_stability_score(
        rain_z,
        temp_z,
        flood_risk,
        drought_risk,
        spell,
        baseline["predictionConfidence"],
    )
    score = score_data["score"]

    return {
        "rainfall": round(rainfall, 2),
        "temp": round(temp, 2),
        "rainfallAnomalyZ": round(rain_z, 3),
        "tempAnomalyZ": round(temp_z, 3),
        "spi": round(spi, 3),
        "floodRiskIndex": round(flood_risk, 3),
        "droughtRiskIndex": round(drought_risk, 3),
        "monsoonSpellStatus": spell,
        "stabilityScore": score,
        "scoreBand": get_score_band(score)["band"],
        "scoreComponents": score_data["components"],
        "advisoryTier": get_advisory_tier(score),
    }
