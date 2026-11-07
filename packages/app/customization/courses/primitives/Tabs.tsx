/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { RenderIcon } from './IconSlot';
import type { IconSlotFn } from '../types';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  icon?: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'underline' | 'segmented';
  iconSlot?: IconSlotFn;
  className?: string;
}

export function Tabs({
  items,
  activeKey,
  onChange,
  variant = 'underline',
  iconSlot,
  className = ''
}: TabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % items.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + items.length) % items.length;
    } else {
      return;
    }
    e.preventDefault();
    const nextItem = items[nextIndex];
    if (nextItem && !nextItem.disabled) {
      onChange(nextItem.key);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  if (variant === 'segmented') {
    return (
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Navigation Tabs"
        className={`inline-flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg max-w-full overflow-x-auto no-scrollbar border border-zinc-200/60 dark:border-zinc-700/60 ${className}`}
      >
        {items.map((tab, idx) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer select-none ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {tab.icon && (
                <RenderIcon name={tab.icon} className="w-3.5 h-3.5" iconSlot={iconSlot} />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`font-mono text-[11px] tabular-nums px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      : 'bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Navigation Tabs"
      className={`flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar ${className}`}
    >
      {items.map((tab, idx) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex items-center gap-2 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer select-none -mb-px ${
              isActive
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {tab.icon && (
              <RenderIcon name={tab.icon} className="w-4 h-4" iconSlot={iconSlot} />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="font-mono text-xs tabular-nums px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
