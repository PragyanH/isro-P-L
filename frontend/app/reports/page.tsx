'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

import { karnatakaDistricts } from '@/lib/seedData';
import { computeWhatIf, defaultOverrides } from '@/lib/climateEngine';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';

// Lazy import ForensicReport to avoid circular dependencies
const ForensicReport = dynamic(() => import('@/components/ForensicReport'), {
  ssr: false,
});

const REPORTS = [
  { id: 'FR-2025-112', district: 'Kalaburagi', date: 'May 10, 2025', severity: 'Alert', score: 42, status: 'Open' },
  { id: 'FR-2025-101', district: 'Yadgir', date: 'May 08, 2025', severity: 'Alert', score: 39, status: 'Open' },
  { id: 'FR-2025-098', district: 'Raichur', date: 'May 05, 2025', severity: 'Advisory', score: 47, status: 'Closed' },
  { id: 'FR-2025-089', district: 'Vijayapura', date: 'Apr 28, 2025', severity: 'Watch', score: 56, status: 'Closed' },
  { id: 'FR-2025-079', district: 'Bidar', date: 'Apr 20, 2025', severity: 'Advisory', score: 48, status: 'Closed' },
];

function getScoreColor(s: number) {
  if (s >= 80) return '#22c55e';
  if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}

function getBadgeClass(tier: string) {
  const m: Record<string, string> = {
    Normal: 'badge-stable',
    Watch: 'badge-moderate',
    Advisory: 'badge-elevated',
    Alert: 'badge-critical',
    Critical: 'badge-critical',
  };
  return m[tier] || 'badge-dim';
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<typeof REPORTS[0] | null>(null);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Forensic Reports' }]} />
      <div className="page-content fade-in">
        <GlassPanel>
          <div className="section-label">Recent Forensic Reports</div>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>
                    REPORT ID
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>
                    DISTRICT
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>
                    DATE GENERATED
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>
                    SEVERITY
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>
                    SCORE
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {REPORTS.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => setActiveReport(report)}
                    style={{
                      borderBottom: '1px solid rgba(30, 37, 54, 0.4)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    className="nav-item" // uses existing hover rules or inline hover
                  >
                    <td
                      style={{
                        padding: '12px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}
                    >
                      {report.id}
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, fontWeight: 500, color: '#ffffff' }}>
                      {report.district}
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: 'var(--dim)' }}>{report.date}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${getBadgeClass(report.severity)}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        fontWeight: 600,
                        color: getScoreColor(report.score),
                      }}
                    >
                      {report.score}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        className={`badge ${
                          report.status === 'Open' ? 'badge-critical' : 'badge-dim'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>

      {activeReport && (
        (() => {
          const d = karnatakaDistricts.find((x) => x.name === activeReport.district);
          if (!d) return null;
          const state = computeWhatIf(d, defaultOverrides(d));
          return (
            <ForensicReport
              state={state}
              districtName={activeReport.district}
              onClose={() => setActiveReport(null)}
            />
          );
        })()
      )}
    </>
  );
}
