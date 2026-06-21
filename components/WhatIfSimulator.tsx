'use client';

import { useState, useCallback } from 'react';
import GlassPanel from './GlassPanel';
import OrbitalRing from './OrbitalRing';
import ScoreBreakdown from './ScoreBreakdown';
import { computeWhatIf, defaultOverrides, getScoreBand, getAdvisoryTier } from '@/lib/climateEngine';
import type { DistrictBaseline, WhatIfOverrides, ClimateState } from '@/lib/climateEngine';

interface WhatIfSimulatorProps {
  baseline: DistrictBaseline;
  initialOverrides?: Partial<WhatIfOverrides>;
  title?: string;
}

const ADVISORY_COLORS: Record<string, string> = {
  Normal:   '#00E5FF',
  Watch:    '#FFD23F',
  Advisory: '#FF6B35',
  Alert:    '#FF3366',
  Critical: '#FF3366',
};

export default function WhatIfSimulator({ baseline, initialOverrides, title }: WhatIfSimulatorProps) {
  const base = { ...defaultOverrides(baseline), ...initialOverrides };
  const [overrides, setOverrides] = useState<WhatIfOverrides>(base);
  const [state, setState] = useState<ClimateState>(() => computeWhatIf(baseline, base));
  const [showBreakdown, setShowBreakdown] = useState(false);

  const update = useCallback((patch: Partial<WhatIfOverrides>) => {
    const next = { ...overrides, ...patch };
    setOverrides(next);
    setState(computeWhatIf(baseline, next));
  }, [overrides, baseline]);

  const reset = () => {
    const d = defaultOverrides(baseline);
    setOverrides(d);
    setState(computeWhatIf(baseline, d));
  };

  const { hex } = getScoreBand(state.stabilityScore);
  const advisoryColor = ADVISORY_COLORS[state.advisoryTier] || '#00E5FF';

  return (
    <GlassPanel className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-white text-sm tracking-wide">
            {title || 'What-If Simulator'}
          </h3>
          <p className="text-[11px] text-text-dim mt-0.5">Parametric recompute · instant results</p>
        </div>
        <button
          onClick={reset}
          className="text-[11px] text-text-dim hover:text-signal-cyan transition-colors px-2 py-1 rounded border border-white/10 hover:border-signal-cyan/30"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Inputs ────────────────────────────────── */}
        <div className="space-y-4">

          {/* Rainfall */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/70">Rainfall Change</label>
              <span className="font-mono text-xs text-signal-cyan">
                {overrides.rainfallPctChange > 0 ? '+' : ''}{overrides.rainfallPctChange}%
              </span>
            </div>
            <input type="range" min={-80} max={150} step={5}
              value={overrides.rainfallPctChange}
              onChange={e => update({ rainfallPctChange: Number(e.target.value) })}
              className="w-full accent-signal-cyan"
            />
            <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
              <span>-80%</span><span>Baseline: {baseline.baselineRainfall}mm</span><span>+150%</span>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/70">Temperature Offset</label>
              <span className="font-mono text-xs text-warning-yellow">
                {overrides.tempOffset > 0 ? '+' : ''}{overrides.tempOffset.toFixed(1)}°C
              </span>
            </div>
            <input type="range" min={-3} max={5} step={0.5}
              value={overrides.tempOffset}
              onChange={e => update({ tempOffset: Number(e.target.value) })}
              className="w-full accent-warning-yellow"
            />
            <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
              <span>-3°C</span><span>Baseline: {baseline.baselineTemp}°C</span><span>+5°C</span>
            </div>
          </div>

          {/* Consecutive Dry Days */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/70">Consecutive Dry Days</label>
              <span className="font-mono text-xs text-warning-amber">{overrides.consecutiveDryDays}d</span>
            </div>
            <input type="range" min={0} max={30} step={1}
              value={overrides.consecutiveDryDays}
              onChange={e => update({ consecutiveDryDays: Number(e.target.value) })}
              className="w-full accent-warning-amber"
            />
          </div>

          {/* Soil Moisture */}
          <div>
            <label className="text-xs text-white/70 block mb-1.5">
              Soil Moisture Starting Condition
              <span className="ml-1 text-[10px] text-ai-violet">(scenario assumption — not measured)</span>
            </label>
            <div className="flex gap-2">
              {(['Low', 'Medium', 'High'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => update({ soilMoisture: v })}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-all border ${
                    overrides.soilMoisture === v
                      ? 'border-signal-cyan/50 text-signal-cyan bg-signal-cyan/10'
                      : 'border-white/10 text-text-dim hover:border-white/20'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Monsoon Spell */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-white/70">Active Spell Days</label>
                <span className="font-mono text-xs text-ai-violet">{overrides.monsoonActiveDays}d</span>
              </div>
              <input type="range" min={0} max={30} step={1}
                value={overrides.monsoonActiveDays}
                onChange={e => update({ monsoonActiveDays: Number(e.target.value) })}
                className="w-full accent-purple-400"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-white/70">Break Spell Days</label>
                <span className="font-mono text-xs text-ai-violet">{overrides.monsoonBreakDays}d</span>
              </div>
              <input type="range" min={0} max={30} step={1}
                value={overrides.monsoonBreakDays}
                onChange={e => update({ monsoonBreakDays: Number(e.target.value) })}
                className="w-full accent-purple-400"
              />
            </div>
          </div>

          {/* Compound Toggle */}
          <div
            onClick={() => update({ compoundMode: !overrides.compoundMode })}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
              overrides.compoundMode
                ? 'border-ai-violet/40 bg-ai-violet/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-white/80">Compound Scenario Mode</p>
              <p className="text-[10px] text-text-dim">All deltas applied simultaneously</p>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative ${overrides.compoundMode ? 'bg-ai-violet' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${overrides.compoundMode ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>
        </div>

        {/* ── Output ────────────────────────────────── */}
        <div className="space-y-4">
          {/* Orbital Ring */}
          <div className="flex flex-col items-center py-4">
            <OrbitalRing score={state.stabilityScore} size="lg" animated />
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Rainfall', value: `${state.rainfall.toFixed(0)}mm`, color: '#00E5FF' },
              { label: 'Temp',     value: `${state.temp.toFixed(1)}°C`,      color: '#FFD23F' },
              { label: 'Flood RI', value: `${(state.floodRiskIndex*100).toFixed(0)}%`, color: '#FF6B35' },
              { label: 'Drought RI', value: `${(state.droughtRiskIndex*100).toFixed(0)}%`, color: '#FF6B35' },
              { label: 'SPI',      value: state.spi.toFixed(2),               color: '#B967FF' },
              { label: 'Spell',    value: state.monsoonSpellStatus.phase,      color: '#B967FF' },
            ].map(m => (
              <div key={m.label} className="bg-white/[0.03] rounded-lg p-2 border border-white/5">
                <div className="text-text-dim text-[10px]">{m.label}</div>
                <div className="font-mono font-semibold mt-0.5" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Advisory tier */}
          <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: `${advisoryColor}30`, background: `${advisoryColor}10` }}>
            <span className="text-xs text-white/70">Advisory Tier</span>
            <span className="font-mono text-sm font-bold tracking-wide" style={{ color: advisoryColor }}>
              {state.advisoryTier}
            </span>
          </div>

          {/* Monsoon spell label */}
          <div className="p-2 bg-ai-violet/5 rounded-lg border border-ai-violet/15">
            <p className="text-[10px] text-ai-violet/70 uppercase tracking-wider mb-0.5">Monsoon Spell Tracker</p>
            <p className="text-xs text-white/70">{state.monsoonSpellStatus.label}</p>
          </div>

          {/* Score breakdown toggle */}
          <button
            onClick={() => setShowBreakdown(v => !v)}
            className="w-full text-xs text-text-dim hover:text-signal-cyan transition-colors py-2 border border-white/10 hover:border-signal-cyan/30 rounded-lg"
          >
            {showBreakdown ? 'Hide' : 'Show'} Score Breakdown ↓
          </button>

          {showBreakdown && (
            <div className="animate-slide-up">
              <ScoreBreakdown components={state.scoreComponents} score={state.stabilityScore} />
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
