/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NotificationsFeed: Streams live course events (invites, join requests, new lessons, discussion replies).
 */

import React from 'react';
import type { CourseNotification, TranslateFn, IconSlotFn } from '../types';
import { DateAgo } from '../primitives/DateAgo';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface NotificationsFeedProps {
  notifications: CourseNotification[];
  onAction?: (notification: CourseNotification, action: 'accept' | 'decline' | 'open') => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function NotificationsFeed({
  notifications,
  onAction,
  iconSlot,
  className = ''
}: NotificationsFeedProps) {
  const getIconForKind = (kind: CourseNotification['kind']) => {
    switch (kind) {
      case 'join_invitation':
      case 'join_request':
        return 'users';
      case 'join_request_accepted':
      case 'fan_added':
        return 'check';
      case 'lesson_new':
        return 'book';
      case 'comment_new':
      case 'reply_new':
        return 'message';
      case 'timeline_post_like':
        return 'like';
      default:
        return 'info';
    }
  };

  const getNotificationText = (n: CourseNotification) => {
    switch (n.kind) {
      case 'join_invitation':
        return `You have been invited by ${n.from || 'an instructor'} to join "${n.course.title}"`;
      case 'join_request':
        return `${n.from} requested to join "${n.course.title}"`;
      case 'join_request_accepted':
        return `Your request to join "${n.course.title}" was approved!`;
      case 'lesson_new':
        return `A new lesson was published in "${n.course.title}"`;
      case 'reply_new':
        return `Someone replied to your discussion thread in "${n.course.title}"`;
      case 'course_update':
        return `Curriculum updates available for "${n.course.title}"`;
      default:
        return `Activity event in "${n.course.title}"`;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display pb-2 border-b border-slate-100 dark:border-slate-800">
        Course Activity & Notifications
      </h4>

      {notifications.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No recent notifications.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
          {notifications.map((n, idx) => (
            <div
              key={idx}
              className="p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <RenderIcon
                    name={getIconForKind(n.kind)}
                    className="w-4 h-4"
                    iconSlot={iconSlot}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    {getNotificationText(n)}
                  </p>
                  {n.date && (
                    <div className="mt-1">
                      <DateAgo timestamp={n.date} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {n.kind === 'join_invitation' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAction?.(n, 'decline')}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction?.(n, 'accept')}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
                    >
                      Accept
                    </button>
                  </>
                )}

                {n.kind !== 'join_invitation' && (
                  <button
                    type="button"
                    onClick={() => onAction?.(n, 'open')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsFeed;
