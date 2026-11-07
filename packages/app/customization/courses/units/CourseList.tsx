/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { CourseSummary, TranslateFn, IconSlotFn } from '../types';
import { CourseCard } from './CourseCard';
import { Skeleton } from '../primitives/Skeleton';
import { EmptyState } from '../primitives/EmptyState';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface CourseListProps {
  courses: CourseSummary[];
  loading?: boolean;
  layout?: 'grid' | 'list';
  allowLayoutToggle?: boolean;
  onOpenCourse?: (url: string) => void;
  onContinue?: (course: CourseSummary) => void;
  onJoin?: (course: CourseSummary) => void;
  onFavorite?: (course: CourseSummary) => void;
  onShare?: (course: CourseSummary) => void;
  onSubscribe?: (course: CourseSummary) => void;
  favoritedSlugs?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function CourseList({
  courses,
  loading = false,
  layout: initialLayout = 'grid',
  allowLayoutToggle = true,
  onOpenCourse,
  onContinue,
  onJoin,
  onFavorite,
  onShare,
  onSubscribe,
  favoritedSlugs = [],
  emptyTitle,
  emptyDescription,
  onEmptyAction,
  emptyActionLabel,
  t = defaultT,
  iconSlot,
  className = ''
}: CourseListProps) {
  const [layout, setLayout] = useState<'grid' | 'list'>(initialLayout);

  if (loading) {
    return (
      <div
        className={`grid ${
          layout === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'grid-cols-1 gap-4'
        } ${className}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || t('browse.no_results.title')}
        description={emptyDescription || t('browse.no_results.desc')}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        iconSlot={iconSlot}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {allowLayoutToggle && (
        <div className="flex justify-end items-center gap-1">
          <button
            type="button"
            onClick={() => setLayout('grid')}
            aria-label={t('browse.view_grid')}
            title={t('browse.view_grid')}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              layout === 'grid'
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <RenderIcon name="grid" className="w-4 h-4" iconSlot={iconSlot} />
          </button>
          <button
            type="button"
            onClick={() => setLayout('list')}
            aria-label={t('browse.view_list')}
            title={t('browse.view_list')}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              layout === 'list'
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <RenderIcon name="list" className="w-4 h-4" iconSlot={iconSlot} />
          </button>
        </div>
      )}

      <div
        className={`grid ${
          layout === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'grid-cols-1 gap-4'
        }`}
      >
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            layout={layout}
            onOpenCourse={onOpenCourse}
            onContinue={onContinue}
            onJoin={onJoin}
            onFavorite={onFavorite}
            onShare={onShare}
            onSubscribe={onSubscribe}
            isFavorited={favoritedSlugs.includes(course.slug)}
            t={t}
            iconSlot={iconSlot}
          />
        ))}
      </div>
    </div>
  );
}

export default CourseList;
