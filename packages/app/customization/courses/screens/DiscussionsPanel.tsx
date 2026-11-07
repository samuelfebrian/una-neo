/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DiscussionsPanel: Course-wide community questions, mentorship answers, and study threads.
 */

import React from 'react';
import type { CommentItem, TranslateFn, IconSlotFn } from '../types';
import { CommentThread } from '../primitives/CommentThread';
import { defaultT } from '../tokens/i18n';

export interface DiscussionsPanelProps {
  comments: CommentItem[];
  courseTitle?: string;
  /** Hide the kit thread when a native UNA discussions widget is embedded (avoids duplicates). */
  guidelinesOnly?: boolean;
  onPostComment?: (text: string, replyTo?: number) => void;
  onEditComment?: (id: number, text: string) => void;
  onDeleteComment?: (id: number) => void;
  onVoteComment?: (id: number, dir: 1 | -1) => void;
  onReportComment?: (id: number) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function DiscussionsPanel({
  comments,
  courseTitle,
  guidelinesOnly = false,
  onPostComment,
  onEditComment,
  onDeleteComment,
  onVoteComment,
  onReportComment,
  t = defaultT,
  iconSlot,
  className = ''
}: DiscussionsPanelProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400">
        <p className="font-medium text-slate-800 dark:text-slate-200 mb-0.5">
          Course Discussion Guidelines
        </p>
        <p>
          Ask questions, discuss topics from {courseTitle || 'this course'}, or get feedback from peers and instructors. Specific lesson questions can also be opened directly within the Lesson Player.
        </p>
      </div>

      {guidelinesOnly ? null : (
        <CommentThread
          comments={comments}
          onPostComment={onPostComment}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onVoteComment={onVoteComment}
          onReportComment={onReportComment}
          t={t}
          iconSlot={iconSlot}
        />
      )}
    </div>
  );
}

export default DiscussionsPanel;
