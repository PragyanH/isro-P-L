'use client';

import React, { useState, useMemo } from 'react';
import { karnatakaDistricts } from '@/lib/seedData';
import { computeWhatIf, defaultOverrides } from '@/lib/climateEngine';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';
import DataRow from '@/components/DataRow';

const MODEL_CARDS = [
  {
    name: 'Isolation Forest',
    emoji: '🌲',
    color: '#22c55e',
    badgeVariant: 'stable',
    tag: 'Anomaly Gate',
    description:
      'First-stage anomaly detector. Runs on every district every data update — fast and cheap. Acts as a pre-filter so heavy ensemble models only run when something is actually anomalous.',
    technical:
      'Ensemble of isolation trees. Anomalies = short average path length. Contamination threshold: ~5% of historical states. Output: 0 (normal) or 1 (anomaly flagged).',
  },
  {
    name: 'LSTM / GRU — Model A',
    emoji: '🔄',
    color: '#22c55e',
    badgeVariant: 'stable',
    tag: 'Sequence Trigger',
    description:
      'Triggered only when Isolation Forest flags an anomaly. Deep learning model trained on 30-year IMD rainfall sequences. Captures non-linear temporal dependencies across monsoon time-steps.',
    technical:
      '14-day rolling input window. Bidirectional GRU + LSTM layers. Output: 7-day forecast + probability + 80% confidence band.',
  },
  {
    name: 'Physics-Informed Baseline — Model B',
    emoji: '📐',
    color: '#f59e0b',
    badgeVariant: 'moderate',
    tag: 'Sanity Anchor',
    description:
      'Climatological mean + ENSO/monsoon-index regression. Simple but scientifically grounded. If LSTM diverges from this baseline by more than 2σ, that divergence is itself flagged as a signal.',
    technical:
      'ENSO MEI index + IOD + monsoon onset regression. Expected rainfall ± σ. Divergence from LSTM > 2σ → Model Agreement Index decreases.',
  },
  {
    name: 'Analog / Persistence — Model C',
    emoji: '📚',
    color: '#a855f7',
    badgeVariant: 'violet',
    tag: 'Pattern Fallback',
    description:
      'Searches 122 years of IMD data for the 5 most similar historical weather patterns and averages their outcomes. A technique trusted by operational meteorologists worldwide.',
    technical:
      'Euclidean distance on 14-day normalized rainfall+temp windows. Top 5 analogs weighted by similarity. Outputs analog forecast that feeds ensemble.',
  },
  {
    name: 'JSD Distribution Shift',
    emoji: '📊',
    color: '#94a3b8',
    badgeVariant: 'dim',
    tag: 'Distribution Shift',
    description:
      'Jensen-Shannon Divergence. Catches gradual distributional shifts that point anomaly detectors miss. Rainfall at normal mean but becoming erratic — JSD catches this before the mean shifts.',
    technical:
      'JSD(P,Q) = 0.5·KL(P‖M) + 0.5·KL(Q‖M), M = 0.5(P+Q). Applied to rolling 30-day CDF vs historical CDF for same calendar period. JSD > 0.15 → advisory elevation.',
  },
  {
    name: 'Monsoon Spell Tracker',
    emoji: '🌀',
    color: '#a855f7',
    badgeVariant: 'violet',
    tag: 'Spell Classification',
    description:
      'Based on Subrahmanyam et al. (2023, Atmospheric Research). Classifies monsoon phase as Active, Break, Transition, or Normal. Accounts for long-term structural ISM epoch shifts.',
    technical:
      'Active: ≥7 wet days + >60% activity ratio. Break: ≥5 dry days + <35% ratio. Spell-1 declining −0.4mm/decade over 122yr. Feeds Stability Score at 12% weight.',
  },
];

export default function XaiPage() {
  const [simulated, setSimulated] = useState(false);

  const exampleDistrict = useMemo(() => {
    return karnatakaDistricts.find((d) => d.name === 'Chamarajanagara')!;
  }, []);

  const beforeState = useMemo(() => {
    return computeWhatIf(exampleDistrict, defaultOverrides(exampleDistrict));
  }, [exampleDistrict]);

  const afterState = useMemo(() => {
    return computeWhatIf(exampleDistrict, {
      ...defaultOverrides(exampleDistrict),
      rainfallPctChange: -60,
      tempOffset: 4.2,
      consecutiveDryDays: 14,
      soilMoisture: 'Low',
    });
  }, [exampleDistrict]);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'XAI / Methodology' }]} />
      <div className="page-content fade-in">
        {/* SECTION 1: Pipeline Cascade */}
        <GlassPanel>
          <div className="section-label">
            Full AI Pipeline — Raw data to Climate Stability Score
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
              margin: '12px 0',
            }}
          >
            {/* Raw Inputs */}
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid #1e2536',
                background: '#1e2536',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              Raw Inputs
              <br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>IMD · INSAT</span>
            </div>

            <span style={{ color: '#1e2536', fontSize: 16 }}>→</span>

            {/* Isolation Forest */}
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid rgba(34,197,94,0.3)',
                background: 'rgba(34,197,94,0.08)',
                color: '#22c55e',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              Isolation Forest
              <br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Anomaly Gate</span>
            </div>

            <span style={{ color: '#1e2536', fontSize: 16 }}>→</span>

            {/* Branch box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                fontSize: 9,
                color: '#475569',
              }}
            >
              <div
                style={{
                  padding: '2px 6px',
                  border: '1px solid #1e2536',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                IF = 0 → skip to JSD
              </div>
              <div
                style={{
                  padding: '2px 6px',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 4,
                  color: '#22c55e',
                  whiteSpace: 'nowrap',
                }}
              >
                IF = 1 → trigger models
              </div>
            </div>

            <span style={{ color: '#1e2536', fontSize: 16 }}>→</span>

            {/* 3 stacked models */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 500,
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(34,197,94,0.08)',
                  color: '#22c55e',
                  whiteSpace: 'nowrap',
                }}
              >
                Model A: LSTM/GRU
              </div>
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 500,
                  border: '1px solid rgba(245,158,11,0.3)',
                  background: 'rgba(245,158,11,0.08)',
                  color: '#f59e0b',
                  whiteSpace: 'nowrap',
                }}
              >
                Model B: Physics-Informed
              </div>
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 500,
                  border: '1px solid rgba(168,85,247,0.3)',
                  background: 'rgba(168,85,247,0.08)',
                  color: '#a855f7',
                  whiteSpace: 'nowrap',
                }}
              >
                Model C: Analog
              </div>
            </div>

            <span style={{ color: '#1e2536', fontSize: 16 }}>→</span>

            {/* Ensemble + Agreement */}
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.08)',
                color: '#a855f7',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              Ensemble + Agreement
              <br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Consensus Logic</span>
            </div>

            <span style={{ color: '#1e2536', fontSize: 16 }}>→</span>

            {/* JSD + Spell Tracker */}
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid #1e2536',
                background: '#1e2536',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              JSD + Spell Tracker
              <br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Distribution shift</span>
            </div>

            <span style={{ color: '#1e2536', fontSize: 16 }}>→</span>

            {/* Stability Score 0–100 */}
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid rgba(34,197,94,0.5)',
                background: 'rgba(34,197,94,0.12)',
                color: '#22c55e',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              Stability Score 0–100
              <br />
              <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 400 }}>Final Metric</span>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
            If Isolation Forest detects no anomaly (output = 0), only JSD and Spell Tracker run —
            the 3 ensemble models are skipped to save compute. If anomaly detected (output = 1),
            full 3-model ensemble is triggered and outputs feed the Model Agreement Index.
          </div>
        </GlassPanel>

        {/* SECTION 2: 6 Model Cards */}
        <div className="grid-2">
          {MODEL_CARDS.map((card, idx) => (
            <GlassPanel
              key={idx}
              style={{
                borderLeft: `3px solid ${card.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{card.emoji}</span>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: card.color,
                      fontSize: 13,
                      fontFamily: 'Space Grotesk, sans-serif',
                    }}
                  >
                    {card.name}
                  </div>
                  <span className={`badge badge-${card.badgeVariant}`} style={{ marginTop: 2 }}>
                    {card.tag}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                {card.description}
              </p>
              <div
                style={{
                  background: '#0a0d16',
                  border: '1px solid #1e2536',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: '#94a3b8',
                  lineHeight: 1.6,
                  marginTop: 'auto',
                }}
              >
                {card.technical}
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* SECTION 3: Worked Example */}
        <GlassPanel>
          <div className="section-label">
            Worked Example — Drought Onset Scenario (Fixed Inputs)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {/* Rainfall Bar */}
            <div className="bar-row">
              <div className="bar-label">Rainfall</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(28 / exampleDistrict.baselineRainfall) * 100}%`,
                    background: '#ef4444',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                  color: '#ef4444',
                  minWidth: 160,
                  textAlign: 'right',
                }}
              >
                28mm (vs {exampleDistrict.baselineRainfall}mm baseline)
              </div>
            </div>

            {/* Temperature Bar */}
            <div className="bar-row">
              <div className="bar-label">Temperature</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(exampleDistrict.baselineTemp / 33.2) * 100}%`,
                    background: '#ef4444',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                  color: '#ef4444',
                  minWidth: 160,
                  textAlign: 'right',
                }}
              >
                33.2°C (vs {exampleDistrict.baselineTemp.toFixed(1)}°C baseline)
              </div>
            </div>
          </div>

          {!simulated ? (
            <button className="btn btn-primary" onClick={() => setSimulated(true)}>
              ▶ Run Pipeline Simulation
            </button>
          ) : (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="divider" />
              <div
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                Pipeline Engine Outputs — Before → After
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DataRow
                  label="1. SPI"
                  value={
                    <>
                      <span style={{ color: 'var(--dim)' }}>{beforeState.spi.toFixed(2)}</span>
                      <span style={{ color: 'var(--dim)', margin: '0 8px' }}>→</span>
                      <span style={{ color: '#ef4444' }}>{afterState.spi.toFixed(2)}</span>
                    </>
                  }
                />
                <DataRow
                  label="2. Flood Risk"
                  value={
                    <>
                      <span style={{ color: 'var(--dim)' }}>
                        {(beforeState.floodRiskIndex * 100).toFixed(0)}%
                      </span>
                      <span style={{ color: 'var(--dim)', margin: '0 8px' }}>→</span>
                      <span style={{ color: '#22c55e' }}>
                        {(afterState.floodRiskIndex * 100).toFixed(0)}%
                      </span>
                    </>
                  }
                />
                <DataRow
                  label="3. Drought Risk"
                  value={
                    <>
                      <span style={{ color: 'var(--dim)' }}>
                        {(beforeState.droughtRiskIndex * 100).toFixed(0)}%
                      </span>
                      <span style={{ color: 'var(--dim)', margin: '0 8px' }}>→</span>
                      <span style={{ color: '#ef4444' }}>
                        {(afterState.droughtRiskIndex * 100).toFixed(0)}%
                      </span>
                    </>
                  }
                />
                <DataRow
                  label="4. Monsoon Spell"
                  value={
                    <>
                      <span style={{ color: 'var(--dim)' }}>
                        {beforeState.monsoonSpellStatus.phase}
                      </span>
                      <span style={{ color: 'var(--dim)', margin: '0 8px' }}>→</span>
                      <span style={{ color: '#ef4444' }}>
                        {afterState.monsoonSpellStatus.phase}
                      </span>
                    </>
                  }
                />
                <DataRow
                  label="5. Stability Score"
                  value={
                    <>
                      <span style={{ color: 'var(--dim)' }}>{beforeState.stabilityScore}</span>
                      <span style={{ color: 'var(--dim)', margin: '0 8px' }}>→</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        {afterState.stabilityScore}
                      </span>
                    </>
                  }
                />
              </div>

              <div className="divider" />
              <div className="section-label">Step-by-step pipeline narration</div>
              <ol
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  lineHeight: 2,
                  listStylePosition: 'inside',
                }}
              >
                <li>
                  Isolation Forest detects anomaly →{' '}
                  <span style={{ color: '#22c55e' }}>output: 1 (anomaly flagged)</span>
                </li>
                <li>All 3 ensemble models triggered → LSTM, Physics Baseline, Analog</li>
                <li>LSTM outputs 40% rainfall probability — confidence band: 78%</li>
                <li>
                  Physics baseline: expected {Math.round(exampleDistrict.baselineRainfall * 0.4)}mm
                  ± {Math.round(exampleDistrict.baselineRainfall * 0.18)}mm. LSTM within bounds.
                </li>
                <li>Analog model: 4/5 analogs show drought onset in similar historical patterns</li>
                <li>
                  JSD score: 0.31 →{' '}
                  <span style={{ color: '#f59e0b' }}>Moderate distribution shift detected</span>
                </li>
                <li>Monsoon Spell Tracker: Break phase — 14d dry streak exceeds climatological mean</li>
                <li>
                  Stability Score:{' '}
                  <span style={{ fontFamily: 'JetBrains Mono', color: '#475569' }}>
                    {beforeState.stabilityScore}
                  </span>{' '}
                  →{' '}
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      color: '#ef4444',
                      fontWeight: 600,
                    }}
                  >
                    {afterState.stabilityScore}
                  </span>{' '}
                  — Advisory tier elevated to {afterState.advisoryTier}
                </li>
              </ol>
            </div>
          )}
        </GlassPanel>
      </div>
    </>
  );
}
