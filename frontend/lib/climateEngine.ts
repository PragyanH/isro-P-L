// ─── Climate Engine ───────────────────────────────────────────────────────────
// All shared deterministic math for PrithviTwin.
// Single source of truth — used by simulator, XAI page, and Forensic Report.
// Baseline forecast values can be seeded; recompute logic here is real math.

export interface DistrictBaseline {
  name: string;
  baselineRainfall: number;    // mm/month
  baselineTemp: number;        // °C
  rainfallStdDev: number;      // for z-score
  tempStdDev: number;
  floodRiskBase: number;       // 0–1
  droughtRiskBase: number;     // 0–1
  activeMonsoonDays: number;
  breakMonsoonDays: number;
  predictionConfidence: number; // 0–1
}

export interface WhatIfOverrides {
  rainfallPctChange: number;    // -80 to +150 (%)
  tempOffset: number;           // -3 to +5 (°C)
  consecutiveDryDays: number;
  soilMoisture: 'Low' | 'Medium' | 'High';
  monsoonActiveDays: number;
  monsoonBreakDays: number;
  compoundMode: boolean;
}

export interface ClimateState {
  rainfall: number;
  temp: number;
  rainfallAnomalyZ: number;
  tempAnomalyZ: number;
  spi: number;                  // Standardised Precipitation Index
  floodRiskIndex: number;       // 0–1
  droughtRiskIndex: number;     // 0–1
  monsoonSpellStatus: MonsoonSpellStatus;
  stabilityScore: number;       // 0–100
  scoreBand: ScoreBand;
  scoreComponents: ScoreComponents;
  advisoryTier: AdvisoryTier;
}

export interface ScoreComponents {
  rainfallContribution: number;
  tempContribution: number;
  floodContribution: number;
  droughtContribution: number;
  monsoonContribution: number;
  confidenceContribution: number;
}

export interface MonsoonSpellStatus {
  phase: 'Active' | 'Break' | 'Transition' | 'Normal';
  activeStreakDays: number;
  breakStreakDays: number;
  deviation: number;            // days from climatological mean
  label: string;
}

export type ScoreBand = 'Stable' | 'Moderate' | 'Elevated Risk' | 'Critical';
export type AdvisoryTier = 'Normal' | 'Watch' | 'Advisory' | 'Alert' | 'Critical';

// ─── Weights for Stability Score ─────────────────────────────────────────────
const WEIGHTS = {
  rainfallAnomaly: 0.25,
  tempAnomaly:     0.15,
  floodRisk:       0.20,
  droughtRisk:     0.20,
  monsoonSpell:    0.12,
  confidence:      0.08,
};

// ─── Monsoon Spell Tracker (SHARED FUNCTION — do not reimplement elsewhere) ──
// Based on Subrahmanyam et al. (2023): active/break spell classification.
export function computeMonsoonSpellStatus(
  activeDays: number,
  breakDays: number,
  climatologicalActiveMean = 12,
  climatologicalBreakMean = 8
): MonsoonSpellStatus {
  const totalDays = activeDays + breakDays;
  if (totalDays === 0) {
    return { phase: 'Normal', activeStreakDays: 0, breakStreakDays: 0, deviation: 0, label: 'Normal — no significant spell' };
  }

  const activeRatio = activeDays / Math.max(totalDays, 1);
  const deviation = activeDays - climatologicalActiveMean;

  let phase: MonsoonSpellStatus['phase'];
  let label: string;

  if (breakDays >= 5 && activeRatio < 0.35) {
    phase = 'Break';
    label = `Break spell — ${breakDays}d dry (climatological mean: ${climatologicalBreakMean}d)`;
  } else if (activeDays >= 7 && activeRatio > 0.6) {
    phase = 'Active';
    label = `Active spell — ${activeDays}d wet (climatological mean: ${climatologicalActiveMean}d)`;
  } else if (Math.abs(deviation) > 3) {
    phase = 'Transition';
    label = `Transitioning — ${deviation > 0 ? '+' : ''}${deviation}d from mean`;
  } else {
    phase = 'Normal';
    label = `Normal — within climatological bounds`;
  }

  return { phase, activeStreakDays: activeDays, breakStreakDays: breakDays, deviation, label };
}

// ─── Z-score ─────────────────────────────────────────────────────────────────
function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// ─── SPI (Standardised Precipitation Index) ──────────────────────────────────
// Simplified SPI proxy: positive = wetter than normal, negative = drier
export function computeSPI(rainfall: number, baseline: number, stdDev: number): number {
  return zScore(rainfall, baseline, stdDev);
}

// ─── Flood Risk Index ─────────────────────────────────────────────────────────
// 0 = no risk, 1 = maximum risk
export function computeFloodRiskIndex(
  rainfallAnomalyZ: number,
  activeMonsoonDays: number,
  soilMoisture: 'Low' | 'Medium' | 'High',
  baseFloodRisk: number
): number {
  const soilFactor = soilMoisture === 'High' ? 1.3 : soilMoisture === 'Medium' ? 1.0 : 0.7;
  const monsoonFactor = Math.min(activeMonsoonDays / 10, 1.5);
  const anomalyFactor = rainfallAnomalyZ > 0 ? 1 + rainfallAnomalyZ * 0.3 : 1;
  const raw = baseFloodRisk * anomalyFactor * soilFactor * monsoonFactor;
  return Math.min(Math.max(raw, 0), 1);
}

// ─── Drought Risk Index ───────────────────────────────────────────────────────
// 0 = no risk, 1 = maximum risk
export function computeDroughtRiskIndex(
  spi: number,
  consecutiveDryDays: number,
  soilMoisture: 'Low' | 'Medium' | 'High',
  baseDroughtRisk: number
): number {
  const spiPenalty = spi < 0 ? Math.min(Math.abs(spi) * 0.25, 0.5) : 0;
  const dryDayFactor = Math.min(consecutiveDryDays / 15, 1.0);
  const soilFactor = soilMoisture === 'Low' ? 1.4 : soilMoisture === 'Medium' ? 1.0 : 0.6;
  const raw = (baseDroughtRisk + spiPenalty) * soilFactor * (1 + dryDayFactor * 0.4);
  return Math.min(Math.max(raw, 0), 1);
}

// ─── Stability Score ──────────────────────────────────────────────────────────
// Returns 0–100. Weighted formula over all climate components.
export function computeStabilityScore(
  rainfallAnomalyZ: number,
  tempAnomalyZ: number,
  floodRiskIndex: number,
  droughtRiskIndex: number,
  monsoonSpell: MonsoonSpellStatus,
  confidence: number
): { score: number; components: ScoreComponents } {
  // Map anomaly z-scores to 0–1 penalty (higher z = more unstable)
  const rainfallPenalty = Math.min(Math.abs(rainfallAnomalyZ) / 3, 1);
  const tempPenalty     = Math.min(Math.abs(tempAnomalyZ) / 3, 1);

  // Monsoon penalty: Break/Transition spells reduce score
  const monsoonPenalty = monsoonSpell.phase === 'Break' ? 0.7
    : monsoonSpell.phase === 'Active' && monsoonSpell.deviation > 5 ? 0.5
    : monsoonSpell.phase === 'Transition' ? 0.35
    : 0.1;

  // Confidence bonus (higher confidence → more reliable, slightly boosts score)
  const confidenceBonus = confidence * 0.8;

  const instability =
    WEIGHTS.rainfallAnomaly * rainfallPenalty +
    WEIGHTS.tempAnomaly     * tempPenalty +
    WEIGHTS.floodRisk       * floodRiskIndex +
    WEIGHTS.droughtRisk     * droughtRiskIndex +
    WEIGHTS.monsoonSpell    * monsoonPenalty;

  const rawScore = (1 - instability) * 100 + WEIGHTS.confidence * confidenceBonus * 10;
  const score = Math.min(Math.max(Math.round(rawScore), 0), 100);

  const components: ScoreComponents = {
    rainfallContribution: Math.round(WEIGHTS.rainfallAnomaly * rainfallPenalty * 100),
    tempContribution:     Math.round(WEIGHTS.tempAnomaly * tempPenalty * 100),
    floodContribution:    Math.round(WEIGHTS.floodRisk * floodRiskIndex * 100),
    droughtContribution:  Math.round(WEIGHTS.droughtRisk * droughtRiskIndex * 100),
    monsoonContribution:  Math.round(WEIGHTS.monsoonSpell * monsoonPenalty * 100),
    confidenceContribution: Math.round(WEIGHTS.confidence * confidenceBonus * 10),
  };

  return { score, components };
}

// ─── Score Band ───────────────────────────────────────────────────────────────
export function getScoreBand(score: number): { band: ScoreBand; color: string; hex: string } {
  if (score >= 80) return { band: 'Stable',        color: 'score-stable',   hex: '#00E5FF' };
  if (score >= 60) return { band: 'Moderate',      color: 'score-moderate', hex: '#FFD23F' };
  if (score >= 40) return { band: 'Elevated Risk', color: 'score-elevated', hex: '#FF6B35' };
  return               { band: 'Critical',        color: 'score-critical', hex: '#FF3366' };
}

// ─── Advisory Tier ────────────────────────────────────────────────────────────
export function getAdvisoryTier(score: number): AdvisoryTier {
  if (score >= 80) return 'Normal';
  if (score >= 65) return 'Watch';
  if (score >= 50) return 'Advisory';
  if (score >= 35) return 'Alert';
  return 'Critical';
}

// ─── Full What-If Recompute ───────────────────────────────────────────────────
// Called on every simulator input change. Instant parametric recompute.
export function computeWhatIf(
  baseline: DistrictBaseline,
  overrides: WhatIfOverrides
): ClimateState {
  // Apply overrides to baseline values
  const rainfall = baseline.baselineRainfall * (1 + overrides.rainfallPctChange / 100);
  const temp     = baseline.baselineTemp + overrides.tempOffset;

  const rainfallAnomalyZ = zScore(rainfall, baseline.baselineRainfall, baseline.rainfallStdDev);
  const tempAnomalyZ     = zScore(temp, baseline.baselineTemp, baseline.tempStdDev);
  const spi              = computeSPI(rainfall, baseline.baselineRainfall, baseline.rainfallStdDev);

  const floodRiskIndex  = computeFloodRiskIndex(
    rainfallAnomalyZ,
    overrides.monsoonActiveDays,
    overrides.soilMoisture,
    baseline.floodRiskBase
  );
  const droughtRiskIndex = computeDroughtRiskIndex(
    spi,
    overrides.consecutiveDryDays,
    overrides.soilMoisture,
    baseline.droughtRiskBase
  );

  const monsoonSpellStatus = computeMonsoonSpellStatus(
    overrides.monsoonActiveDays,
    overrides.monsoonBreakDays,
    baseline.activeMonsoonDays,
    baseline.breakMonsoonDays
  );

  const { score, components } = computeStabilityScore(
    rainfallAnomalyZ,
    tempAnomalyZ,
    floodRiskIndex,
    droughtRiskIndex,
    monsoonSpellStatus,
    baseline.predictionConfidence
  );

  const scoreBand     = getScoreBand(score).band;
  const advisoryTier  = getAdvisoryTier(score);

  return {
    rainfall,
    temp,
    rainfallAnomalyZ,
    tempAnomalyZ,
    spi,
    floodRiskIndex,
    droughtRiskIndex,
    monsoonSpellStatus,
    stabilityScore: score,
    scoreBand,
    scoreComponents: components,
    advisoryTier,
  };
}

// ─── Default overrides (baseline = no change) ────────────────────────────────
export function defaultOverrides(baseline: DistrictBaseline): WhatIfOverrides {
  return {
    rainfallPctChange:  0,
    tempOffset:         0,
    consecutiveDryDays: 0,
    soilMoisture:       'Medium',
    monsoonActiveDays:  baseline.activeMonsoonDays,
    monsoonBreakDays:   baseline.breakMonsoonDays,
    compoundMode:       false,
  };
}
