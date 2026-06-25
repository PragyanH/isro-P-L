import React from 'react';

interface DataRowProps {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  badgeVariant?: 'stable' | 'moderate' | 'elevated' | 'critical' | 'dim' | 'violet'; // violet is in CSS badge too, but user lists: 'stable'|'moderate'|'elevated'|'critical'|'dim'
}

export default function DataRow({
  label,
  value,
  valueColor,
  badgeVariant,
}: DataRowProps) {
  return (
    <div className="data-row">
      <span className="data-row-label">{label}</span>
      {badgeVariant ? (
        <span className={`badge badge-${badgeVariant}`}>{value}</span>
      ) : (
        <span className="data-row-val" style={{ color: valueColor || '#e2e8f0' }}>
          {value}
        </span>
      )}
    </div>
  );
}
