'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { karnatakaDistricts, karnatakaIncident } from '@/lib/seedData';
import { computeWhatIf, defaultOverrides } from '@/lib/climateEngine';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';
import ScoreRing from '@/components/ScoreRing';
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

export default function KarnatakaPage() {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    score: number;
    color: string;
    band: string;
  } | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  // Compute all district states once with useMemo
  const districtStates = useMemo(() => {
    return karnatakaDistricts.map((d) => ({
      district: d,
      state: computeWhatIf(d, defaultOverrides(d)),
    }));
  }, []);

  // Build district name map for GeoJSON matching
  const districtMap = useMemo(() => {
    const m: Record<string, typeof karnatakaDistricts[0]> = {};
    karnatakaDistricts.forEach((d) => {
      m[d.name.toLowerCase()] = d;
    });
    // Alias for bagalkote in geojson matching
    m['bagalkote'] = karnatakaDistricts.find((d) => d.name === 'Bagalkot')!;
    return m;
  }, []);

  // Compute stats
  const alertCount = useMemo(() => {
    return districtStates.filter((ds) => ds.state.stabilityScore < 50).length;
  }, [districtStates]);

  const criticalCount = useMemo(() => {
    return districtStates.filter((ds) => ds.state.stabilityScore < 40).length;
  }, [districtStates]);

  const avgScore = useMemo(() => {
    return Math.round(
      districtStates.reduce((sum, ds) => sum + ds.state.stabilityScore, 0) /
        districtStates.length
    );
  }, [districtStates]);

  // District Attention List (score < 60), sort ascending, take 8
  const attentionDistricts = useMemo(() => {
    return districtStates
      .filter((ds) => ds.state.stabilityScore < 60)
      .sort((a, b) => a.state.stabilityScore - b.state.stabilityScore)
      .slice(0, 8);
  }, [districtStates]);

  // Stable districts (score >= 75), sort descending, take 3
  const stableDistricts = useMemo(() => {
    return districtStates
      .filter((ds) => ds.state.stabilityScore >= 75)
      .sort((a, b) => b.state.stabilityScore - a.state.stabilityScore)
      .slice(0, 3);
  }, [districtStates]);

  return (
    <>
      <Topbar
        breadcrumbs={[{ label: 'India Map', href: '/' }, { label: 'Karnataka' }]}
        rightContent={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-critical">{alertCount} Districts in Alert</span>
            <span style={{ fontSize: 11, color: '#475569' }}>
              Karnataka · 30 Districts
            </span>
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
        {/* LEFT COLUMN: Map Panel */}
        <div style={{ flex: 2, position: 'relative', height: '100%' }}>
          <GlassPanel
            className="fade-in"
            style={{ padding: 0, overflow: 'hidden', height: '100%', position: 'relative' }}
          >
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [76.15, 14.85], scale: 4200 }}
              style={{ width: '100%', height: '100%', background: '#0a0d16' }}
            >
              <ZoomableGroup center={[76.15, 14.85]} zoom={1} minZoom={0.8} maxZoom={6}>
                <Geographies geography="/karnataka-districts.geojson">
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const props = geo.properties as any;
                      const name = (
                        props.district ||
                        props.DISTRICT ||
                        props.NAME_2 ||
                        props.name ||
                        ''
                      )
                        .trim()
                        .toLowerCase();
                      const d = districtMap[name];
                      const ds = d
                        ? districtStates.find((x) => x.district.name === d.name)
                        : null;
                      const score = ds?.state.stabilityScore;
                      const color =
                        score !== undefined ? getScoreColor(score) + 'AA' : '#1e2536';
                      const isHovered = hoveredDistrict === d?.name;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isHovered ? (score !== undefined ? getScoreColor(score) : '#1e2536') : color}
                          stroke="#0f1117"
                          strokeWidth={0.8}
                          style={{
                            default: { outline: 'none', transition: 'fill 0.15s' },
                            hover: {
                              outline: 'none',
                              filter: 'brightness(1.2)',
                              cursor: d ? 'pointer' : 'default',
                            },
                            pressed: { outline: 'none' },
                          }}
                          onMouseEnter={(evt: React.MouseEvent) => {
                            if (!d || !ds) return;
                            setHoveredDistrict(d.name);
                            setTooltip({
                              x: evt.clientX,
                              y: evt.clientY,
                              name: d.name,
                              score: ds.state.stabilityScore,
                              color: getScoreColor(ds.state.stabilityScore),
                              band: getScoreBand(ds.state.stabilityScore),
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
                          onMouseLeave={() => {
                            setHoveredDistrict(null);
                            setTooltip(null);
                          }}
                          onClick={() => {
                            if (!d) return;
                            router.push(
                              '/karnataka/' + d.name.toLowerCase().replace(/ /g, '-')
                            );
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {/* Marker for Belagavi Incident */}
                <Marker coordinates={karnatakaIncident.coordinates}>
                  <circle
                    r={7}
                    fill="#f97316"
                    opacity={0.85}
                    className="pulse-dot"
                    style={{ animation: 'pulse 2s ease-in-out infinite' }}
                  />
                  <circle
                    r={13}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    opacity={0.4}
                  />
                  <text
                    y={-18}
                    textAnchor="middle"
                    fill="#f97316"
                    fontSize={9}
                    fontFamily="Inter"
                  >
                    2019 Flood Incident
                  </text>
                </Marker>
              </ZoomableGroup>
            </ComposableMap>

            {/* Map label overlay */}
            <div
              className="badge badge-dim"
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'rgba(22, 27, 40, 0.85)',
              }}
            >
              Karnataka · 30 districts · click district to drilldown
            </div>
          </GlassPanel>
        </div>

        {/* RIGHT COLUMN: Overview & Lists */}
        <div
          className="slide-up"
          style={{
            flex: 1,
            minWidth: 240,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto',
          }}
        >
          {/* Panel 1 — State Score Overview */}
          <GlassPanel>
            <div className="section-label">Karnataka — State Overview</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ScoreRing score={63} size="md" showLabel={false} />
              <div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#f59e0b',
                  }}
                >
                  63/100 MODERATE
                </div>
                <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                  Advisory: Watch
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Panel 2 — Summary Grid */}
          <div className="grid-2">
            <StatCard label="Total Districts" value={30} />
            <StatCard label="In Alert (<50)" value={alertCount} color="#ef4444" />
            <StatCard label="Average Score" value={avgScore} color="#f59e0b" />
            <StatCard label="Critical (<40)" value={criticalCount} color="#ef4444" />
          </div>

          {/* Panel 3 — District Attention List */}
          <GlassPanel>
            <div className="section-label">Districts Needing Attention</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {attentionDistricts.map((ds) => (
                <div
                  key={ds.district.name}
                  className="data-row"
                  style={{
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    padding: '6px 8px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={() => setHoveredDistrict(ds.district.name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  onClick={() =>
                    router.push(
                      '/karnataka/' + ds.district.name.replace(/ /g, '-').toLowerCase()
                    )
                  }
                >
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>
                    {ds.district.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono',
                        color: getScoreColor(ds.state.stabilityScore),
                        fontWeight: 600,
                      }}
                    >
                      {ds.state.stabilityScore}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--dim)' }}>
                      {getScoreBand(ds.state.stabilityScore)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Panel 4 — Most Stable Districts */}
          <GlassPanel>
            <div className="section-label">Most Stable Districts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stableDistricts.map((ds) => (
                <DataRow
                  key={ds.district.name}
                  label={ds.district.name}
                  value={ds.state.stabilityScore}
                  valueColor="#22c55e"
                />
              ))}
            </div>
          </GlassPanel>

          {/* Panel 5 — Action Button */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            onClick={() => router.push('/simulator?district=Belagavi')}
          >
            Open What-If Simulator →
          </button>
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
              marginBottom: 4,
            }}
          >
            {tooltip.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 16,
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
        </div>
      )}
    </>
  );
}
