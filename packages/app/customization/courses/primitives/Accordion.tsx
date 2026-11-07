/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RenderIcon } from './IconSlot';
import type { IconSlotFn } from '../types';

export interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function AccordionItem({
  title,
  subtitle,
  leading,
  trailing,
  children,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  iconSlot,
  className = ''
}: AccordionItemProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (controlledOpen === undefined) {
      setUncontrolledOpen(next);
    }
    onToggle?.(next);
  };

  return (
    <div
      className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          {leading && <div className="shrink-0">{leading}</div>}
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {trailing}
          <div className="text-slate-400 dark:text-slate-500 transition-transform duration-200">
            <RenderIcon
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              className="w-4 h-4"
              iconSlot={iconSlot}
            />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/50">
          {children}
        </div>
      )}
    </div>
  );
}

export default AccordionItem;
