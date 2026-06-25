'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { karnatakaDistricts } from '@/lib/seedData';
import {
  computeWhatIf,
  defaultOverrides,
  getScoreBand,
  getAdvisoryTier,
} from '@/lib/climateEngine';
import type { WhatIfOverrides, DistrictBaseline } from '@/lib/climateEngine';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';
import ScoreRing from '@/components/ScoreRing';
import DataRow from '@/components/DataRow';

// Lazy import ForensicReport to avoid circular dependencies
const ForensicReport = dynamic(() => import('@/components/ForensicReport'), {
  ssr: false,
});

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getTierBadge(tier: string): string {
  const m: Record<string, string> = {
    Normal: 'stable',
    Watch: 'moderate',
    Advisory: 'elevated',
    Alert: 'critical',
    Critical: 'critical',
  };
  return 'badge-' + (m[tier] || 'dim');
}

function getBorderColor(tier: string): string {
  if (tier === 'Critical' || tier === 'Alert') return '1px solid var(--red)';
  if (tier === 'Advisory' || tier === 'Watch') return '1px solid var(--amber)';
  return '1px solid var(--green)';
}

function SimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const districtParam = searchParams.get('district') || 'Kalaburagi';

  const defaultDistrict = useMemo(() => {
    return (
      karnatakaDistricts.find(
        (d) => d.name.toLowerCase() === districtParam.toLowerCase()
      ) || karnatakaDistricts[5]
    );
  }, [districtParam]);

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictBaseline>(defaultDistrict);
  const [overrides, setOverrides] = useState<WhatIfOverrides>(() =>
    defaultOverrides(defaultDistrict)
  );
  const [showReport, setShowReport] = useState(false);

  const state = useMemo(() => computeWhatIf(selectedDistrict, overrides), [
    selectedDistrict,
    overrides,
  ]);
  const baselineState = useMemo(() => {
    return computeWhatIf(selectedDistrict, defaultOverrides(selectedDistrict));
  }, [selectedDistrict]);

  function update(patch: Partial<WhatIfOverrides>) {
    setOverrides((prev) => ({ ...prev, ...patch }));
  }

  function resetSim() {
    setOverrides(defaultOverrides(selectedDistrict));
  }

  function handleDistrictChange(name: string) {
    const d = karnatakaDistricts.find((x) => x.name === name);
    if (!d) return;
    setSelectedDistrict(d);
    setOverrides(defaultOverrides(d));
  }

  const delta = state.stabilityScore - baselineState.stabilityScore;
  const deltaColor = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : 'var(--text)';

  return (
    <>
      <Topbar
        breadcrumbs={[{ label: 'What-If Simulator' }]}
        rightContent={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge ${getTierBadge(state.advisoryTier)}`}>
              {state.advisoryTier} · {state.stabilityScore}/100
            </span>
            <button className="btn btn-ghost" onClick={resetSim}>
              Reset
            </button>
            <button className="btn btn-danger" onClick={() => setShowReport(true)}>
              View Forensic Report
            </button>
          </div>
        }
      />
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: 16,
          height: 'calc(100vh - 44px)',
          overflow: 'hidden',
        }}
      >
        {/* LEFT CONTROLS PANEL */}
        <div style={{ flex: 1, maxWidth: 320, height: '100%' }}>
          <GlassPanel
            className="fade-in"
            style={{
              height: '100%',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* District Selector */}
            <div>
              <div className="section-label">Select District</div>
              <select
                value={selectedDistrict.name}
                onChange={(e) => handleDistrictChange(e.target.value)}
                style={{
                  background: '#0a0d16',
                  color: '#e2e8f0',
                  border: '1px solid #1e2536',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: '100%',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                {karnatakaDistricts.map((d) => (
                  <option key={d.name} value={d.name} style={{ background: '#0f1117' }}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Slider 1 - Rainfall Change */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Rainfall Change</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      color: overrides.rainfallPctChange >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {overrides.rainfallPctChange > 0 ? '+' : ''}
                    {overrides.rainfallPctChange}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="150"
                  step="5"
                  value={overrides.rainfallPctChange}
                  onChange={(e) => update({ rainfallPctChange: Number(e.target.value) })}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: '#475569',
                    marginTop: 3,
                  }}
                >
                  <span>-80%</span>
                  <span>Baseline</span>
                  <span>+150%</span>
                </div>
              </div>

              {/* Slider 2 - Temperature Offset */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Temperature Offset</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      color: overrides.tempOffset > 0 ? '#ef4444' : '#22c55e',
                    }}
                  >
                    {overrides.tempOffset > 0 ? '+' : ''}
                    {overrides.tempOffset.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="5"
                  step="0.5"
                  value={overrides.tempOffset}
                  onChange={(e) => update({ tempOffset: Number(e.target.value) })}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: '#475569',
                    marginTop: 3,
                  }}
                >
                  <span>-3°C</span>
                  <span>0</span>
                  <span>+5°C</span>
                </div>
              </div>

              {/* Slider 3 - Consecutive Dry Days */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Consecutive Dry Days</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      color: '#f97316',
                    }}
                  >
                    {overrides.consecutiveDryDays}d
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={overrides.consecutiveDryDays}
                  onChange={(e) => update({ consecutiveDryDays: Number(e.target.value) })}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: '#475569',
                    marginTop: 3,
                  }}
                >
                  <span>0d</span>
                  <span>30d</span>
                </div>
              </div>

              {/* Slider 4 - Active Monsoon Days */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Active Monsoon Days</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      color: '#a855f7',
                    }}
                  >
                    {overrides.monsoonActiveDays}d
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={overrides.monsoonActiveDays}
                  onChange={(e) => update({ monsoonActiveDays: Number(e.target.value) })}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: '#475569',
                    marginTop: 3,
                  }}
                >
                  <span>0d</span>
                  <span>30d</span>
                </div>
              </div>
            </div>

            {/* Soil Moisture Selector */}
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>
                Soil Moisture
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['Low', 'Medium', 'High'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => update({ soilMoisture: v })}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border:
                        overrides.soilMoisture === v
                          ? '1px solid rgba(34,197,94,0.5)'
                          : '1px solid #1e2536',
                      background:
                        overrides.soilMoisture === v
                          ? 'rgba(34,197,94,0.1)'
                          : 'transparent',
                      color: overrides.soilMoisture === v ? '#22c55e' : '#475569',
                      transition: 'all 0.15s',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              className="btn btn-ghost"
              onClick={resetSim}
              style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            >
              Reset to Baseline
            </button>
          </GlassPanel>
        </div>

        {/* RIGHT RESULTS PANEL */}
        <div
          className="slide-up"
          style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ flex: 1, display: 'flex', gap: 12 }}>
            {/* BASELINE COLUMN */}
            <GlassPanel
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px',
              }}
            >
              <span className="badge badge-stable" style={{ marginBottom: 12 }}>
                BASELINE
              </span>
              <ScoreRing score={baselineState.stabilityScore} size="md" showLabel={false} />
              <div
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 18,
                  fontWeight: 600,
                  color: getScoreColor(baselineState.stabilityScore),
                  marginTop: 8,
                }}
              >
                {baselineState.stabilityScore}/100
              </div>
              <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 2 }}>
                {getScoreBand(baselineState.stabilityScore).band}
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
                Tier: {baselineState.advisoryTier}
              </div>

              <div className="divider" style={{ width: '100%', margin: '14px 0' }} />

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DataRow label="Rainfall" value={`${baselineState.rainfall.toFixed(0)}mm`} />
                <DataRow label="Temperature" value={`${baselineState.temp.toFixed(1)}°C`} />
                <DataRow label="SPI" value={baselineState.spi.toFixed(2)} />
                <DataRow
                  label="Flood Risk"
                  value={`${(baselineState.floodRiskIndex * 100).toFixed(0)}%`}
                />
                <DataRow
                  label="Drought Risk"
                  value={`${(baselineState.droughtRiskIndex * 100).toFixed(0)}%`}
                />
                <DataRow label="Monsoon Spell" value={baselineState.monsoonSpellStatus.phase} />
              </div>
            </GlassPanel>

            {/* ARROW */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#1e2536',
              }}
            >
              →
            </div>

            {/* SIMULATED COLUMN */}
            <GlassPanel
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px',
                border: getBorderColor(state.advisoryTier),
              }}
            >
              <span
                className={`badge ${getTierBadge(state.advisoryTier)}`}
                style={{ marginBottom: 12 }}
              >
                SCENARIO
              </span>
              <ScoreRing score={state.stabilityScore} size="md" showLabel={false} />
              <div
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 18,
                  fontWeight: 600,
                  color: getScoreColor(state.stabilityScore),
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {state.stabilityScore}/100
                {delta !== 0 && (
                  <span style={{ fontSize: 12, color: deltaColor }}>
                    (Δ{delta > 0 ? '+' : ''}
                    {delta})
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 2 }}>
                {getScoreBand(state.stabilityScore).band}
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
                Tier: {state.advisoryTier}
              </div>

              {delta < 0 ? (
                <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>
                  ⚠ Score dropped {Math.abs(delta)} points
                </div>
              ) : (
                <div style={{ height: 14, marginTop: 4 }} />
              )}

              <div className="divider" style={{ width: '100%', margin: '14px 0' }} />

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Rainfall */}
                <div className="data-row">
                  <span className="data-row-label">Rainfall</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="data-row-val">{state.rainfall.toFixed(0)}mm</span>
                    {overrides.rainfallPctChange !== 0 && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono',
                          color: overrides.rainfallPctChange > 0 ? '#22c55e' : '#ef4444',
                        }}
                      >
                        ({overrides.rainfallPctChange > 0 ? '+' : ''}
                        {overrides.rainfallPctChange}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Temperature */}
                <div className="data-row">
                  <span className="data-row-label">Temperature</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="data-row-val">{state.temp.toFixed(1)}°C</span>
                    {overrides.tempOffset !== 0 && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono',
                          color: overrides.tempOffset > 0 ? '#ef4444' : '#22c55e',
                        }}
                      >
                        ({overrides.tempOffset > 0 ? '+' : ''}
                        {overrides.tempOffset.toFixed(1)}°C)
                      </span>
                    )}
                  </div>
                </div>

                {/* SPI */}
                <div className="data-row">
                  <span className="data-row-label">SPI</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="data-row-val">{state.spi.toFixed(2)}</span>
                    {state.spi !== baselineState.spi && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono',
                          color: state.spi > baselineState.spi ? '#22c55e' : '#ef4444',
                        }}
                      >
                        (Δ{(state.spi - baselineState.spi).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Flood Risk */}
                <div className="data-row">
                  <span className="data-row-label">Flood Risk</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="data-row-val">
                      {(state.floodRiskIndex * 100).toFixed(0)}%
                    </span>
                    {state.floodRiskIndex !== baselineState.floodRiskIndex && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono',
                          color:
                            state.floodRiskIndex > baselineState.floodRiskIndex
                              ? '#ef4444'
                              : '#22c55e',
                        }}
                      >
                        (Δ
                        {(
                          (state.floodRiskIndex - baselineState.floodRiskIndex) *
                          100
                        ).toFixed(0)}
                        %)
                      </span>
                    )}
                  </div>
                </div>

                {/* Drought Risk */}
                <div className="data-row">
                  <span className="data-row-label">Drought Risk</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="data-row-val">
                      {(state.droughtRiskIndex * 100).toFixed(0)}%
                    </span>
                    {state.droughtRiskIndex !== baselineState.droughtRiskIndex && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono',
                          color:
                            state.droughtRiskIndex > baselineState.droughtRiskIndex
                              ? '#ef4444'
                              : '#22c55e',
                        }}
                      >
                        (Δ
                        {(
                          (state.droughtRiskIndex - baselineState.droughtRiskIndex) *
                          100
                        ).toFixed(0)}
                        %)
                      </span>
                    )}
                  </div>
                </div>

                {/* Monsoon Spell */}
                <div className="data-row">
                  <span className="data-row-label">Monsoon Spell</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="data-row-val">{state.monsoonSpellStatus.phase}</span>
                    {state.monsoonSpellStatus.phase !== baselineState.monsoonSpellStatus.phase && (
                      <span style={{ fontSize: 9, color: 'var(--dim)' }}>
                        (was {baselineState.monsoonSpellStatus.phase})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* BOTTOM SECTION: forensic report button */}
          <button
            className="btn btn-danger"
            onClick={() => setShowReport(true)}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13 }}
          >
            View Forensic Report for This Simulation →
          </button>
        </div>
      </div>
      {showReport && (
        <ForensicReport
          state={state}
          districtName={selectedDistrict.name}
          onClose={() => setShowReport(false)}
          isSimulation={true}
          simulationParams={overrides}
        />
      )}
    </>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: 'var(--text)' }}>Loading simulator...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
