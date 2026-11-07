/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AboutPanel: Displays comprehensive course metadata, instructors list, and social connections in view mode.
 */

import React from 'react';
import type { Course, TranslateFn, IconSlotFn } from '../types';
import { Avatar } from '../primitives/Avatar';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface AboutPanelProps {
  course: Course;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function AboutPanel({
  course,
  iconSlot,
  className = ''
}: AboutPanelProps) {
  const infoRows = [
    { label: 'Category', value: course.category || '' },
    {
      label: 'Visibility',
      value: course.visibility
        ? course.visibility === 'public'
            ? 'Public (Open to All)'
            : 'Private (Members Only)'
        : ''
    },
    {
      label: 'Location',
      value: course.location && !/^a:\d+:/.test(course.location) ? course.location : ''
    },
    {
      label: 'Added Date',
      value: course.addedTs
        ? new Date(course.addedTs < 1e11 ? course.addedTs * 1000 : course.addedTs).toLocaleDateString()
        : ''
    },
    {
      label: 'Last Updated',
      value: course.changedTs
        ? new Date(course.changedTs < 1e11 ? course.changedTs * 1000 : course.changedTs).toLocaleDateString()
        : ''
    },
    {
      label: 'Discussion Access',
      value: course.privacyOptions?.post === 'all' ? 'Open to Enrolled Learners' : ''
    }
  ].filter((row) => row.value);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overview Facts */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display mb-4">
          Course Specifications
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoRows.map((row, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {row.label}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-right">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tags / Labels */}
      {course.labels && course.labels.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display mb-3">
            Topics & Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {course.labels.map((label) => (
              <span
                key={label}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                #{label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructors Section */}
      {(course.author?.name || course.author?.avatarUrl) && (
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display mb-4">
          Lead Instructor & Mentors
        </h4>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Avatar
            src={course.author.avatarUrl}
            name={course.author.name}
            size="lg"
          />
          <div>
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {course.author.name}
            </h5>
            {course.author.headline && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {course.author.headline}
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Social Sharing Links */}
      {course.socialSharing && course.socialSharing.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display mb-3">
            Share This Course
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {course.socialSharing.map((s) => (
              <a
                key={s.network}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RenderIcon name="share" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                <span>{s.network}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AboutPanel;
