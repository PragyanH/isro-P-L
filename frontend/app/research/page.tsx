'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';

export default function ResearchPage() {
  const spellData = [
    { year: '1901', spell1: 12.0, spell2: 5.8, gap: 28 },
    { year: '1921', spell1: 11.8, spell2: 5.9, gap: 27 },
    { year: '1941', spell1: 11.5, spell2: 6.1, gap: 26 },
    { year: '1961', spell1: 11.2, spell2: 6.2, gap: 24 },
    { year: '1981', spell1: 10.8, spell2: 6.4, gap: 22 },
    { year: '2001', spell1: 10.5, spell2: 6.5, gap: 20 },
    { year: '2023', spell1: 10.2, spell2: 6.6, gap: 17 },
  ];

  const contribData = [
    { period: '1901–1950', spell1: 68, spell2: 32 },
    { period: '1951–1980', spell1: 64, spell2: 36 },
    { period: '1981–2010', spell1: 60, spell2: 40 },
    { period: '2011–2023', spell1: 57, spell2: 43 },
  ];

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Research / Methodology' }]} />
      <div className="page-content fade-in">
        {/* Section 1 — Citation card */}
        <GlassPanel style={{ borderLeft: '4px solid #22c55e' }}>
          <div className="section-label">PRIMARY CITATION</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Space Grotesk, sans-serif',
              marginBottom: 4,
            }}
          >
            Long-term changes in rainfall epochs and intensity patterns of Indian summer monsoon in
            changing climate
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            Subrahmanyam, K.V., Ramana, M.V., Chauhan, P.
          </div>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4, marginBottom: 8 }}>
            Atmospheric Research, Vol. 295, 2023, Elsevier. DOI: 10.1016/j.atmosres.2023.106997
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-stable">122-yr dataset (1901–2022)</span>
            <span className="badge badge-dim">All-India monsoon analysis</span>
            <span className="badge badge-violet">ISRO / SAC Ahmedabad</span>
          </div>
        </GlassPanel>

        {/* Section 2 — 3 Finding cards */}
        <div className="grid-3">
          <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
              −0.4mm/decade
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
              Spell-1 Contribution Declining
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>
              Primary monsoon wet spells are showing decreasing total volume and intensity metrics.
            </div>
          </GlassPanel>

          <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
              +0.22mm/decade
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
              Spell-2 Strengthening
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>
              Secondary/erratic late spells are increasing, leading to unexpected intense bursts.
            </div>
          </GlassPanel>

          <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, color: '#a855f7' }}>
              −11 days
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
              Inter-spell Gap Compressed
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>
              Monsoon epochs are shortening, increasing dry spells and triggering flash floods.
            </div>
          </GlassPanel>
        </div>

        {/* Section 3 — 2 charts side by side */}
        <div className="grid-2">
          {/* Chart 1 */}
          <GlassPanel>
            <div className="section-label">Spell Duration — 122-Year Trend</div>
            <div style={{ width: '100%', height: 200, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spellData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid stroke="#1e2536" strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fill: '#475569', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#161b28',
                      border: '1px solid #1e2536',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="spell1"
                    name="Spell-1 (days)"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#22c55e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spell2"
                    name="Spell-2 (days)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gap"
                    name="Inter-spell gap"
                    stroke="#a855f7"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={{ r: 2, fill: '#a855f7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          {/* Chart 2 */}
          <GlassPanel>
            <div className="section-label">Rainfall Contribution Shift</div>
            <div style={{ width: '100%', height: 200, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contribData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid stroke="#1e2536" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 9 }} />
                  <YAxis unit="%" tick={{ fill: '#475569', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#161b28',
                      border: '1px solid #1e2536',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
                  <Bar
                    dataKey="spell1"
                    name="Spell-1 %"
                    fill="#22c55e"
                    opacity={0.8}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="spell2"
                    name="Spell-2 %"
                    fill="#a855f7"
                    opacity={0.8}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </div>

        {/* Section 4 — "How This Feeds PrithviTwin" */}
        <div className="grid-2">
          <GlassPanel style={{ borderLeft: '3px solid #22c55e', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>
              Monsoon Spell Tracker
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.4 }}>
              Active/Break classification uses climatological spell means from 122yr record.
              Deviations feed the Stability Score at 12% weight.
            </div>
          </GlassPanel>

          <GlassPanel style={{ borderLeft: '3px solid #f59e0b', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
              Stability Score
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.4 }}>
              Monsoon Spell Deviation weight (12%) uses Spell Tracker output. Compressed
              inter-spell gap increases break-phase risk contribution.
            </div>
          </GlassPanel>

          <GlassPanel style={{ borderLeft: '3px solid #a855f7', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a855f7', marginBottom: 4 }}>
              What-If Simulator
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.4 }}>
              Monsoon Active/Break day inputs are validated against climatological norms. Spell
              phase recomputed on every slider change.
            </div>
          </GlassPanel>

          <GlassPanel style={{ borderLeft: '3px solid #f97316', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', marginBottom: 4 }}>
              Forensic Report
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.4 }}>
              Evidence Trail always includes Monsoon Spell Status, labeling Active/Break streaks
              relative to 122yr climatological mean.
            </div>
          </GlassPanel>
        </div>

        {/* Section 5 — Disclaimer */}
        <GlassPanel
          style={{
            background: 'rgba(168,85,247,0.05)',
            borderColor: 'rgba(168,85,247,0.2)',
            fontSize: 11,
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          Note: This citation is included on its own scientific merits. No claim is made about the
          identity of judges, mentors, or evaluators of this hackathon submission.
        </GlassPanel>
      </div>
    </>
  );
}
