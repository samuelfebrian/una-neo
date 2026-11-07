/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface RichTextProps {
  html: string;
  className?: string;
}

export function RichText({ html, className = '' }: RichTextProps) {
  if (!html) return null;

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-sm ${className}`}
      style={{
        overscrollBehavior: 'contain',
        wordBreak: 'break-word'
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default RichText;
