/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface DateAgoProps {
  timestamp: number;
  formatTs?: (ts: number) => string;
  className?: string;
}

export function DateAgo({
  timestamp,
  formatTs,
  className = ''
}: DateAgoProps) {
  const [now] = React.useState(() => Date.now());

  if (formatTs) {
    return <span className={className}>{formatTs(timestamp)}</span>;
  }

  const getRelativeTime = (ts: number) => {
    // If timestamp is in seconds, convert to ms
    const timeMs = ts < 1e11 ? ts * 1000 : ts;
    const diff = now - timeMs;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  };

  const iso = new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp).toISOString();

  return (
    <time
      dateTime={iso}
      title={new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp).toLocaleString()}
      className={`font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 ${className}`}
    >
      {getRelativeTime(timestamp)}
    </time>
  );
}

export default DateAgo;
