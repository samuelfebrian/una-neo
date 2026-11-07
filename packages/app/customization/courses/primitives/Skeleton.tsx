/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = ''
}: SkeletonProps) {
  const base =
    'animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md';

  if (variant === 'circular') {
    return (
      <div
        className={`${base} rounded-full shrink-0 ${className}`}
        style={{ width: width ?? 40, height: height ?? 40 }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 p-4 flex flex-col gap-3 ${className}`}
      >
        <div className="w-full aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="mt-2 flex justify-between items-center">
          <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="w-1/4 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${base} ${variant === 'text' ? 'h-4 w-full' : ''} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined
      }}
    />
  );
}

export default Skeleton;
