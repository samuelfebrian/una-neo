/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CoursesHub: The main platform home (/courses-home).
 * Unslop Design & Architecture:
 * - Anti-AI-slop typography with Outfit Display & DM Sans Body
 * - Claim-to-proof quantitative metric strip adjacent to search
 * - Zero decorative pulsing/colored dots
 * - Clean unboxed metadata and high-intent electric cobalt accents
 * - Tabbed catalog with segmented controls
 */

import React, { useState } from 'react';
import type { CourseSummary, TranslateFn, IconSlotFn } from '../types';
import { CourseCard } from '../units/CourseCard';
import { CourseList } from '../units/CourseList';
import { Button } from '../primitives/Button';
import { Tabs } from '../primitives/Tabs';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';
import { PathwayCanvas } from '../pathway/PathwayCanvas';

export interface CoursesHubProps {
  featuredCourses: CourseSummary[];
  recentCourses: CourseSummary[];
  topCourses: CourseSummary[];
  inProgressCourses?: CourseSummary[];
  categories?: string[];
  isManager?: boolean;
  onSearch?: (query: string) => void;
  onSelectCategory?: (category: string) => void;
  onOpenCourse?: (url: string) => void;
  onContinueCourse?: (course: CourseSummary) => void;
  onJoinCourse?: (course: CourseSummary) => void;
  onCreateCourse?: () => void;
  onBrowseAll?: () => void;
  onFavorite?: (course: CourseSummary) => void;
  onShare?: (course: CourseSummary) => void;
  favoritedSlugs?: string[];
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function CoursesHub({
  featuredCourses,
  recentCourses,
  topCourses,
  inProgressCourses = [],
  categories = ['Software Engineering', 'Machine Learning & AI', 'Cloud Architecture', 'Product Design & UX'],
  isManager = false,
  onSearch,
  onSelectCategory,
  onOpenCourse,
  onContinueCourse,
  onJoinCourse,
  onCreateCourse,
  onBrowseAll,
  onFavorite,
  onShare,
  favoritedSlugs = [],
  t = defaultT,
  iconSlot,
  className = ''
}: CoursesHubProps) {
  const [activeCatalogTab, setActiveCatalogTab] = useState<'new' | 'top' | 'attended'>('new');
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const primaryFeatured = featuredCourses[featuredIndex] ?? featuredCourses[0];

  return (
    <div className={`space-y-12 ${className}`}>
      {/* ---------------- PATHWAY ROAD CANVAS ---------------- */}
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs h-[720px] sm:h-[800px]">
        {isManager && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              iconSlot={iconSlot}
              onClick={onCreateCourse}
            >
              {t('hub.hero.create_course')}
            </Button>
          </div>
        )}
        <PathwayCanvas />
      </div>

      {/* ---------------- CONTINUE LEARNING RAIL ---------------- */}
      {inProgressCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display">
              {t('hub.continue_learning.title')}
            </h3>
            <span className="text-xs font-mono tabular-nums text-zinc-500">
              {inProgressCourses.length} in progress
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCourses.slice(0, 3).map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                layout="compact"
                onOpenCourse={onOpenCourse}
                onContinue={onContinueCourse}
                t={t}
                iconSlot={iconSlot}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---------------- FEATURED SPOTLIGHT ---------------- */}
      {primaryFeatured && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display">
              {t('hub.featured.title')}
            </h3>

            {featuredCourses.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setFeaturedIndex((i) =>
                      i === 0 ? featuredCourses.length - 1 : i - 1
                    )
                  }
                  aria-label="Previous Featured Course"
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  <RenderIcon name="chevron-left" className="w-4 h-4" iconSlot={iconSlot} />
                </button>
                <span className="font-mono text-xs tabular-nums px-1 text-zinc-400">
                  {featuredIndex + 1}/{featuredCourses.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFeaturedIndex((i) => (i + 1) % featuredCourses.length)
                  }
                  aria-label="Next Featured Course"
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  <RenderIcon name="chevron-right" className="w-4 h-4" iconSlot={iconSlot} />
                </button>
              </div>
            )}
          </div>

          <CourseCard
            course={primaryFeatured}
            layout="list"
            onOpenCourse={onOpenCourse}
            onContinue={onContinueCourse}
            onJoin={onJoinCourse}
            onFavorite={onFavorite}
            onShare={onShare}
            isFavorited={favoritedSlugs.includes(primaryFeatured.slug)}
            t={t}
            iconSlot={iconSlot}
          />
        </div>
      )}

      {/* ---------------- MAIN CATALOG TABS ---------------- */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Tabs
            items={[
              { key: 'new', label: t('hub.tabs.new'), icon: 'sparkles' },
              { key: 'top', label: t('hub.tabs.top'), icon: 'star' },
              { key: 'attended', label: t('hub.tabs.attended'), icon: 'book' }
            ]}
            activeKey={activeCatalogTab}
            onChange={(k) => setActiveCatalogTab(k as any)}
            variant="segmented"
            iconSlot={iconSlot}
          />

          <button
            type="button"
            onClick={onBrowseAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{t('hub.browse_all')}</span>
            <RenderIcon name="arrow-right" className="w-3.5 h-3.5" iconSlot={iconSlot} />
          </button>
        </div>

        {/* Catalog grid */}
        <CourseList
          courses={
            activeCatalogTab === 'new'
              ? recentCourses
              : activeCatalogTab === 'top'
              ? topCourses
              : inProgressCourses
          }
          onOpenCourse={onOpenCourse}
          onContinue={onContinueCourse}
          onJoin={onJoinCourse}
          onFavorite={onFavorite}
          onShare={onShare}
          favoritedSlugs={favoritedSlugs}
          t={t}
          iconSlot={iconSlot}
        />
      </div>
    </div>
  );
}

export default CoursesHub;
