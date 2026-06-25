import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  sub?: string;
  subColor?: string;
}

export default function StatCard({
  label,
  value,
  unit,
  color = '#e2e8f0',
  sub,
  subColor,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-lbl">{label}</div>
      <div className="stat-val" style={{ color }}>
        {value}
        {unit && <span style={{ fontSize: 12, color: '#475569' }}> {unit}</span>}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: subColor || '#475569', marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
