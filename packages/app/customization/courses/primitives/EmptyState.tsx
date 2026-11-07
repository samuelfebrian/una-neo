/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from './Button';
import { RenderIcon } from './IconSlot';
import type { IconSlotFn } from '../types';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'book',
  actionLabel,
  onAction,
  iconSlot,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/60 dark:bg-slate-900/60 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
        <RenderIcon name={icon} className="w-6 h-6" iconSlot={iconSlot} />
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
