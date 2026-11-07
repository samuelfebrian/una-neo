/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from "app/ui/atoms/icon";

export interface ReactionsProps {
  reactions?: { [key: string]: number | undefined };
  userReactions?: string[];
  onReaction?: (key: string) => void;
  className?: string;
}

export function Reactions({
  reactions = {},
  userReactions = [],
  onReaction,
  className = ''
}: ReactionsProps) {
  const getIcon = (key: string) => {
    switch (key) {
      case 'heart':
        return <Icon icon="Heart" className="w-3.5 h-3.5" />;
      case 'sparkles':
        return <Icon icon="Sparkles" className="w-3.5 h-3.5" />;
      case 'like':
      default:
        return <Icon icon="ThumbsUp" className="w-3.5 h-3.5" />;
    }
  };

  const entries = Object.entries(reactions).filter(([_, count]) => (count ?? 0) > 0);

  if (entries.length === 0 && !onReaction) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {entries.map(([key, count]) => {
        const isReacted = userReactions.includes(key);

        return (
          <button
            key={key}
            type="button"
            onClick={() => onReaction?.(key)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none ${
              isReacted
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            } ${onReaction ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {getIcon(key)}
            <span className="font-mono tabular-nums text-[11px]">{count}</span>
          </button>
        );
      })}

      {onReaction && (
        <button
          type="button"
          onClick={() => onReaction('like')}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          title="Add Reaction"
        >
          <Icon icon="ThumbsUp" className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default Reactions;
