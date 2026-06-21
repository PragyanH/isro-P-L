'use client';

import { useState } from 'react';
import type { ScoreComponents } from '@/lib/climateEngine';

interface ScoreBreakdownProps {
  components: ScoreComponents;
  score: number;
}

const COMPONENT_INFO = [
  {
    key: 'rainfallContribution' as keyof ScoreComponents,
    label: 'Rainfall Anomaly',
    icon: '🌧',
    color: '#00E5FF',
    explanation: 'Measures how far current rainfall deviates from the 30-year climatological mean using a z-score. High positive or negative deviation increases instability.',
    weight: '25%',
  },
  {
    key: 'tempContribution' as keyof ScoreComponents,
    label: 'Temperature Anomaly',
    icon: '🌡',
    color: '#FFD23F',
    explanation: 'Captures temperature departure from baseline. Extreme heat anomalies compound drought risk; unusual cold can indicate monsoon disruption.',
    weight: '15%',
  },
  {
    key: 'floodContribution' as keyof ScoreComponents,
    label: 'Flood Risk Index',
    icon: '🌊',
    color: '#FF6B35',
    explanation: 'Composite of rainfall anomaly z-score, active monsoon streak days, and soil moisture saturation. Higher soil moisture amplifies flood risk.',
    weight: '20%',
  },
  {
    key: 'droughtContribution' as keyof ScoreComponents,
    label: 'Drought Risk Index (SPI)',
    icon: '🏜',
    color: '#FF6B35',
    explanation: 'Based on the Standardised Precipitation Index (SPI). Consecutive dry days and low soil moisture are compounding factors.',
    weight: '20%',
  },
  {
    key: 'monsoonContribution' as keyof ScoreComponents,
    label: 'Monsoon Spell Deviation',
    icon: '🌀',
    color: '#B967FF',
    explanation: 'Derived from the Monsoon Spell Tracker (Subrahmanyam et al., 2023). Active/break spell classification relative to climatological means for Spell-1 and Spell-2.',
    weight: '12%',
    isAI: true,
  },
  {
    key: 'confidenceContribution' as keyof ScoreComponents,
    label: 'Prediction Confidence',
    icon: '🎯',
    color: '#B967FF',
    explanation: 'Model confidence in the current state estimate. Higher confidence slightly boosts the score reliability; lower confidence reduces it.',
    weight: '8%',
    isAI: true,
  },
];

export default function ScoreBreakdown({ components, score }: ScoreBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-dim uppercase tracking-widest font-semibold">Score Breakdown</span>
        <span className="text-xs text-text-dim">Click any row to expand</span>
      </div>

      {COMPONENT_INFO.map((item) => {
        const value = components[item.key];
        const isOpen = expanded === item.key;

        return (
          <div key={item.key} className="rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left rounded-lg"
              onClick={() => setExpanded(isOpen ? null : item.key)}
            >
              <span className="text-base w-6 text-center">{item.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white/80">{item.label}</span>
                  {item.isAI && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ color: '#B967FF', background: 'rgba(185,103,255,0.1)', border: '1px solid rgba(185,103,255,0.2)' }}>
                      AI
                    </span>
                  )}
                  <span className="text-[10px] text-text-dim ml-auto">{item.weight}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(value, 100)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>

              <span className="font-mono text-xs font-semibold" style={{ color: item.color, minWidth: '2.5rem', textAlign: 'right' }}>
                {value}
                <span className="text-text-dim font-normal text-[10px]">pts</span>
              </span>

              <svg
                className={`w-3 h-3 text-text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 pt-1 text-xs text-text-dim leading-relaxed animate-fade-in bg-white/[0.02] rounded-b-lg border-t border-white/5">
                {item.explanation}
              </div>
            )}
          </div>
        );
      })}

      {/* Total */}
      <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between">
        <span className="text-xs text-text-dim uppercase tracking-widest">Stability Score</span>
        <span className="font-mono text-lg font-semibold text-signal-cyan">{score}<span className="text-text-dim text-xs">/100</span></span>
      </div>
    </div>
  );
}
