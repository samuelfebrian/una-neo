/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export function ProgressRing({
  percent,
  size = 36,
  strokeWidth = 3.5,
  showText = true,
  className = ''
}: ProgressRingProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={safePercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${safePercent}%`}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-slate-800 fill-none"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-blue-600 dark:stroke-blue-500 fill-none transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className="absolute font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
          {safePercent}%
        </span>
      )}
    </div>
  );
}

export default ProgressRing;
