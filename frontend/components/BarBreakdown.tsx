import React from 'react';

interface BarBreakdownItem {
  label: string;
  value: number;
  max: number;
  color: string;
}

interface BarBreakdownProps {
  items: BarBreakdownItem[];
}

export default function BarBreakdown({ items }: BarBreakdownProps) {
  return (
    <>
      {items.map((item, index) => (
        <div key={index} className="bar-row">
          <div className="bar-label">{item.label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                background: item.color,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              color: item.color,
              minWidth: 32,
              textAlign: 'right',
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </>
  );
}
