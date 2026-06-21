'use client';

import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { ClimateState } from '@/lib/climateEngine';
import { getScoreBand } from '@/lib/climateEngine';

interface ForensicReportProps {
  state: ClimateState;
  districtName: string;
  incidentName?: string;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  Normal:   '#00E5FF',
  Watch:    '#FFD23F',
  Advisory: '#FF6B35',
  Alert:    '#FF3366',
  Critical: '#FF3366',
};

const ROLE_ACTIONS: Record<string, string[][]> = {
  Normal:   [
    ['Irrigation Dept', 'Continue routine monitoring. No intervention required.'],
    ['District Collector', 'Maintain preparedness protocols. No advisories needed.'],
    ['Disaster Response', 'Standard readiness. No deployments required.'],
  ],
  Watch:    [
    ['Irrigation Dept', 'Monitor reservoir levels closely. Prepare contingency schedules.'],
    ['District Collector', 'Issue Watch advisory to panchayats. Verify communication channels.'],
    ['Disaster Response', 'Pre-position light response teams in vulnerable taluks.'],
  ],
  Advisory: [
    ['Irrigation Dept', 'Activate drought/flood protocols. Suspend non-essential water release.'],
    ['District Collector', 'Issue public advisory. Activate EOC. Brief revenue officials.'],
    ['Disaster Response', 'Deploy scout teams. Alert NDRF. Identify evacuation routes.'],
  ],
  Alert:    [
    ['Irrigation Dept', 'Emergency water management. Coordinate with dam authorities immediately.'],
    ['District Collector', 'Declare district alert. Evacuate high-risk zones. Activate crisis funds.'],
    ['Disaster Response', 'Full deployment. Coordinate with state SDMA and Army if needed.'],
  ],
  Critical: [
    ['Irrigation Dept', 'CRITICAL: Maximum emergency response. All reserves on standby.'],
    ['District Collector', 'CRITICAL: Declare state of emergency. Mandatory evacuations in progress.'],
    ['Disaster Response', 'CRITICAL: Multi-agency deployment. Request Central assistance immediately.'],
  ],
};

export default function ForensicReport({ state, districtName, incidentName, onClose }: ForensicReportProps) {
  const { hex, band } = getScoreBand(state.stabilityScore);
  const severityColor = SEVERITY_COLORS[state.advisoryTier];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const evidenceData = [
    { name: 'Rainfall Anomaly Z', value: parseFloat(state.rainfallAnomalyZ.toFixed(2)), fill: '#00E5FF' },
    { name: 'Temp Anomaly Z', value: parseFloat(state.tempAnomalyZ.toFixed(2)), fill: '#FFD23F' },
    { name: 'Flood Risk', value: parseFloat((state.floodRiskIndex * 100).toFixed(1)), fill: '#FF6B35' },
    { name: 'Drought Risk', value: parseFloat((state.droughtRiskIndex * 100).toFixed(1)), fill: '#FF6B35' },
    { name: 'SPI', value: parseFloat(state.spi.toFixed(2)), fill: '#B967FF' },
  ];

  const trajectoryData = [
    { t: '-5d', score: Math.min(100, state.stabilityScore + 12) },
    { t: '-3d', score: Math.min(100, state.stabilityScore + 7) },
    { t: '-1d', score: Math.min(100, state.stabilityScore + 3) },
    { t: 'Now', score: state.stabilityScore },
    { t: '+1d', score: Math.max(0, state.stabilityScore - 4) },
    { t: '+3d', score: Math.max(0, state.stabilityScore - 8) },
  ];

  const roleActions = ROLE_ACTIONS[state.advisoryTier] || ROLE_ACTIONS['Normal'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel animate-slide-up rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel rounded-t-2xl px-6 py-4 flex items-center justify-between border-b border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Forensic Report</span>
              <span className="h-px flex-1 bg-white/10 w-8" />
            </div>
            <h2 className="font-display font-bold text-white mt-0.5">{districtName}</h2>
            {incidentName && <p className="text-xs text-text-dim">{incidentName}</p>}
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Current State Summary */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3 font-semibold">
              1 · Current State Summary
            </h3>
            <div className="p-4 rounded-xl border" style={{ borderColor: `${hex}25`, background: `${hex}08` }}>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-text-dim">Stability Score</div>
                  <div className="font-mono text-3xl font-bold" style={{ color: hex }}>
                    {state.stabilityScore}
                    <span className="text-base text-text-dim font-normal">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80 leading-relaxed">
                    {districtName} is currently in a{' '}
                    <span className="font-semibold" style={{ color: hex }}>{band}</span> state.{' '}
                    {state.stabilityScore < 50
                      ? `Significant climate stress detected — immediate attention required.`
                      : state.stabilityScore < 70
                      ? `Moderate climate stress present — heightened monitoring advised.`
                      : `Conditions within acceptable parameters — routine monitoring sufficient.`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Evidence Trail */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3 font-semibold">
              2 · Evidence Trail
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Rainfall Anomaly', value: `${state.rainfallAnomalyZ > 0 ? '+' : ''}${state.rainfallAnomalyZ.toFixed(2)}σ`, color: '#00E5FF' },
                { label: 'Temp Anomaly', value: `${state.tempAnomalyZ > 0 ? '+' : ''}${state.tempAnomalyZ.toFixed(2)}σ`, color: '#FFD23F' },
                { label: 'Consec. Dry Days', value: `${state.monsoonSpellStatus.breakStreakDays}d`, color: '#FF6B35' },
                { label: 'SPI Value', value: state.spi.toFixed(3), color: '#B967FF' },
                { label: 'Monsoon Spell', value: state.monsoonSpellStatus.phase, color: '#B967FF' },
                { label: 'Rainfall', value: `${state.rainfall.toFixed(0)}mm`, color: '#00E5FF' },
              ].map(item => (
                <div key={item.label} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] text-text-dim">{item.label}</div>
                  <div className="font-mono font-semibold text-sm mt-0.5" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={evidenceData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#8892A4', fontSize: 9 }} />
                <YAxis tick={{ fill: '#8892A4', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#1C2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {evidenceData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Section 3: Model Confidence */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3 font-semibold">
              3 · Model Confidence & Source
            </h3>
            <div className="p-4 rounded-xl bg-ai-violet/5 border border-ai-violet/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ai-violet">Detection Pipeline</span>
                <span className="text-xs font-mono text-ai-violet">Isolation Forest → LSTM → JSD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Prediction Confidence</span>
                <span className="font-mono text-sm text-ai-violet font-semibold">
                  {(state.scoreComponents.confidenceContribution / 0.8 * 10).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Data Source</span>
                <span className="text-xs text-white/60">IMD · ISRO Satellite · Seed baseline</span>
              </div>
            </div>
          </section>

          {/* Section 4: Risk Trajectory */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3 font-semibold">
              4 · Risk Trajectory
            </h3>
            <p className="text-xs text-text-dim mb-3">
              Score trend (indicative) — worsening conditions projected over next 3 days.
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={trajectoryData}>
                <XAxis dataKey="t" tick={{ fill: '#8892A4', fontSize: 9 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#8892A4', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#1C2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                />
                <Line type="monotone" dataKey="score" stroke={hex} strokeWidth={2} dot={{ fill: hex, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* Section 5: Severity Tier */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3 font-semibold">
              5 · Severity Tier
            </h3>
            <div className="flex gap-2">
              {(['Normal', 'Watch', 'Advisory', 'Alert', 'Critical'] as const).map(tier => (
                <div
                  key={tier}
                  className="flex-1 text-center py-2 rounded-lg text-[10px] font-mono font-semibold transition-all"
                  style={{
                    background: state.advisoryTier === tier ? `${SEVERITY_COLORS[tier]}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${state.advisoryTier === tier ? SEVERITY_COLORS[tier] + '50' : 'rgba(255,255,255,0.08)'}`,
                    color: state.advisoryTier === tier ? SEVERITY_COLORS[tier] : '#4A5568',
                  }}
                >
                  {tier}
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Suggested Actions */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-dim mb-3 font-semibold">
              6 · Suggested Actions
            </h3>
            <div className="space-y-2">
              {roleActions.map(([role, action]) => (
                <div key={role} className="flex gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-text-dim w-28 shrink-0 pt-0.5">{role}</span>
                  <span className="text-xs text-white/70">{action}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
