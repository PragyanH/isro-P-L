'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { indiaStateSummaries } from '@/lib/seedData';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';
import StatCard from '@/components/StatCard';
import DataRow from '@/components/DataRow';

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

function getBadgeVariant(score: number): 'stable' | 'moderate' | 'elevated' | 'critical' | 'dim' {
  if (score >= 80) return 'stable';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'elevated';
  return 'critical';
}

export default function Home() {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    score: number;
    band: string;
    color: string;
    risk: string;
    rainfall: number;
    temp: number;
  } | null>(null);

  const router = useRouter();

  // Build state lookup map
  const stateMap = useMemo(() => {
    const m: Record<string, typeof indiaStateSummaries[0]> = {};
    indiaStateSummaries.forEach((s) => {
      m[s.name.toLowerCase()] = s;
      m[s.code.toLowerCase()] = s;
    });
    // aliases for old geojson names
    const aliases: Record<string, string> = {
      orissa: 'odisha',
      uttaranchal: 'uttarakhand',
      pondicherry: 'puducherry',
      'andaman and nicobar': 'andaman and nicobar islands',
    };
    Object.entries(aliases).forEach(([alias, canonical]) => {
      if (m[canonical]) m[alias] = m[canonical];
    });
    return m;
  }, []);

  // Compute counts for national summary
  const { stableCount, moderateCount, elevatedCount, criticalCount } = useMemo(() => {
    let s = 0,
      m = 0,
      e = 0,
      c = 0;
    indiaStateSummaries.forEach((x) => {
      if (x.stabilityScore >= 80) s++;
      else if (x.stabilityScore >= 60) m++;
      else if (x.stabilityScore >= 40) e++;
      else c++;
    });
    return { stableCount: s, moderateCount: m, elevatedCount: e, criticalCount: c };
  }, []);

  // Attention required (score < 50), sort ascending, take first 6
  const attentionStates = useMemo(() => {
    return indiaStateSummaries
      .filter((s) => s.stabilityScore < 50)
      .sort((a, b) => a.stabilityScore - b.stabilityScore)
      .slice(0, 6);
  }, []);

  // Most stable (score >= 75), sort descending, take 3
  const stableStates = useMemo(() => {
    return indiaStateSummaries
      .filter((s) => s.stabilityScore >= 75)
      .sort((a, b) => b.stabilityScore - a.stabilityScore)
      .slice(0, 3);
  }, []);

  return (
    <>
      <Topbar
        breadcrumbs={[{ label: 'India Map' }]}
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: '#94a3b8',
              }}
            >
              <div className="pulse-dot" />
              LIVE TWIN ACTIVE
            </div>
            <span className="badge badge-stable">Model Agreement: 0.82</span>
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
        {/* LEFT COLUMN: Map */}
        <div style={{ flex: 2.5, height: '100%' }}>
          <GlassPanel
            className="fade-in"
            style={{
              padding: 0,
              overflow: 'hidden',
              position: 'relative',
              height: '100%',
            }}
          >
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [82, 22], scale: 1000 }}
              style={{ width: '100%', height: '100%', background: '#0a0d16' }}
            >
              <ZoomableGroup center={[82, 22]} zoom={1} minZoom={0.8} maxZoom={4}>
                <Geographies geography="/india-states.geojson">
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const props = geo.properties as any;
                      const rawName = (
                        props.NAME_1 ||
                        props.ST_NM ||
                        props.name ||
                        ''
                      ).toLowerCase();
                      const stateData = stateMap[rawName];
                      const color = stateData
                        ? getScoreColor(stateData.stabilityScore) + 'BB'
                        : '#1e2536';
                      const isKarnataka = rawName.includes('karnatak');

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={color}
                          stroke="#1e2536"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: {
                              outline: 'none',
                              filter: 'brightness(1.3)',
                              cursor: stateData ? 'pointer' : 'default',
                            },
                            pressed: { outline: 'none' },
                          }}
                          onMouseEnter={(evt: React.MouseEvent) => {
                            if (!stateData) return;
                            setTooltip({
                              x: evt.clientX,
                              y: evt.clientY,
                              name: stateData.name,
                              score: stateData.stabilityScore,
                              band: getScoreBand(stateData.stabilityScore),
                              color: getScoreColor(stateData.stabilityScore),
                              risk: stateData.primaryRisk,
                              rainfall: stateData.rainfall,
                              temp: stateData.temp,
                            });
                          }}
                          onMouseMove={(evt: React.MouseEvent) => {
                            if (tooltip) {
                              setTooltip((prev) =>
                                prev
                                  ? { ...prev, x: evt.clientX, y: evt.clientY }
                                  : null
                              );
                            }
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={() => {
                            if (isKarnataka) {
                              router.push('/karnataka');
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* LEGEND */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(11,14,23,0.9)',
                border: '1px solid #1e2536',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <div className="section-label" style={{ fontSize: 9, marginBottom: 6 }}>
                CLIMATE STABILITY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: '#22c55e',
                    }}
                  />
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                    Stable (80–100)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: '#f59e0b',
                    }}
                  />
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                    Moderate (60–79)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: '#f97316',
                    }}
                  />
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                    Elevated (40–59)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: '#ef4444',
                    }}
                  />
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                    Critical (&lt;40)
                  </span>
                </div>
              </div>
            </div>

            {/* STATUS BAR */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                fontSize: 10,
                color: '#475569',
                fontFamily: 'JetBrains Mono',
              }}
            >
              Last assimilation: 6 hrs ago
            </div>
          </GlassPanel>
        </div>

        {/* RIGHT COLUMN: Stats Panels */}
        <div
          className="slide-up"
          style={{
            flex: 1,
            minWidth: 220,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto',
          }}
        >
          {/* Panel 1 — National Summary */}
          <GlassPanel>
            <div className="section-label">National Summary</div>
            <div className="grid-2">
              <StatCard
                label="STABLE"
                value={stableCount}
                color="#22c55e"
              />
              <StatCard
                label="MODERATE"
                value={moderateCount}
                color="#f59e0b"
              />
              <StatCard
                label="ELEVATED"
                value={elevatedCount}
                color="#f97316"
              />
              <StatCard
                label="CRITICAL"
                value={criticalCount}
                color="#ef4444"
              />
            </div>
          </GlassPanel>

          {/* Panel 2 — Attention Required */}
          <GlassPanel>
            <div className="section-label">Attention Required</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {attentionStates.map((state) => (
                <DataRow
                  key={state.name}
                  label={state.name}
                  value={`${state.stabilityScore} ${getScoreBand(state.stabilityScore)}`}
                  valueColor={getScoreColor(state.stabilityScore)}
                />
              ))}
            </div>
          </GlassPanel>

          {/* Panel 3 — Most Stable */}
          <GlassPanel>
            <div className="section-label">Most Stable</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stableStates.map((state) => (
                <DataRow
                  key={state.name}
                  label={state.name}
                  value={`${state.stabilityScore} ${getScoreBand(state.stabilityScore)}`}
                  valueColor={getScoreColor(state.stabilityScore)}
                />
              ))}
            </div>
          </GlassPanel>

          {/* Panel 4 — Monsoon Status */}
          <GlassPanel>
            <div className="section-label">Monsoon Status</div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--green)',
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Active: Southwest Monsoon
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-stable">JSD: Low Shift</span>
              <span className="badge badge-violet">Spell Dev: +2d</span>
            </div>
            <DataRow
              label="Model Agreement"
              value="0.82 — High"
              valueColor="#22c55e"
            />
            <DataRow
              label="Data Freshness"
              value="6 hrs ago"
              valueColor="#475569"
            />
          </GlassPanel>

          {/* Panel 5 — Karnataka CTA */}
          <GlassPanel glow="green">
            <div className="section-label">Deep-dive Pilot</div>
            <div
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              Karnataka PoC
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, marginBottom: 8 }}>
              Click the map or button to explore all 30 districts with full drilldown
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => router.push('/karnataka')}
            >
              Open Karnataka →
            </button>
          </GlassPanel>
        </div>
      </div>

      {/* TOOLTIP */}
      {tooltip && (
        <div
          className="map-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#e2e8f0',
              marginBottom: 6,
            }}
          >
            {tooltip.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 18,
                fontWeight: 600,
                color: tooltip.color,
              }}
            >
              {tooltip.score}
            </span>
            <span style={{ fontSize: 10, color: tooltip.color }}>
              /100 · {tooltip.band}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>
            {tooltip.risk}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
            <span style={{ color: '#22c55e', fontFamily: 'JetBrains Mono' }}>
              {tooltip.rainfall}mm
            </span>
            <span style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
              {tooltip.temp}°C
            </span>
          </div>
        </div>
      )}
    </>
  );
}
