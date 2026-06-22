'use client';

import { useState } from 'react';
import GlassPanel from '@/components/GlassPanel';
import OrbitalRing from '@/components/OrbitalRing';
import { computeMonsoonSpellStatus, computeStabilityScore, computeFloodRiskIndex, computeDroughtRiskIndex, computeSPI } from '@/lib/climateEngine';

const ENGINES = [
  {
    id: 'isolation-forest',
    name: 'Isolation Forest',
    icon: '🌲',
    tag: 'Anomaly Gate',
    color: '#00E5FF',
    description: 'First-stage anomaly detector. Flags district climate states that deviate significantly from the ensemble. Acts as a pre-filter — only flagged districts proceed to LSTM trigger.',
    how: 'Builds an ensemble of isolation trees. Short path lengths → anomalous points. Contamination threshold tuned to ~5% of historical states.',
  },
  {
    id: 'lstm',
    name: 'LSTM (Temporal)',
    icon: '🔄',
    tag: 'Sequence Trigger',
    color: '#00E5FF',
    description: 'Temporal sequence model for pattern recognition across monsoon time-steps. Detects regime shifts — e.g., rapidly intensifying break spells or compound drought onset.',
    how: 'LSTM trained on 30-year IMD rainfall sequences. Looks at 14-day windows. Output: probability of regime change. Triggered when Isolation Forest flags an anomaly.',
  },
  {
    id: 'jsd',
    name: 'Jensen-Shannon Divergence',
    icon: '📊',
    tag: 'Distribution Shift',
    color: '#B967FF',
    description: 'Measures distributional shift between current and historical rainfall/temp distributions. High JSD → current climate has departed from historical norms.',
    how: 'JSD = (KL(P||M) + KL(Q||M)) / 2, where M = mixture. Applied to rolling 30-day rainfall CDFs vs. climatological CDFs. Values > 0.15 trigger advisory elevation.',
    isAI: true,
  },
  {
    id: 'monsoon-spell',
    name: 'Monsoon Spell Tracker',
    icon: '🌀',
    tag: 'Spell Classification',
    color: '#B967FF',
    description: 'Classifies current monsoon phase as Active, Break, Transition, or Normal. Based on Subrahmanyam et al. (2023) — accounts for the historically compressed inter-spell gap.',
    how: 'Active: ≥7 consecutive wet days with >60% activity ratio. Break: ≥5 consecutive dry days with <35% activity ratio. Deviation from climatological spell mean feeds Stability Score.',
    isAI: true,
  },
];

// Fixed worked-example values (non-adjustable, per spec)
const EXAMPLE = {
  rainfall: 28,   // mm (below normal)
  temp: 33.2,     // °C (above normal)
  baseline: { rainfall: 70, temp: 29.0, rainfallStd: 25, tempStd: 1.5 },
};

export default function XAIPage() {
  const [simulated, setSimulated] = useState(false);

  // Compute before/after states
  const beforeSpell = computeMonsoonSpellStatus(8, 4);
  const afterSpell  = computeMonsoonSpellStatus(3, 12);

  const beforeSPI  = computeSPI(EXAMPLE.rainfall, EXAMPLE.baseline.rainfall, EXAMPLE.baseline.rainfallStd);
  const afterSPI   = computeSPI(EXAMPLE.rainfall * 0.4, EXAMPLE.baseline.rainfall, EXAMPLE.baseline.rainfallStd);

  const beforeFlood  = computeFloodRiskIndex(beforeSPI, 8, 'Medium', 0.12);
  const beforeDrought = computeDroughtRiskIndex(beforeSPI, 4, 'Medium', 0.18);
  const beforeScoreData = computeStabilityScore(beforeSPI, (EXAMPLE.temp - EXAMPLE.baseline.temp) / EXAMPLE.baseline.tempStd, beforeFlood, beforeDrought, beforeSpell, 0.82);

  const afterFlood  = computeFloodRiskIndex(afterSPI, 3, 'Low', 0.12);
  const afterDrought = computeDroughtRiskIndex(afterSPI, 14, 'Low', 0.18);
  const afterScoreData  = computeStabilityScore(afterSPI, (EXAMPLE.temp + 2 - EXAMPLE.baseline.temp) / EXAMPLE.baseline.tempStd, afterFlood, afterDrought, afterSpell, 0.78);

  const deltas = simulated ? {
    spi:          { before: beforeSPI, after: afterSPI },
    flood:        { before: beforeFlood, after: afterFlood },
    drought:      { before: beforeDrought, after: afterDrought },
    spell:        { before: beforeSpell.phase, after: afterSpell.phase },
    score:        { before: beforeScoreData.score, after: afterScoreData.score },
  } : null;

  return (
    <div className="w-full px-6 py-10">

      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="text-[11px] font-mono text-text-dim uppercase tracking-widest mb-1">Section 3 · Explainability</div>
        <h1 className="font-display font-bold text-white text-4xl mb-3">XAI / Methodology</h1>
        <p className="text-text-dim max-w-3xl text-base">
          {"How PrithviTwin's detection pipeline works — from raw inputs to the Climate Stability Score."}
          {" Each engine is independently explainable; the cascade shows how they compose."}
        </p>
      </div>

      {/* Engine cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {ENGINES.map((engine, i) => (
          <GlassPanel
            key={engine.id}
            className={`animate-slide-up delay-${(i + 1) * 100}`}
            glow={engine.isAI ? 'violet' : 'none'}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{engine.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-white text-lg">{engine.name}</h2>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold"
                    style={{ color: engine.color, background: engine.color + '15', border: `1px solid ${engine.color}30` }}
                  >
                    {engine.tag}
                  </span>
                  {engine.isAI && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ color: '#B967FF', background: 'rgba(185,103,255,0.1)', border: '1px solid rgba(185,103,255,0.2)' }}>
                      AI Layer
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70 mt-1 leading-relaxed">{engine.description}</p>
              </div>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
              <p className="text-[11px] text-text-dim leading-relaxed font-mono">{engine.how}</p>
            </div>

            {/* Delta display */}
            {deltas && engine.id === 'monsoon-spell' && (
              <div className="mt-3 flex gap-3 animate-fade-in">
                <div className="flex-1 bg-signal-cyan/5 rounded p-2 text-center border border-signal-cyan/15">
                  <div className="text-[10px] text-text-dim">Before</div>
                  <div className="font-mono text-xs text-signal-cyan">{deltas.spell.before}</div>
                </div>
                <div className="text-text-dim self-center">→</div>
                <div className="flex-1 bg-critical-red/5 rounded p-2 text-center border border-critical-red/15">
                  <div className="text-[10px] text-text-dim">After</div>
                  <div className="font-mono text-xs text-critical-red">{deltas.spell.after}</div>
                </div>
              </div>
            )}
          </GlassPanel>
        ))}
      </div>

      {/* Worked example + simulation */}
      <GlassPanel className="mb-6 animate-slide-up delay-500">
        <h2 className="font-display font-semibold text-white mb-2">Worked Example</h2>
        <p className="text-xs text-text-dim mb-4">
          Fixed inputs — not adjustable. Shows how the pipeline responds to a drought-onset scenario.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Input: Rainfall (fixed)</div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-signal-cyan"
                style={{ width: `${(EXAMPLE.rainfall / 200) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-xs text-signal-cyan">{EXAMPLE.rainfall}mm</span>
              <span className="text-[10px] text-text-dim">baseline: {EXAMPLE.baseline.rainfall}mm</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Input: Temperature (fixed)</div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-warning-yellow"
                style={{ width: `${((EXAMPLE.temp - 20) / 20) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-xs text-warning-yellow">{EXAMPLE.temp}°C</span>
              <span className="text-[10px] text-text-dim">baseline: {EXAMPLE.baseline.temp}°C</span>
            </div>
          </div>
        </div>

        {!simulated ? (
          <button
            onClick={() => setSimulated(true)}
            className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-ai-violet/20 text-ai-violet border border-ai-violet/30 hover:bg-ai-violet/30 transition-all"
          >
            ▶ Start Simulation — Show Engine Deltas
          </button>
        ) : (
          <div className="animate-slide-up space-y-3">
            <div className="text-xs text-text-dim uppercase tracking-widest mb-2 font-semibold">Engine Outputs — Before → After</div>
            {[
              { label: 'SPI',          before: deltas!.spi.before.toFixed(2), after: deltas!.spi.after.toFixed(2), color: '#B967FF' },
              { label: 'Flood Risk',   before: `${(deltas!.flood.before * 100).toFixed(0)}%`, after: `${(deltas!.flood.after * 100).toFixed(0)}%`, color: '#00E5FF' },
              { label: 'Drought Risk', before: `${(deltas!.drought.before * 100).toFixed(0)}%`, after: `${(deltas!.drought.after * 100).toFixed(0)}%`, color: '#FF6B35' },
              { label: 'Monsoon Spell', before: deltas!.spell.before, after: deltas!.spell.after, color: '#B967FF' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs text-text-dim w-24">{row.label}</span>
                <span className="font-mono text-xs text-signal-cyan w-16">{row.before}</span>
                <span className="text-text-dim text-xs">→</span>
                <span className="font-mono text-xs font-semibold w-16" style={{ color: row.color }}>{row.after}</span>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Cascade visualization */}
      <GlassPanel className="animate-slide-up delay-700">
        <h2 className="font-display font-semibold text-white mb-4">Pipeline Cascade</h2>
        <div className="flex items-start gap-2 flex-wrap">
          {[
            { label: 'Raw Inputs', sub: 'Rainfall · Temp · Spell days', color: '#4A5568' },
            { arrow: true },
            { label: 'Isolation Forest', sub: 'Anomaly gate', color: '#00E5FF' },
            { arrow: true },
            { label: 'LSTM', sub: 'Sequence trigger', color: '#00E5FF' },
            { arrow: true },
            { label: 'JSD + Spell Tracker', sub: 'Distribution shift · Spell phase', color: '#B967FF' },
            { arrow: true },
            { label: 'Risk Indices', sub: 'Flood · Drought · SPI', color: '#FF6B35' },
            { arrow: true },
            { label: 'Stability Score', sub: '0–100 · Advisory tier', color: simulated ? '#00E5FF' : '#4A5568' },
          ].map((step, i) => (
            'arrow' in step ? (
              <div key={i} className="text-text-dim self-center text-lg mt-0 pt-0">→</div>
            ) : (
              <div key={i} className="flex-1 min-w-[100px] text-center p-3 rounded-lg border transition-all"
                style={{ borderColor: step.color + '30', background: step.color + '08' }}>
                <div className="text-xs font-semibold" style={{ color: step.color }}>{step.label}</div>
                <div className="text-[10px] text-text-dim mt-0.5">{step.sub}</div>
                {step.label === 'Stability Score' && simulated && (
                  <div className="mt-2 flex justify-center gap-3">
                    <div className="text-center">
                      <div className="font-mono text-xs text-text-dim">{beforeScoreData.score}</div>
                      <div className="text-[9px] text-text-dim">before</div>
                    </div>
                    <span className="text-text-dim">→</span>
                    <div className="text-center">
                      <div className="font-mono text-sm font-bold text-critical-red">{afterScoreData.score}</div>
                      <div className="text-[9px] text-text-dim">after</div>
                    </div>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}