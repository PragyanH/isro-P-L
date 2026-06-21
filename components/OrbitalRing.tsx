'use client';

import { useEffect, useRef } from 'react';
import { getScoreBand } from '@/lib/climateEngine';

interface OrbitalRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
}

export default function OrbitalRing({ score, size = 'md', animated = true, showLabel = true }: OrbitalRingProps) {
  const prevScore = useRef(score);
  const { hex, band } = getScoreBand(score);

  const dims = { sm: 56, md: 120, lg: 200 };
  const strokes = { sm: 3, md: 5, lg: 8 };
  const fonts = { sm: 'text-xs', md: 'text-2xl', lg: 'text-4xl' };

  const dim = dims[size];
  const stroke = strokes[size];
  const cx = dim / 2;
  const r = cx - stroke * 1.5;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;

  useEffect(() => { prevScore.current = score; }, [score]);

  return (
    <div className="relative flex flex-col items-center gap-1" style={{ width: dim }}>
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className={animated ? 'animate-ring-pulse' : ''}
        style={{ color: hex }}
      >
        {/* Outer decorative orbit */}
        <circle
          cx={cx} cy={cx} r={r + stroke * 1.2}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
          strokeDasharray="4 6"
        />
        {/* Background track */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Score arc */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: animated ? 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' : undefined }}
        />
        {/* Inner glow ring */}
        <circle
          cx={cx} cy={cx} r={r - stroke * 1.5}
          fill="none"
          stroke={hex}
          strokeWidth={0.5}
          opacity={0.2}
        />
        {/* Center score number */}
        {size !== 'sm' && (
          <>
            <text
              x={cx} y={cx + (size === 'lg' ? 6 : 4)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={hex}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="600"
              fontSize={size === 'lg' ? 40 : 22}
              style={{ transition: 'fill 0.5s ease' }}
            >
              {score}
            </text>
            <text
              x={cx} y={cx + (size === 'lg' ? 24 : 16)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.4)"
              fontFamily="'Inter', sans-serif"
              fontSize={size === 'lg' ? 11 : 8}
              letterSpacing="2"
            >
              /100
            </text>
          </>
        )}
        {/* Small mode: just a dot */}
        {size === 'sm' && (
          <circle cx={cx} cy={cx} r={4} fill={hex} opacity={0.9} />
        )}
      </svg>
      {showLabel && size !== 'sm' && (
        <span
          className={`font-mono text-xs tracking-widest uppercase font-semibold`}
          style={{ color: hex, transition: 'color 0.5s ease' }}
        >
          {band}
        </span>
      )}
    </div>
  );
}
