/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ProgressBarProps {
  percent: number;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  percent,
  height = 'md',
  showLabel = false,
  className = ''
}: ProgressBarProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
          <span>Completion</span>
          <span className="font-mono tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
            {safePercent}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={safePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${safePercent}%`}
        className={`w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden ${heightClasses[height]}`}
      >
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
