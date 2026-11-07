/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from "app/ui/atoms/icon";

export interface DragListItem {
  id: number | string;
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

export interface DragListProps {
  items: DragListItem[];
  onReorder: (idsInOrder: (number | string)[]) => void;
  className?: string;
}

export function DragList({ items, onReorder, className = '' }: DragListProps) {
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const moved = newItems.splice(index, 1)[0];
    if (!moved) return;
    newItems.splice(targetIndex, 0, moved);
    onReorder(newItems.map((item) => item.id));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 cursor-grab">
              <Icon icon="GripVertical" className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {item.title}
              </div>
              {item.subtitle && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {item.subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.extra}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveItem(index, 'up')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Move up"
                aria-label={`Move ${item.title} up`}
              >
                <Icon icon="ChevronUp" className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 'down')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-l border-slate-200 dark:border-slate-800"
                title="Move down"
                aria-label={`Move ${item.title} down`}
              >
                <Icon icon="ChevronDown" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DragList;
