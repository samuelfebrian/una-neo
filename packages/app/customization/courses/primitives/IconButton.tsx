/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RenderIcon } from './IconSlot';
import type { IconSlotFn } from '../types';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconSlot?: IconSlotFn;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  iconSlot,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-blue-500',
    secondary:
      'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
    danger:
      'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 focus-visible:ring-rose-500'
  };

  const sizeClasses = {
    sm: 'w-7 h-7 p-1 rounded-md',
    md: 'w-9 h-9 p-2 rounded-lg',
    lg: 'w-10 h-10 p-2.5 rounded-lg'
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <RenderIcon name={icon} className="w-full h-full" iconSlot={iconSlot} />
    </button>
  );
}

export default IconButton;
