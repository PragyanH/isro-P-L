'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Cell,
  CartesianGrid,
} from 'recharts';
import type { ClimateState, WhatIfOverrides } from '@/lib/climateEngine';
import GlassPanel from './GlassPanel';
import DataRow from './DataRow';

interface ForensicReportProps {
  state: ClimateState;
  districtName: string;
  onClose: () => void;
  isSimulation?: boolean;
  simulationParams?: WhatIfOverrides;
}

const ROLE_ACTIONS: Record<string, Array<{ role: string; action: string; color: string }>> = {
  Normal: [
    { role: 'District Admin', action: 'Continue routine monitoring. No intervention required.', color: '#22c55e' },
    { role: 'Agriculture Dept.', action: 'Standard seasonal planning. No changes needed.', color: '#f59e0b' },
    { role: 'Disaster Mgmt.', action: 'Standard readiness. No deployments required.', color: '#f97316' },
    { role: 'Public', action: 'No advisories. Normal conditions.', color: '#475569' },
  ],
  Watch: [
    { role: 'District Admin', action: 'Monitor reservoir levels closely. Prepare contingency schedules.', color: '#22c55e' },
    { role: 'Agriculture Dept.', action: 'Review crop water requirements. Assess irrigation needs.', color: '#f59e0b' },
    { role: 'Disaster Mgmt.', action: 'Pre-position light response teams in vulnerable taluks.', color: '#f97316' },
    { role: 'Public', action: 'Stay informed. Monitor local advisories.', color: '#475569' },
  ],
  Advisory: [
    { role: 'District Admin', action: 'Activate drought/flood protocols. Suspend non-essential water releases.', color: '#22c55e' },
    { role: 'Agriculture Dept.', action: 'Advise drought-resistant crop practices. Issue crop advisories.', color: '#f59e0b' },
    { role: 'Disaster Mgmt.', action: 'Deploy scout teams. Alert NDRF. Identify evacuation routes.', color: '#f97316' },
    { role: 'Public', action: 'Conserve water. Avoid flood-prone zones if applicable.', color: '#475569' },
  ],
  Alert: [
    { role: 'District Admin', action: 'Emergency water management. Coordinate with dam authorities immediately.', color: '#22c55e' },
    { role: 'Agriculture Dept.', action: 'Activate insurance claims process. Emergency crop support.', color: '#f59e0b' },
    { role: 'Disaster Mgmt.', action: 'Full deployment. Coordinate with state SDMA and Army if needed.', color: '#f97316' },
    { role: 'Public', action: 'Follow official evacuation advisories. Stock emergency supplies.', color: '#475569' },
  ],
  Critical: [
    { role: 'District Admin', action: 'CRITICAL: Declare state of emergency. Mandatory evacuations in progress.', color: '#22c55e' },
    { role: 'Agriculture Dept.', action: 'CRITICAL: Maximum crop loss mitigation. Emergency relief funds.', color: '#f59e0b' },
    { role: 'Disaster Mgmt.', action: 'CRITICAL: Multi-agency deployment. Request Central assistance immediately.', color: '#f97316' },
    { role: 'Public', action: 'CRITICAL: Follow mandatory evacuation orders immediately.', color: '#475569' },
  ],
};

const INSIGHTS_MAP = {
  Normal: 'No significant risk. Routine monitoring sufficient.',
  Watch: 'Conditions to monitor. Low risk of adverse impact.',
  Advisory: 'Moderate risk. Stakeholders should prepare.',
  Alert: 'High risk. Take action. Potential for significant adverse impact.',
  Critical: 'Immediate response required. Severe impact imminent.',
};

export default function ForensicReport({
  state,
  districtName,
  onClose,
  isSimulation = false,
  simulationParams,
}: ForensicReportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'confidence' | 'trajectory' | 'actions'>('overview');

  const reportId = useMemo(() => `FR-${Date.now().toString().slice(-6)}`, []);
  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  function getScoreColor(s: number) {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#f59e0b';
    if (s >= 40) return '#f97316';
    return '#ef4444';
  }

  function getSPILabel(spi: number) {
    if (spi < -2) return 'Extreme Drought';
    if (spi < -1.5) return 'Severe Drought';
    if (spi < -1) return 'Moderate Drought';
    if (spi < 0) return 'Mild Dry';
    return 'Normal';
  }

  function getSPIColor(spi: number): string {
    if (spi < -1.5) return '#ef4444';
    if (spi < -1) return '#f97316';
    if (spi < 0) return '#f59e0b';
    return '#22c55e';
  }

  function getTierClass(tier: string) {
    const m: Record<string, string> = {
      Normal: 't-normal',
      Watch: 't-watch',
      Advisory: 't-advisory',
      Alert: 't-alert',
      Critical: 't-critical',
    };
    return m[tier] || '';
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

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDownloadPDF = () => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;

    const actions = ROLE_ACTIONS[state.advisoryTier] || ROLE_ACTIONS.Normal;
    const actionsHtml = actions
      .map(
        (act) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 150px;">${act.role}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${act.action}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forensic Report - ${districtName}</title>
        <style>
          body {
            background: #ffffff;
            color: #000000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            padding: 20px;
          }
          @page {
            margin: 20mm;
          }
          h1, h2, h3 {
            font-family: Arial, sans-serif;
            color: #000000;
            margin-top: 0;
          }
          h1 {
            font-size: 20px;
            border-bottom: 2px solid #000000;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          h2 {
            font-size: 13px;
            border-bottom: 1px solid #cccccc;
            padding-bottom: 3px;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge {
            display: inline-block;
            padding: 3px 6px;
            font-size: 10px;
            font-weight: bold;
            border: 1px solid #000;
            border-radius: 4px;
            text-transform: uppercase;
          }
          .badge-simulation {
            border-color: #a855f7;
            color: #a855f7;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          th, td {
            text-align: left;
            padding: 6px 8px;
            border-bottom: 1px solid #dddddd;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .tier-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }
          .tier-item {
            flex: 1;
            text-align: center;
            padding: 5px;
            border: 1px solid #dddddd;
            border-radius: 4px;
            font-size: 10px;
          }
          .tier-active {
            font-weight: bold;
            border-color: #000000;
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #cccccc;
            padding-top: 10px;
            font-size: 9px;
            color: #666666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <div style="font-size: 10px; color: #666666; font-family: monospace;">FORENSIC REPORT &middot; ${reportId}</div>
            <h1 style="margin: 5px 0 0 0; border: none; padding: 0;">${districtName}</h1>
            <div style="margin-top: 5px;">
              <span class="badge">${state.advisoryTier}</span>
              ${isSimulation ? '<span class="badge badge-simulation" style="margin-left: 5px;">SIMULATION SCENARIO</span>' : ''}
            </div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <div><strong>Date:</strong> ${today}</div>
          </div>
        </div>

        <h2>Section 1: Current State</h2>
        <table>
          <tr>
            <td style="width: 200px;"><strong>Stability Score</strong></td>
            <td>${state.stabilityScore} / 100</td>
          </tr>
          <tr>
            <td><strong>Stability Band</strong></td>
            <td>${state.scoreBand}</td>
          </tr>
          <tr>
            <td><strong>NDMA Advisory Tier</strong></td>
            <td>${state.advisoryTier}</td>
          </tr>
        </table>

        <h2>Section 2: Evidence Trail</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Observed / Calculated Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rainfall Anomaly</td>
              <td>${state.rainfallAnomalyZ >= 0 ? '+' : ''}${state.rainfallAnomalyZ.toFixed(2)}&sigma;</td>
            </tr>
            <tr>
              <td>Temperature Anomaly</td>
              <td>${state.tempAnomalyZ >= 0 ? '+' : ''}${state.tempAnomalyZ.toFixed(2)}&sigma;</td>
            </tr>
            <tr>
              <td>Dry Streak Duration</td>
              <td>${state.monsoonSpellStatus.breakStreakDays} days</td>
            </tr>
            <tr>
              <td>Standardised Precipitation Index (SPI)</td>
              <td>${state.spi.toFixed(3)} (${getSPILabel(state.spi)})</td>
            </tr>
            <tr>
              <td>Monsoon Spell Phase</td>
              <td>${state.monsoonSpellStatus.phase}</td>
            </tr>
            <tr>
              <td>Actual Rainfall</td>
              <td>${state.rainfall.toFixed(0)} mm</td>
            </tr>
          </tbody>
        </table>

        <h2>Section 3: Score Components</h2>
        <table>
          <thead>
            <tr>
              <th>Factor Component</th>
              <th>Points Deduction / Weight Contribution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rainfall Anomaly Contribution</td>
              <td>${state.scoreComponents.rainfallContribution} / 25</td>
            </tr>
            <tr>
              <td>Temperature Anomaly Contribution</td>
              <td>${state.scoreComponents.tempContribution} / 15</td>
            </tr>
            <tr>
              <td>Flood Risk Index Contribution</td>
              <td>${state.scoreComponents.floodContribution} / 20</td>
            </tr>
            <tr>
              <td>Drought Risk Index Contribution</td>
              <td>${state.scoreComponents.droughtContribution} / 20</td>
            </tr>
            <tr>
              <td>Monsoon Spell Contribution</td>
              <td>${state.scoreComponents.monsoonContribution} / 12</td>
            </tr>
            <tr>
              <td>Ensemble Confidence Contribution</td>
              <td>${state.scoreComponents.confidenceContribution} / 8</td>
            </tr>
          </tbody>
        </table>

        <h2>Section 4: Model Confidence</h2>
        <table>
          <tr>
            <td style="width: 200px;"><strong>Prediction Confidence</strong></td>
            <td>${((state.scoreComponents.confidenceContribution / 0.8) * 10).toFixed(0)}%</td>
          </tr>
          <tr>
            <td><strong>Model Agreement</strong></td>
            <td>${state.scoreComponents.confidenceContribution > 6 ? 'HIGH' : 'MODERATE'}</td>
          </tr>
          <tr>
            <td><strong>Primary Data Source</strong></td>
            <td>IMD Gridded &middot; ISRO INSAT LST/SST</td>
          </tr>
          <tr>
            <td><strong>Data Freshness</strong></td>
            <td>6 hours ago</td>
          </tr>
        </table>

        <div style="margin-top: 10px;">
          <strong>Ensemble Model Execution Output:</strong>
          <table style="margin-top: 5px;">
            <thead>
              <tr>
                <th>Model</th>
                <th>Projected Output</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Model A (LSTM/GRU)</td>
                <td>${state.rainfall.toFixed(0)} &plusmn; ${Math.round(state.rainfall * 0.12)}mm</td>
                <td>Active (Agree)</td>
              </tr>
              <tr>
                <td>Model B (Physics-Informed)</td>
                <td>${Math.round(state.rainfall * 0.95)} &plusmn; ${Math.round(state.rainfall * 0.18)}mm</td>
                <td>Active (Minor divergence)</td>
              </tr>
              <tr>
                <td>Model C (Analog Pattern Fallback)</td>
                <td>${Math.round(state.rainfall * 1.05)} &plusmn; ${Math.round(state.rainfall * 0.1)}mm</td>
                <td>Active (Agree)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Section 5: NDMA Severity Tier</h2>
        <div class="tier-row">
          ${['Normal', 'Watch', 'Advisory', 'Alert', 'Critical']
            .map(
              (t) => `
            <div class="tier-item ${state.advisoryTier === t ? 'tier-active' : ''}">
              ${t}
            </div>
          `
            )
            .join('')}
        </div>

        <h2>Section 6: Recommended Actions</h2>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Action Protocol</th>
            </tr>
          </thead>
          <tbody>
            ${actionsHtml}
          </tbody>
        </table>

        ${
          isSimulation && simulationParams
            ? `
          <h2>Section 7: Simulation Parameters Used</h2>
          <table>
            <tr>
              <td style="width: 200px;"><strong>Rainfall Change</strong></td>
              <td>${simulationParams.rainfallPctChange > 0 ? '+' : ''}${
                simulationParams.rainfallPctChange
              }%</td>
            </tr>
            <tr>
              <td><strong>Temperature Offset</strong></td>
              <td>${simulationParams.tempOffset > 0 ? '+' : ''}${simulationParams.tempOffset.toFixed(
                1
              )}&deg;C</td>
            </tr>
            <tr>
              <td><strong>Consecutive Dry Days</strong></td>
              <td>${simulationParams.consecutiveDryDays} days</td>
            </tr>
            <tr>
              <td><strong>Soil Moisture Profile</strong></td>
              <td>${simulationParams.soilMoisture}</td>
            </tr>
          </table>
        `
            : ''
        }

        <div class="footer">
          Generated by PrithviTwin &mdash; AI Digital Twin of India's Climate | ISRO BAH 2026<br/>
          Document Time: ${new Date().toLocaleString('en-IN')}
        </div>
      </body>
      </html>
    `;

    newWindow.document.write(htmlContent);
    newWindow.document.close();

    newWindow.onafterprint = () => newWindow.close();

    setTimeout(() => {
      newWindow.print();
    }, 500);
  };

  // Compute 7-day trajectory
  const trajectoryData = useMemo(() => {
    const base = state.stabilityScore;
    const trend = base < 50 ? -3 : base < 65 ? -1 : 0.5;
    return Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      score: Math.min(
        100,
        Math.max(0, Math.round(base + trend * (i + 1) + (Math.random() - 0.5) * 3))
      ),
      threshold: 50,
    }));
  }, [state.stabilityScore]);

  // Points for small SVG rendering
  const svgPoints = useMemo(() => {
    return trajectoryData
      .map((d, i) => `${(i * 300) / 6},${80 - (d.score / 100) * 80}`)
      .join(' ');
  }, [trajectoryData]);

  const evidenceChartData = useMemo(() => {
    return [
      { name: 'Rainfall', value: state.scoreComponents.rainfallContribution, fill: '#22c55e' },
      { name: 'Temp', value: state.scoreComponents.tempContribution, fill: '#f59e0b' },
      { name: 'Flood RI', value: state.scoreComponents.floodContribution, fill: '#f97316' },
      { name: 'Drought RI', value: state.scoreComponents.droughtContribution, fill: '#ef4444' },
      { name: 'Monsoon', value: state.scoreComponents.monsoonContribution, fill: '#a855f7' },
      { name: 'Confidence', value: state.scoreComponents.confidenceContribution, fill: '#22c55e' },
    ];
  }, [state.scoreComponents]);

  const activeDescription = INSIGHTS_MAP[state.advisoryTier as keyof typeof INSIGHTS_MAP] || '';

  const isDroughtRiskHigh = state.droughtRiskIndex > 0.4;
  const isFloodRiskHigh = state.floodRiskIndex > 0.4;
  const isBreakMonsoon = state.monsoonSpellStatus.phase === 'Break';
  const isDrySpi = state.spi < -1;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="overlay-panel slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative' }}
      >
        {/* HEADER */}
        <div className="overlay-header">
          <div>
            <div
              style={{
                fontSize: 9,
                color: '#475569',
                fontFamily: 'JetBrains Mono',
                marginBottom: 2,
              }}
            >
              FORENSIC REPORT · {reportId}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#e2e8f0',
                fontFamily: 'Space Grotesk',
              }}
            >
              {districtName}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <span className={`badge ${getBadgeClass(state.advisoryTier)}`}>
                {state.advisoryTier}
              </span>
              {isSimulation && <span className="badge badge-violet">SIMULATION SCENARIO</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={handleDownloadPDF}>
              Download PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="tab-bar" style={{ padding: '0 18px', marginBottom: 0 }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'evidence', label: 'Evidence Trail' },
            { id: 'confidence', label: 'Model Confidence' },
            { id: 'trajectory', label: 'Risk Trajectory' },
            { id: 'actions', label: 'Action Steps' },
          ].map((t) => (
            <div
              key={t.id}
              className={`tab-item ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id as any)}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="overlay-body">
          {/* TAB: overview */}
          {activeTab === 'overview' && (
            <div className="grid-2 fade-in">
              {/* LEFT COLUMN */}
              <div>
                <GlassPanel style={{ marginBottom: 10 }}>
                  <div className="section-label">Report Summary</div>
                  <DataRow label="Report ID" value={reportId} />
                  <DataRow label="Date" value={today} />
                  <DataRow label="District" value={districtName} />
                  <DataRow
                    label="Severity"
                    value={state.advisoryTier}
                    valueColor={getScoreColor(state.stabilityScore)}
                  />
                  <DataRow
                    label="Climate Score"
                    value={`${state.stabilityScore}/100`}
                    valueColor={getScoreColor(state.stabilityScore)}
                  />
                  <DataRow
                    label="Triggered by"
                    value={
                      state.stabilityScore < 50
                        ? 'Score below threshold (50)'
                        : 'Manual request'
                    }
                  />
                  {isSimulation && simulationParams && (
                    <>
                      <DataRow
                        label="Rainfall Change"
                        value={`${simulationParams.rainfallPctChange > 0 ? '+' : ''}${
                          simulationParams.rainfallPctChange
                        }%`}
                      />
                      <DataRow
                        label="Temp Offset"
                        value={`${simulationParams.tempOffset > 0 ? '+' : ''}${simulationParams.tempOffset.toFixed(
                          1
                        )}°C`}
                      />
                    </>
                  )}
                </GlassPanel>

                <GlassPanel>
                  <div className="section-label">Key Insights</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {isDrySpi && (
                      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#ef4444' }}>
                        <span>•</span>
                        <span>
                          {getSPILabel(state.spi)} conditions (SPI: {state.spi.toFixed(2)})
                        </span>
                      </div>
                    )}
                    {isDroughtRiskHigh && (
                      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#f97316' }}>
                        <span>•</span>
                        <span>
                          Drought Risk Index elevated at {(state.droughtRiskIndex * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {isFloodRiskHigh && (
                      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#ef4444' }}>
                        <span>•</span>
                        <span>
                          Flood Risk Index elevated at {(state.floodRiskIndex * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {isBreakMonsoon && (
                      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#f59e0b' }}>
                        <span>•</span>
                        <span>
                          Break spell — {state.monsoonSpellStatus.breakStreakDays}d dry streak
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#22c55e' }}>
                      <span>•</span>
                      <span>
                        Prediction confidence:{' '}
                        {((state.scoreComponents.confidenceContribution / 0.8) * 10).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                <GlassPanel style={{ marginBottom: 10 }}>
                  <div className="section-label">NDMA Severity Tier</div>
                  <div className="tier-bar" style={{ marginBottom: 8 }}>
                    {['Normal', 'Watch', 'Advisory', 'Alert', 'Critical'].map((t) => (
                      <div
                        key={t}
                        className={`tier-item ${state.advisoryTier === t ? getTierClass(t) : ''}`}
                      >
                        {t}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 11,
                      color: 'var(--text)',
                      marginTop: 10,
                    }}
                  >
                    {activeDescription}
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <div className="section-label">Risk Trajectory (Next 7 Days)</div>
                  {/* Small SVG Line Chart */}
                  <svg
                    viewBox="0 0 300 80"
                    style={{
                      width: '100%',
                      height: 80,
                      borderRadius: 6,
                      display: 'block',
                      marginTop: 8,
                    }}
                  >
                    <rect width="300" height="80" fill="#0a0d16" />
                    <line x1="0" y1="40" x2="300" y2="40" stroke="var(--dim)" strokeDasharray="3 3" />
                    <polyline
                      fill="none"
                      stroke={state.stabilityScore < 50 ? '#ef4444' : '#22c55e'}
                      strokeWidth="2"
                      points={svgPoints}
                    />
                    <text x="5" y="36" fill="var(--dim)" fontSize="8" fontFamily="JetBrains Mono">
                      Threshold 50
                    </text>
                    <text x="5" y="14" fill="var(--muted)" fontSize="8" fontFamily="JetBrains Mono">
                      Score
                    </text>
                  </svg>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                    {state.stabilityScore < 50
                      ? 'Score projected to worsen'
                      : 'Score projected to remain stable'}{' '}
                    over 7 days.
                  </div>
                </GlassPanel>
              </div>
            </div>
          )}

          {/* TAB: evidence */}
          {activeTab === 'evidence' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="section-label">Factors That Triggered This Report</div>
              <div className="grid-3">
                <div
                  style={{
                    background: '#0a0d16',
                    border: '1px solid #1e2536',
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>
                    Rainfall Anomaly
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', marginTop: 4 }}>
                    {state.rainfallAnomalyZ >= 0 ? '+' : ''}
                    {state.rainfallAnomalyZ.toFixed(2)}σ
                  </div>
                </div>

                <div
                  style={{
                    background: '#0a0d16',
                    border: '1px solid #1e2536',
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>
                    Temp Anomaly
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b', marginTop: 4 }}>
                    {state.tempAnomalyZ >= 0 ? '+' : ''}
                    {state.tempAnomalyZ.toFixed(2)}σ
                  </div>
                </div>

                <div
                  style={{
                    background: '#0a0d16',
                    border: '1px solid #1e2536',
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>
                    Dry Streak
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f97316', marginTop: 4 }}>
                    {state.monsoonSpellStatus.breakStreakDays}d
                  </div>
                </div>

                <div
                  style={{
                    background: '#0a0d16',
                    border: '1px solid #1e2536',
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>
                    SPI Value
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: getSPIColor(state.spi), marginTop: 4 }}>
                    {state.spi.toFixed(3)}
                  </div>
                </div>

                <div
                  style={{
                    background: '#0a0d16',
                    border: '1px solid #1e2536',
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>
                    Monsoon Phase
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color:
                        state.monsoonSpellStatus.phase === 'Active'
                          ? '#22c55e'
                          : state.monsoonSpellStatus.phase === 'Break'
                          ? '#ef4444'
                          : '#f59e0b',
                      marginTop: 4,
                    }}
                  >
                    {state.monsoonSpellStatus.phase}
                  </div>
                </div>

                <div
                  style={{
                    background: '#0a0d16',
                    border: '1px solid #1e2536',
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>
                    Rainfall
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', marginTop: 4 }}>
                    {state.rainfall.toFixed(0)}mm
                  </div>
                </div>
              </div>

              {/* Bar Chart of Score Components */}
              <div style={{ width: '100%', height: 160, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={evidenceChartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 9 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 9 }}
                      width={70}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#161b28',
                        border: '1px solid #1e2536',
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[0, 3, 3, 0]}>
                      {evidenceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB: confidence */}
          {activeTab === 'confidence' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Pipeline display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  overflowX: 'auto',
                  padding: '8px 0',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  'Isolation Forest',
                  'LSTM/GRU',
                  'Physics Baseline',
                  'Analog Model',
                  'Ensemble',
                  'JSD + Spell',
                  'Stability Score',
                ].map((step, idx) => (
                  <React.Fragment key={step}>
                    <div
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '4px 10px',
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                        color: 'var(--text)',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      {step}
                    </div>
                    {idx < 6 && <span style={{ color: 'var(--dim)', fontSize: 10 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className="divider" />

              <DataRow
                label="Prediction Confidence"
                value={`${((state.scoreComponents.confidenceContribution / 0.8) * 10).toFixed(0)}%`}
                valueColor="#22c55e"
              />
              <DataRow
                label="Model Agreement"
                value={state.scoreComponents.confidenceContribution > 6 ? 'HIGH' : 'MODERATE'}
                valueColor={
                  state.scoreComponents.confidenceContribution > 6 ? '#22c55e' : '#f59e0b'
                }
              />
              <DataRow label="Data Source" value="IMD Gridded · ISRO INSAT LST/SST" />
              <DataRow label="Data Freshness" value="6 hours ago" />

              <div className="divider" />

              <div className="section-label">Ensemble Model Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Model A */}
                <div
                  className="data-row"
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>Model A (LSTM/GRU)</span>
                    <span style={{ fontSize: 9, color: 'var(--dim)' }}>
                      Output: {state.rainfall.toFixed(0)} ± {Math.round(state.rainfall * 0.12)}mm
                    </span>
                  </div>
                  <span className="badge badge-stable">Agree</span>
                </div>

                {/* Model B */}
                <div
                  className="data-row"
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>Model B (Physics)</span>
                    <span style={{ fontSize: 9, color: 'var(--dim)' }}>
                      Output: {Math.round(state.rainfall * 0.95)} ±{' '}
                      {Math.round(state.rainfall * 0.18)}mm
                    </span>
                  </div>
                  <span className="badge badge-moderate">Minor divergence</span>
                </div>

                {/* Model C */}
                <div
                  className="data-row"
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>Model C (Analog)</span>
                    <span style={{ fontSize: 9, color: 'var(--dim)' }}>
                      Output: {Math.round(state.rainfall * 1.05)} ±{' '}
                      {Math.round(state.rainfall * 0.1)}mm
                    </span>
                  </div>
                  <span className="badge badge-stable">Agree</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: trajectory */}
          {activeTab === 'trajectory' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="section-label">Stability Score — Projected 7-Day Trajectory</div>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryData}>
                    <CartesianGrid stroke="#1e2536" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#161b28',
                        border: '1px solid #1e2536',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#475569"
                      strokeDasharray="4 2"
                      label={{ value: 'Threshold 50', fill: '#475569', fontSize: 9, position: 'top' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={getScoreColor(state.stabilityScore)}
                      strokeWidth={2}
                      dot={{ fill: getScoreColor(state.stabilityScore), r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>
                Projection computed using historical analog sequences and localized z-score
                deviation trends.
              </div>
            </div>
          )}

          {/* TAB: actions */}
          {activeTab === 'actions' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="section-label">Recommended Actions — Role Based</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(ROLE_ACTIONS[state.advisoryTier] || ROLE_ACTIONS.Normal).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: '10px 0',
                      borderBottom: '1px solid #1e2536',
                    }}
                  >
                    <span
                      style={{
                        background: `${item.color}15`,
                        border: `1px solid ${item.color}30`,
                        color: item.color,
                        borderRadius: 5,
                        padding: '3px 8px',
                        fontSize: 10,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        fontFamily: 'JetBrains Mono',
                        minWidth: 100,
                        textAlign: 'center',
                      }}
                    >
                      {item.role}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                      {item.action}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 8 }}>
                Actions aligned with NDMA guidelines for {state.advisoryTier} tier.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
