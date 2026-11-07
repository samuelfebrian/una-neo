/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RenderIcon } from './IconSlot';
import type { IconSlotFn } from '../types';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  iconSlot?: IconSlotFn;
  className?: string;
}

export function Breadcrumbs({
  items,
  iconSlot,
  className = ''
}: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-slate-400 dark:text-slate-600 select-none">
                  <RenderIcon name="chevron-right" className="w-3 h-3" iconSlot={iconSlot} />
                </span>
              )}

              {isLast || (!item.onClick && !item.url) ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`font-medium ${
                    isLast
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
