/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ChipProps {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({
  label,
  active = false,
  count,
  onClick,
  disabled = false,
  className = ''
}: ChipProps) {
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors select-none ${
        active
          ? 'bg-blue-600 text-white shadow-xs'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`font-mono text-[11px] tabular-nums px-1.5 py-0.2 rounded-full ${
            active
              ? 'bg-blue-700 text-blue-100'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </Component>
  );
}

export default Chip;
