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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'new' | 'top' | 'attended'>('new');
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };

  const primaryFeatured = featuredCourses[featuredIndex] ?? featuredCourses[0];

  return (
    <div className={`space-y-12 ${className}`}>
      {/* ---------------- HERO SECTION (UNSLOP PASS) ---------------- */}
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-12 overflow-hidden shadow-xs">
        <div className="max-w-3xl space-y-5">
          {/* Unboxed Kicker (No sparkles, no capsule pill) */}
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
            <span>Engineering Track Catalog</span>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>2026 Curriculum</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 font-display leading-[1.15] tracking-tight">
            {t('hub.hero.title')}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            {t('hub.hero.tagline')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative pt-2 max-w-xl">
            <input
              type="text"
              placeholder={t('hub.hero.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-11 pr-24 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
            />
            <div className="absolute left-4 top-5 text-zinc-400">
              <RenderIcon name="search" className="w-4 h-4" iconSlot={iconSlot} />
            </div>
            <button
              type="submit"
              className="absolute right-1.5 top-3.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Claim-to-Proof Quantitative Adjacency (§1.H) */}
          <div className="pt-1 flex items-center gap-4 sm:gap-6 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100">14,800+</span>
              <span>Learners Enrolled</span>
            </div>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100">99.4%</span>
              <span>Milestone Pass Rate</span>
            </div>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100">12</span>
              <span>Production Tracks</span>
            </div>
          </div>

          {/* Categories Quick Filter Row */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-zinc-400">Tracks:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory?.(cat)}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Manager "Create Track" entry */}
        {isManager && (
          <div className="absolute top-6 right-6">
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
