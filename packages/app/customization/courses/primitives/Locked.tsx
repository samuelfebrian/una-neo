/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from './Button';
import { RenderIcon } from './IconSlot';
import type { IconSlotFn } from '../types';

export interface LockedProps {
  title?: string;
  reason?: string;
  actionLabel?: string;
  onAction?: () => void;
  prerequisiteTitle?: string;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function Locked({
  title = 'Content Locked',
  reason = 'This content is sequentially locked or requires course enrollment.',
  actionLabel,
  onAction,
  prerequisiteTitle,
  iconSlot,
  className = ''
}: LockedProps) {
  return (
    <div
      aria-disabled="true"
      className={`p-6 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-2xl text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
        <RenderIcon name="lock" className="w-5 h-5" iconSlot={iconSlot} />
      </div>

      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
        {title}
      </h4>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2 max-w-sm">
        {reason}
      </p>

      {prerequisiteTitle && (
        <div className="mb-4 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-md border border-amber-200 dark:border-amber-900/50">
          Required first: {prerequisiteTitle}
        </div>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default Locked;
