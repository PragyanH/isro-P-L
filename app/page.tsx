'use client';

import { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { useRouter } from 'next/navigation';
import GlassPanel from '@/components/GlassPanel';
import OrbitalRing from '@/components/OrbitalRing';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import { indiaStateSummaries, karnatakaDistricts } from '@/lib/seedData';
import { getScoreBand } from '@/lib/climateEngine';

const INDIA_TOPO = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';

interface TooltipState {
  x: number; y: number;
  name: string; score: number; risk: string; rainfall: number; temp: number;
}

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [showSim, setShowSim] = useState(false);
  const [simBaseline] = useState(karnatakaDistricts[0]);

  // Systems-online animation
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const stateScoreMap = useMemo(() => {
    const m: Record<string, typeof indiaStateSummaries[0]> = {};
    indiaStateSummaries.forEach(s => {
      m[s.name.toLowerCase()] = s;
      m[s.code.toLowerCase()] = s;
    });
    return m;
  }, []);

  const getStateData = (geoProps: Record<string, string>) => {
    const name = (geoProps.NAME_1 || geoProps.ST_NM || geoProps.name || '').toLowerCase();
    return stateScoreMap[name] || null;
  };

  const getColor = (score: number | undefined): string => {
    if (score === undefined) return 'rgba(28,35,51,0.8)';
    return getScoreBand(score).hex + 'CC';
  };

  return (
    <div className={`min-h-screen relative ${ready ? 'animate-systems-online' : 'opacity-0'}`}>

      {/* ── Hero Header ──────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div className="pointer-events-auto animate-slide-up">
            <GlassPanel padding="px-4 py-3">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="font-display font-bold text-white text-lg leading-tight">
                    India Climate Digital Twin
                  </h1>
                  <p className="text-xs text-text-dim mt-0.5">District-level · Real-time recompute · ISRO satellite data</p>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* National Summary */}
          <div className="pointer-events-auto animate-slide-up delay-200 hidden lg:block">
            <GlassPanel padding="px-4 py-3">
              <div className="text-[10px] text-text-dim uppercase tracking-widest mb-2">National Summary</div>
              <div className="flex gap-4">
                {[
                  { label: 'Stable',       count: indiaStateSummaries.filter(s => s.stabilityScore >= 80).length, color: '#00E5FF' },
                  { label: 'Moderate',     count: indiaStateSummaries.filter(s => s.stabilityScore >= 60 && s.stabilityScore < 80).length, color: '#FFD23F' },
                  { label: 'Elevated',     count: indiaStateSummaries.filter(s => s.stabilityScore >= 40 && s.stabilityScore < 60).length, color: '#FF6B35' },
                  { label: 'Critical',     count: indiaStateSummaries.filter(s => s.stabilityScore < 40).length, color: '#FF3366' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="font-mono font-bold text-lg" style={{ color: item.color }}>{item.count}</div>
                    <div className="text-[10px] text-text-dim">{item.label}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────── */}
      <div className="w-full" style={{ height: 'calc(100vh - 56px)' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [82, 22], scale: 1000 }}
          style={{ width: '100%', height: '100%', background: '#0A0E1A' }}
        >
          <ZoomableGroup center={[82, 22]} zoom={1} minZoom={0.8} maxZoom={5}>
            <Geographies geography={INDIA_TOPO}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const stateData = getStateData(geo.properties);
                  const score = stateData?.stabilityScore;
                  const isKarnataka = geo.properties.NAME_1?.toLowerCase().includes('karnatak');

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(score)}
                      stroke="rgba(0,229,255,0.15)"
                      strokeWidth={0.5}
                      style={{
                        default:  { outline: 'none', transition: 'fill 0.2s ease' },
                        hover:    { outline: 'none', fill: isKarnataka ? '#00E5FF80' : (getColor(score).slice(0, -2) + 'FF'), filter: 'brightness(1.3)', cursor: 'pointer' },
                        pressed:  { outline: 'none' },
                      }}
                      onMouseEnter={(evt: React.MouseEvent) => {
                        if (!stateData) return;
                        setTooltip({
                          x: evt.clientX, y: evt.clientY,
                          name: stateData.name,
                          score: stateData.stabilityScore,
                          risk: stateData.primaryRisk,
                          rainfall: stateData.rainfall,
                          temp: stateData.temp,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        if (isKarnataka) { router.push('/karnataka'); return; }
                        if (stateData) setTooltip(null);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* ── Hover Tooltip ─────────────────────────────── */}
      {tooltip && (
        <div
          className="fixed z-30 pointer-events-none animate-fade-in"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
        >
          <GlassPanel padding="p-3" glow={getScoreBand(tooltip.score).band === 'Critical' ? 'red' : 'none'}>
            <div className="flex items-center gap-3 min-w-[180px]">
              <OrbitalRing score={tooltip.score} size="sm" animated={false} showLabel={false} />
              <div>
                <p className="font-display font-semibold text-white text-sm">{tooltip.name}</p>
                <p className="font-mono text-xs" style={{ color: getScoreBand(tooltip.score).hex }}>
                  Score: {tooltip.score} · {getScoreBand(tooltip.score).band}
                </p>
                <p className="text-[10px] text-text-dim mt-0.5">{tooltip.risk}</p>
                <div className="flex gap-3 mt-1">
                  <span className="font-mono text-[10px] text-signal-cyan">{tooltip.rainfall}mm</span>
                  <span className="font-mono text-[10px] text-warning-yellow">{tooltip.temp}°C</span>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ── Legend ───────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-20 animate-fade-in delay-500">
        <GlassPanel padding="px-3 py-2">
          <div className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Climate Stability</div>
          <div className="space-y-1">
            {[
              { label: 'Stable (80–100)',        color: '#00E5FF' },
              { label: 'Moderate (60–79)',        color: '#FFD23F' },
              { label: 'Elevated Risk (40–59)',   color: '#FF6B35' },
              { label: 'Critical (0–39)',         color: '#FF3366' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: item.color + 'BB' }} />
                <span className="text-[10px] text-white/60">{item.label}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* ── Simulator toggle ─────────────────────────── */}
      <div className="absolute bottom-4 right-4 z-20 animate-fade-in delay-500 flex flex-col items-end gap-3">
        <button
          onClick={() => setShowSim(v => !v)}
          className="px-4 py-2 rounded-lg text-xs font-semibold font-display transition-all border border-signal-cyan/30 bg-signal-cyan/10 text-signal-cyan hover:bg-signal-cyan/20 hover:glow-cyan"
        >
          {showSim ? '✕ Close' : '⚙ What-If Simulator'}
        </button>

        {showSim && (
          <div className="w-[600px] max-w-[90vw] animate-slide-up max-h-[70vh] overflow-y-auto">
            <WhatIfSimulator baseline={simBaseline} title="India-Level Simulator (Bengaluru Urban baseline)" />
          </div>
        )}
      </div>

      {/* ── Karnataka CTA ────────────────────────────── */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 z-20 hidden xl:block animate-slide-in delay-700">
        <GlassPanel padding="p-4" glow="cyan" className="max-w-[200px]">
          <p className="text-xs text-text-dim mb-1">Deep-dive pilot</p>
          <p className="font-display font-bold text-white text-sm mb-3">Karnataka PoC</p>
          <p className="text-[11px] text-text-dim mb-3">2019 North Karnataka Floods — full forensic analysis</p>
          <button
            onClick={() => router.push('/karnataka')}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-signal-cyan text-space-navy hover:brightness-110 transition-all"
          >
            Open Case Study →
          </button>
        </GlassPanel>
      </div>
    </div>
  );
}
