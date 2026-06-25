'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { karnatakaDistricts, karnatakaIncident } from '@/lib/seedData';
import { computeWhatIf } from '@/lib/climateEngine';
import Topbar from '@/components/Topbar';
import GlassPanel from '@/components/GlassPanel';
import StatCard from '@/components/StatCard';

// Lazy import ForensicReport to avoid circular dependencies
const ForensicReport = dynamic(() => import('@/components/ForensicReport'), {
  ssr: false,
});

export default function CaseStudyPage() {
  const router = useRouter();
  const [showReport, setShowReport] = useState(false);

  const belagavi = karnatakaDistricts.find((d) => d.name === 'Belagavi')!;

  const incidentState = computeWhatIf(belagavi, {
    rainfallPctChange: karnatakaIncident.rainfallPctChange,
    tempOffset: karnatakaIncident.tempOffset,
    consecutiveDryDays: karnatakaIncident.consecutiveDryDaysBefore,
    soilMoisture: karnatakaIncident.soilMoisture,
    monsoonActiveDays: karnatakaIncident.monsoonActiveDays,
    monsoonBreakDays: karnatakaIncident.monsoonBreakDays,
    compoundMode: true,
  });

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'Case Study' }]} />
      <div className="page-content fade-in">
        {/* Header Panel */}
        <GlassPanel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                {karnatakaIncident.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>
                {karnatakaIncident.location} · {karnatakaIncident.date}
              </div>
            </div>
            <span className="badge badge-critical">
              NDMA Severity: {incidentState.advisoryTier}
            </span>
          </div>
        </GlassPanel>

        {/* 2-column grid */}
        <div className="grid-2">
          {/* Left Column: Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard
              label="Recorded Rainfall"
              value={karnatakaIncident.recordedRainfall}
              unit="mm"
              color="#ef4444"
              sub={`vs ${belagavi.baselineRainfall}mm baseline`}
              subColor="var(--dim)"
            />
            <StatCard
              label="Recorded Temp"
              value={karnatakaIncident.recordedTemp}
              unit="°C"
              color="#f59e0b"
              sub={`vs ${belagavi.baselineTemp}°C baseline`}
              subColor="var(--dim)"
            />
            <StatCard
              label="Active Spell Days"
              value={karnatakaIncident.monsoonActiveDays}
              unit="days"
              color="#a855f7"
              sub="Climatological extreme"
              subColor="var(--dim)"
            />
            <StatCard
              label="Stability Score"
              value={incidentState.stabilityScore}
              unit="/100"
              color="#ef4444"
              sub={incidentState.scoreBand}
              subColor="#ef4444"
            />
          </div>

          {/* Right Column: Narrative */}
          <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-label">Incident Narrative & AI Analysis</div>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              {karnatakaIncident.description}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginTop: 4 }}>
              <strong>PrithviTwin Early Advisory Action:</strong> With this telemetry preloaded,
              PrithviTwin would have detected the combination of saturated soil moisture and active
              spell deviations 72 hours prior to crest overflow. It would have triggered an NDMA
              &apos;Critical&apos; Advisory Tier, warning of extreme runoff.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button
                className="btn btn-primary"
                onClick={() => router.push('/simulator?district=Belagavi')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Run Scenario in Simulator →
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowReport(true)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                View Forensic Report →
              </button>
            </div>
          </GlassPanel>
        </div>
      </div>

      {showReport && (
        <ForensicReport
          state={incidentState}
          districtName="Belagavi District"
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
