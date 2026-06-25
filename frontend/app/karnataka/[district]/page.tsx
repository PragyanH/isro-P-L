'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import dynamic from 'next/dynamic';

import { karnatakaDistricts } from '@/lib/seedData';
import { computeWhatIf, defaultOverrides } from '@/lib/climateEngine';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';
import ScoreRing from '@/components/ScoreRing';
import StatCard from '@/components/StatCard';
import DataRow from '@/components/DataRow';
import BarBreakdown from '@/components/BarBreakdown';

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

function getScoreBand(score: number): string {
  if (score >= 80) return 'STABLE';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'ELEVATED';
  return 'CRITICAL';
}

function getSPILabel(spi: number): string {
  if (spi < -2) return 'Extreme Drought';
  if (spi < -1.5) return 'Severe Drought';
  if (spi < -1) return 'Moderate Drought';
  if (spi < 0) return 'Mild Dry';
  return 'Normal/Wet';
}

function getSPIColor(spi: number): string {
  if (spi < -1.5) return '#ef4444';
  if (spi < -1) return '#f97316';
  if (spi < 0) return '#f59e0b';
  return '#22c55e';
}

function getTierBadgeClass(tier: string): string {
  const map: Record<string, string> = {
    Normal: 'stable',
    Watch: 'moderate',
    Advisory: 'elevated',
    Alert: 'critical',
    Critical: 'critical',
  };
  return 'badge-' + (map[tier] || 'dim');
}

function getRiskBand(v: number): string {
  return v > 0.6 ? 'HIGH' : v > 0.35 ? 'MODERATE' : 'LOW';
}

function getRiskBadge(v: number): 'critical' | 'moderate' | 'stable' {
  return v > 0.6 ? 'critical' : v > 0.35 ? 'moderate' : 'stable';
}

function getTierBadgeVariant(tier: string): 'stable' | 'moderate' | 'elevated' | 'critical' | 'dim' {
  const map: Record<string, 'stable' | 'moderate' | 'elevated' | 'critical' | 'dim'> = {
    Normal: 'stable',
    Watch: 'moderate',
    Advisory: 'elevated',
    Alert: 'critical',
    Critical: 'critical',
  };
  return map[tier] || 'dim';
}

export default function DistrictDrilldownPage() {
  const params = useParams();
  const router = useRouter();
  const [showReport, setShowReport] = useState(false);

  const districtParam = (params.district as string || '').replace(/-/g, ' ');

  // Find district
  const district = useMemo(() => {
    return karnatakaDistricts.find(
      (d) => d.name.toLowerCase() === districtParam.toLowerCase()
    );
  }, [districtParam]);

  const state = useMemo(() => {
    if (!district) return null;
    return computeWhatIf(district, defaultOverrides(district));
  }, [district]);

  // Generate Forecast data
  const forecastData = useMemo(() => {
    if (!state || !district) return [];
    const trend =
      state.droughtRiskIndex > 0.4 ? -0.15 : state.floodRiskIndex > 0.4 ? 0.1 : 0;
    return Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      observed:
        i < 4
          ? Math.max(
              0,
              Math.round(state.rainfall * (1 + trend * i) + (Math.random() - 0.5) * 8)
            )
          : undefined,
      ensemble: Math.max(0, Math.round(state.rainfall * (1 + trend * i))),
      upper: Math.max(0, Math.round(state.rainfall * (1 + trend * i) * 1.2)),
      lower: Math.max(0, Math.round(state.rainfall * (1 + trend * i) * 0.8)),
    }));
  }, [state, district]);

  if (!district || !state) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 16,
        }}
      >
        <h2>District not found</h2>
        <button className="btn btn-primary" onClick={() => router.push('/karnataka')}>
          Back to Karnataka Map
        </button>
      </div>
    );
  }

  const phaseColorMap = {
    Active: '#22c55e',
    Break: '#ef4444',
    Transition: '#f59e0b',
    Normal: '#475569',
  };
  const phaseColor =
    phaseColorMap[state.monsoonSpellStatus.phase as keyof typeof phaseColorMap] ||
    '#475569';

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'India Map', href: '/' },
          { label: 'Karnataka', href: '/karnataka' },
          { label: district.name },
        ]}
        rightContent={
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge ${getTierBadgeClass(state.advisoryTier)}`}>
              {state.advisoryTier} · {state.stabilityScore}/100
            </span>
            <button
              className="btn btn-primary"
              onClick={() => router.push('/simulator?district=' + district.name)}
            >
              Run What-If →
            </button>
            <button className="btn btn-danger" onClick={() => setShowReport(true)}>
              Forensic Report →
            </button>
          </div>
        }
      />

      <div className="page-content fade-in">
        {/* ROW 1: 5 stat cards */}
        <div className="grid-5">
          {/* Stability Score Card (Includes inline ScoreRing) */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div className="stat-lbl">Stability Score</div>
              <div style={{ marginBottom: 4 }}>
                <ScoreRing score={state.stabilityScore} size="sm" showLabel={false} />
              </div>
            </div>
            <div
              className="stat-val"
              style={{ color: getScoreColor(state.stabilityScore) }}
            >
              {state.stabilityScore}
              <span style={{ fontSize: 12, color: '#475569' }}> /100</span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: getScoreColor(state.stabilityScore),
                marginTop: 3,
              }}
            >
              {getScoreBand(state.stabilityScore)}
            </div>
          </div>

          <StatCard
            label="Rainfall"
            value={state.rainfall.toFixed(0)}
            unit="mm"
            color="#22c55e"
            sub={`${state.rainfallAnomalyZ >= 0 ? '+' : ''}${(
              (state.rainfallAnomalyZ * 100) /
              3
            ).toFixed(0)}% anomaly`}
            subColor={state.rainfallAnomalyZ < 0 ? '#ef4444' : '#22c55e'}
          />

          <StatCard
            label="Temperature"
            value={state.temp.toFixed(1)}
            unit="°C"
            color="#f59e0b"
            sub={`${state.tempAnomalyZ >= 0 ? '+' : ''}${state.tempAnomalyZ.toFixed(2)}σ`}
            subColor={state.tempAnomalyZ > 0 ? '#f97316' : '#22c55e'}
          />

          <StatCard
            label="SPI"
            value={state.spi.toFixed(2)}
            color={getSPIColor(state.spi)}
            sub={getSPILabel(state.spi)}
            subColor={getSPIColor(state.spi)}
          />

          <StatCard
            label="Model Agreement"
            value={`${(district.predictionConfidence * 100).toFixed(0)}%`}
            color={district.predictionConfidence > 0.8 ? '#22c55e' : '#f59e0b'}
            sub={
              district.predictionConfidence > 0.8 ? 'High Confidence' : 'Moderate'
            }
            subColor={district.predictionConfidence > 0.8 ? '#22c55e' : '#f59e0b'}
          />
        </div>

        {/* ROW 2: 3 panels (forecast | risk flags | monsoon) */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* PANEL A: 7-Day Rainfall Forecast */}
          <div style={{ flex: 1.5 }}>
            <GlassPanel style={{ height: '100%' }}>
              <div className="section-label">
                7-Day Rainfall Forecast (mm) — Ensemble
              </div>
              <div style={{ width: '100%', height: 180, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={forecastData}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#1e2536" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#475569', fontSize: 10 }}
                    />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#161b28',
                        border: '1px solid #1e2536',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="rgba(34,197,94,0.06)"
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="#161b28"
                    />
                    <Area
                      type="monotone"
                      dataKey="ensemble"
                      stroke="#475569"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      fill="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="observed"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="rgba(34,197,94,0.08)"
                      dot={{ fill: '#22c55e', r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>
          </div>

          {/* PANEL B: Risk Flags & Score Breakdown */}
          <div style={{ flex: 1 }}>
            <GlassPanel style={{ height: '100%' }}>
              <div className="section-label">Risk Flags</div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  marginBottom: 12,
                }}
              >
                <DataRow
                  label="Drought Risk"
                  value={getRiskBand(state.droughtRiskIndex)}
                  badgeVariant={getRiskBadge(state.droughtRiskIndex)}
                />
                <DataRow
                  label="Flood Risk"
                  value={getRiskBand(state.floodRiskIndex)}
                  badgeVariant={getRiskBadge(state.floodRiskIndex)}
                />
                <DataRow
                  label="Heat Stress"
                  value={getRiskBand(state.tempAnomalyZ / 3)}
                  badgeVariant={getRiskBadge(state.tempAnomalyZ / 3)}
                />
                <DataRow
                  label="Overall Risk"
                  value={state.advisoryTier}
                  badgeVariant={getTierBadgeVariant(state.advisoryTier)}
                />
              </div>

              <div className="divider" />

              <div className="section-label" style={{ marginTop: 8 }}>
                Score Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <BarBreakdown
                  items={[
                    {
                      label: 'Rainfall',
                      value: state.scoreComponents.rainfallContribution,
                      max: 25,
                      color: '#22c55e',
                    },
                    {
                      label: 'Temperature',
                      value: state.scoreComponents.tempContribution,
                      max: 15,
                      color: '#f59e0b',
                    },
                    {
                      label: 'Flood RI',
                      value: state.scoreComponents.floodContribution,
                      max: 20,
                      color: '#f97316',
                    },
                    {
                      label: 'Drought RI',
                      value: state.scoreComponents.droughtContribution,
                      max: 20,
                      color: '#ef4444',
                    },
                    {
                      label: 'Monsoon',
                      value: state.scoreComponents.monsoonContribution,
                      max: 12,
                      color: '#a855f7',
                    },
                    {
                      label: 'Confidence',
                      value: state.scoreComponents.confidenceContribution,
                      max: 8,
                      color: '#22c55e',
                    },
                  ]}
                />
              </div>
            </GlassPanel>
          </div>

          {/* PANEL C: Monsoon Spell Status */}
          <div style={{ flex: 1 }}>
            <GlassPanel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="section-label">Monsoon Spell Tracker</div>
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 20,
                    fontWeight: 600,
                    color: phaseColor,
                  }}
                >
                  {state.monsoonSpellStatus.phase}
                </span>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {state.monsoonSpellStatus.label}
                </div>
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
                  {state.monsoonSpellStatus.deviation >= 0 ? '+' : ''}
                  {state.monsoonSpellStatus.deviation}d from climatological mean
                </div>
              </div>

              <div className="divider" style={{ margin: '14px 0' }} />

              <div className="section-label">Advisory Tier — NDMA</div>
              <div className="tier-bar" style={{ marginTop: 4 }}>
                {['Normal', 'Watch', 'Advisory', 'Alert', 'Critical'].map((tier) => (
                  <div
                    key={tier}
                    className={`tier-item ${
                      state.advisoryTier === tier ? 't-' + tier.toLowerCase() : ''
                    }`}
                  >
                    {tier}
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* ROW 3: Score Breakdown full width */}
        <GlassPanel>
          <div className="section-label">Climate Stability Score — How it was computed</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 28,
                fontWeight: 600,
                color: getScoreColor(state.stabilityScore),
              }}
            >
              {state.stabilityScore}
            </span>
            <span style={{ fontSize: 14, color: 'var(--dim)' }}>/100</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 24px',
              margin: '12px 0 16px 0',
            }}
          >
            <BarBreakdown
              items={[
                {
                  label: 'Rainfall Anomaly',
                  value: state.scoreComponents.rainfallContribution,
                  max: 25,
                  color: '#22c55e',
                },
                {
                  label: 'Temperature Anomaly',
                  value: state.scoreComponents.tempContribution,
                  max: 15,
                  color: '#f59e0b',
                },
                {
                  label: 'Flood Risk Index',
                  value: state.scoreComponents.floodContribution,
                  max: 20,
                  color: '#f97316',
                },
                {
                  label: 'Drought Risk Index',
                  value: state.scoreComponents.droughtContribution,
                  max: 20,
                  color: '#ef4444',
                },
                {
                  label: 'Monsoon Spell Status',
                  value: state.scoreComponents.monsoonContribution,
                  max: 12,
                  color: '#a855f7',
                },
                {
                  label: 'Prediction Confidence',
                  value: state.scoreComponents.confidenceContribution,
                  max: 8,
                  color: '#22c55e',
                },
              ]}
            />
          </div>

          <div className="divider" />
          <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
            Weighted formula: Rainfall Anomaly (25%) + Temperature (15%) + Flood Risk
            (20%) + Drought Risk/SPI (20%) + Monsoon Spell (12%) + Confidence (8%)
          </div>
        </GlassPanel>

        {/* ROW 4: Action buttons row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/simulator?district=' + district.name)}
            style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}
          >
            Run What-If Simulation →
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setShowReport(true)}
            style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}
          >
            View Forensic Report →
          </button>
        </div>
      </div>

      {showReport && (
        <ForensicReport
          state={state}
          districtName={district.name}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
