'use client';

import { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import GlassPanel from '@/components/GlassPanel';
import OrbitalRing from '@/components/OrbitalRing';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import ForensicReport from '@/components/ForensicReport';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import { karnatakaDistricts, karnatakaIncident } from '@/lib/seedData';
import { computeWhatIf, defaultOverrides, getScoreBand } from '@/lib/climateEngine';

const KARNATAKA_GEO = 'https://raw.githubusercontent.com/geohacker/india/master/district/karnataka.geojson';

export default function KarnatakaPage() {
  const [ready, setReady] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<typeof karnatakaDistricts[0] | null>(null);
  const [showForensic, setShowForensic] = useState(false);
  const [simLoaded, setSimLoaded] = useState(false);
  const [simBaseline, setSimBaseline] = useState(karnatakaDistricts[4]); // Belagavi default
  const [incidentOverrides, setIncidentOverrides] = useState<Parameters<typeof computeWhatIf>[1] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const districtMap = useMemo(() => {
    const m: Record<string, typeof karnatakaDistricts[0]> = {};
    karnatakaDistricts.forEach(d => { m[d.name.toLowerCase()] = d; });
    return m;
  }, []);

  const getDistrict = (geoProps: Record<string, string>) => {
    const name = (geoProps.DISTRICT || geoProps.NAME_2 || geoProps.name || '').toLowerCase();
    for (const key of Object.keys(districtMap)) {
      if (name.includes(key.split(' ')[0].toLowerCase()) || key.includes(name.split(' ')[0])) {
        return districtMap[key];
      }
    }
    return null;
  };

  const getStateForDistrict = (d: typeof karnatakaDistricts[0]) => {
    const state = computeWhatIf(d, defaultOverrides(d));
    return state;
  };

  const handleStartSimulation = () => {
    const incident = karnatakaIncident;
    const belagavi = karnatakaDistricts.find(d => d.name === 'Belagavi')!;
    setSimBaseline(belagavi);
    setIncidentOverrides({
      rainfallPctChange:  incident.rainfallPctChange,
      tempOffset:         incident.tempOffset,
      consecutiveDryDays: incident.consecutiveDryDaysBefore,
      soilMoisture:       incident.soilMoisture,
      monsoonActiveDays:  incident.monsoonActiveDays,
      monsoonBreakDays:   incident.monsoonBreakDays,
      compoundMode:       true,
    });
    setSimLoaded(true);
  };

  const incidentState = useMemo(() => {
    if (!incidentOverrides) return null;
    return computeWhatIf(simBaseline, incidentOverrides);
  }, [simBaseline, incidentOverrides]);

  return (
    <div className={`min-h-screen ${ready ? 'animate-systems-online' : 'opacity-0'}`}>

      {/* ── Page header ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">Section 2 · Case Study</span>
              <span className="text-[10px] font-mono text-signal-cyan">/ Karnataka</span>
            </div>
            <h1 className="font-display font-bold text-white text-2xl">Karnataka Proof of Concept</h1>
            <p className="text-text-dim text-sm mt-1">District-level digital twin with historical incident validation</p>
          </div>

          {/* Incident card */}
          <GlassPanel padding="p-4" glow={simLoaded ? 'amber' : 'none'} className="max-w-sm animate-slide-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-warning-amber text-base">⚠</span>
              <span className="font-display font-semibold text-white text-sm">{karnatakaIncident.name}</span>
            </div>
            <p className="text-xs text-text-dim mb-3 leading-relaxed">{karnatakaIncident.description}</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/[0.03] rounded p-2">
                <div className="text-[10px] text-text-dim">Recorded Rainfall</div>
                <div className="font-mono text-signal-cyan font-semibold">{karnatakaIncident.recordedRainfall}mm</div>
                <div className="text-[10px] text-text-dim">(7-day window)</div>
              </div>
              <div className="bg-white/[0.03] rounded p-2">
                <div className="text-[10px] text-text-dim">Recorded Temp</div>
                <div className="font-mono text-warning-yellow font-semibold">{karnatakaIncident.recordedTemp}°C</div>
                <div className="text-[10px] text-text-dim">Belagavi, Aug 2019</div>
              </div>
            </div>
            <p className="text-[10px] text-text-dim mb-3 italic">
              These are real recorded values from August 2019. The simulation below uses these as inputs — not as a forecast claim.
            </p>
            {!simLoaded ? (
              <button
                onClick={handleStartSimulation}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-warning-amber text-white hover:brightness-110 transition-all"
              >
                ▶ Start Simulation
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForensic(true)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-critical-red/80 text-white hover:brightness-110 transition-all"
                >
                  🔍 See Forensic Report
                </button>
                <button
                  onClick={() => { setSimLoaded(false); setIncidentOverrides(null); }}
                  className="px-3 py-2.5 rounded-lg text-xs text-text-dim border border-white/10 hover:border-white/20"
                >
                  Reset
                </button>
              </div>
            )}
          </GlassPanel>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Map column */}
          <div className="xl:col-span-2">
            <GlassPanel padding="p-0" className="overflow-hidden">
              <div className="h-[480px] relative">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [76.2, 15.3], scale: 3800 }}
                  style={{ width: '100%', height: '100%', background: '#0A0E1A' }}
                >
                  <Geographies geography={KARNATAKA_GEO}>
                    {({ geographies }: { geographies: any[] }) =>
                      geographies.map((geo: any) => {
                        const d = getDistrict(geo.properties);
                        const state = d ? getStateForDistrict(d) : null;
                        const score = state?.stabilityScore;
                        const isSelected = selectedDistrict?.name === d?.name;

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={score !== undefined ? (getScoreBand(score).hex + (isSelected ? 'FF' : 'AA')) : 'rgba(28,35,51,0.8)'}
                            stroke="rgba(0,229,255,0.2)"
                            strokeWidth={isSelected ? 2 : 0.5}
                            style={{
                              default: { outline: 'none', transition: 'fill 0.2s' },
                              hover:   { outline: 'none', filter: 'brightness(1.4)', cursor: 'pointer' },
                              pressed: { outline: 'none' },
                            }}
                            onClick={() => d && setSelectedDistrict(d)}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {/* Incident pin */}
                  <Marker coordinates={karnatakaIncident.coordinates}>
                    <circle r={8} fill="#FF6B35" opacity={0.9} className="animate-pulse" />
                    <circle r={14} fill="none" stroke="#FF6B35" strokeWidth={1.5} opacity={0.4} />
                    <text textAnchor="middle" y={-18} fill="white" fontSize={9} fontFamily="Inter">
                      {karnatakaIncident.location}
                    </text>
                  </Marker>

                  {/* Live score pins for key districts */}
                  {simLoaded && incidentState && (
                    <Marker coordinates={karnatakaIncident.coordinates}>
                      <text textAnchor="middle" y={30} fill={getScoreBand(incidentState.stabilityScore).hex}
                        fontSize={10} fontFamily="JetBrains Mono" fontWeight="600">
                        Score: {incidentState.stabilityScore}
                      </text>
                    </Marker>
                  )}
                </ComposableMap>

                {/* Map overlay labels */}
                <div className="absolute top-3 left-3">
                  <GlassPanel padding="px-2 py-1">
                    <span className="text-[10px] font-mono text-text-dim">Karnataka · {karnatakaDistricts.length} districts</span>
                  </GlassPanel>
                </div>
              </div>
            </GlassPanel>

            {/* Simulator — loaded when simulation starts */}
            {simLoaded && incidentOverrides && (
              <div className="mt-4 animate-slide-up">
                <WhatIfSimulator
                  baseline={simBaseline}
                  initialOverrides={incidentOverrides}
                  title={`Simulator — ${karnatakaIncident.name} (recorded values loaded)`}
                />
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Selected district */}
            {selectedDistrict ? (
              <div className="animate-slide-up space-y-4">
                <GlassPanel glow={getScoreBand(getStateForDistrict(selectedDistrict).stabilityScore).band === 'Critical' ? 'red' : 'cyan'}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] text-text-dim uppercase tracking-wider">District</div>
                      <h2 className="font-display font-bold text-white text-lg">{selectedDistrict.name}</h2>
                    </div>
                    <button onClick={() => setSelectedDistrict(null)} className="text-text-dim hover:text-white">✕</button>
                  </div>
                  <div className="flex justify-center mb-4">
                    <OrbitalRing score={getStateForDistrict(selectedDistrict).stabilityScore} size="md" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    {[
                      { label: 'Baseline Rainfall', value: `${selectedDistrict.baselineRainfall}mm` },
                      { label: 'Baseline Temp',     value: `${selectedDistrict.baselineTemp}°C` },
                      { label: 'Flood Risk',        value: `${(selectedDistrict.floodRiskBase*100).toFixed(0)}%` },
                      { label: 'Drought Risk',      value: `${(selectedDistrict.droughtRiskBase*100).toFixed(0)}%` },
                    ].map(m => (
                      <div key={m.label} className="bg-white/[0.03] rounded p-2">
                        <div className="text-[10px] text-text-dim">{m.label}</div>
                        <div className="font-mono font-semibold text-white">{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <ScoreBreakdown
                    components={getStateForDistrict(selectedDistrict).scoreComponents}
                    score={getStateForDistrict(selectedDistrict).stabilityScore}
                  />
                </GlassPanel>
              </div>
            ) : (
              <GlassPanel className="text-center">
                <div className="py-8">
                  <p className="text-text-dim text-sm">Click any district on the map</p>
                  <p className="text-text-dim text-xs mt-1">to see its Stability Score and breakdown</p>
                </div>
                <div className="space-y-1.5">
                  {karnatakaDistricts.slice(0, 8).map(d => {
                    const s = getStateForDistrict(d);
                    return (
                      <button
                        key={d.name}
                        onClick={() => setSelectedDistrict(d)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="text-xs text-white/70">{d.name}</span>
                        <span className="font-mono text-xs" style={{ color: getScoreBand(s.stabilityScore).hex }}>
                          {s.stabilityScore}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </GlassPanel>
            )}
          </div>
        </div>
      </div>

      {/* ── Forensic Report Modal ─────────────────────── */}
      {showForensic && incidentState && (
        <ForensicReport
          state={incidentState}
          districtName="Belagavi District"
          incidentName={karnatakaIncident.name}
          onClose={() => setShowForensic(false)}
        />
      )}
    </div>
  );
}
