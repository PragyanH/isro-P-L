'use client';

import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

function getColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getBand(score: number): string {
  if (score >= 80) return 'STABLE';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'ELEVATED';
  return 'CRITICAL';
}

export default function ScoreRing({
  score,
  size = 'md',
  showLabel = true,
  animated = true,
}: ScoreRingProps) {
  const sizeMap = { sm: 48, md: 80, lg: 120 };
  const strokeMap = { sm: 4, md: 6, lg: 8 };

  const dim = sizeMap[size];
  const stroke = strokeMap[size];
  const cx = dim / 2;
  const cy = dim / 2;
  const r = dim / 2 - stroke * 1.5;

  const color = getColor(score);
  const circumference = 2 * Math.PI * r;
  const progress = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const transitionStyle = animated
    ? { transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }
    : undefined;

  const fontSizes = { lg: 40, md: 22, sm: 0 };
  const fontSize = fontSizes[size];

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress arc circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={transitionStyle}
        />
        {/* Center text / dot */}
        {size !== 'sm' ? (
          <text
            x={cx}
            y={cy}
            fontFamily="JetBrains Mono"
            fill={color}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight="bold"
          >
            {score}
          </text>
        ) : (
          <circle cx={cx} cy={cy} r={4} fill={color} />
        )}
      </svg>
      {showLabel && size !== 'sm' && (
        <div
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 10,
            color: color,
            textAlign: 'center',
            letterSpacing: '0.1em',
            marginTop: 4,
          }}
        >
          {getBand(score)}
        </div>
      )}
    </div>
  );
}
