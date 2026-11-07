/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from "app/ui/atoms/icon";

export interface RatingsProps {
  avg: number;
  votes?: number;
  max?: number;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md';
  interactive?: boolean;
  className?: string;
}

export function Ratings({
  avg = 0,
  votes,
  max = 5,
  onRate,
  size = 'sm',
  interactive = false,
  className = ''
}: RatingsProps) {
  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center text-amber-400">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(avg);
          const half = !filled && i < avg;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(i + 1)}
              className={`p-0.5 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
              aria-label={`Rate ${i + 1} stars`}
            >
              <Icon
                icon="Star"
                className={`${starSizes[size]} ${
                  filled || half ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      <span className="font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
        {avg.toFixed(1)}
      </span>

      {votes !== undefined && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({votes.toLocaleString()})
        </span>
      )}
    </div>
  );
}

export default Ratings;
