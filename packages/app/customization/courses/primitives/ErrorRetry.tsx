/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from './Button';
import { RenderIcon } from './IconSlot';
import type { IconSlotFn } from '../types';

export interface ErrorRetryProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function ErrorRetry({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  retryLabel = 'Try Again',
  iconSlot,
  className = ''
}: ErrorRetryProps) {
  return (
    <div
      role="alert"
      className={`p-6 border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <RenderIcon name="alert" className="w-5 h-5" iconSlot={iconSlot} />
      </div>

      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
        {title}
      </h4>
      <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 mb-4 max-w-md">
        {message}
      </p>

      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorRetry;
