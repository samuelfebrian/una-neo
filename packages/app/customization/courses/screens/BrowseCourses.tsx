/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BrowseCourses: Comprehensive search, category filtering, tag facets, and sorting engine.
 */

import React, { useState } from 'react';
import type { CourseSummary, TranslateFn, IconSlotFn } from '../types';
import { CourseList } from '../units/CourseList';
import { Chip } from '../primitives/Chip';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface BrowseCoursesProps {
  courses: CourseSummary[];
  categories?: string[];
  tags?: string[];
  initialQuery?: string;
  initialSort?: 'new' | 'top' | 'featured' | 'recommended';
  initialCategory?: string;
  initialProgressFilter?: 'all' | 'not_started' | 'in_process' | 'completed';
  onSearchChange?: (q: string, filters: Record<string, string>) => void;
  onOpenCourse?: (url: string) => void;
  onContinueCourse?: (course: CourseSummary) => void;
  onJoinCourse?: (course: CourseSummary) => void;
  onFavorite?: (course: CourseSummary) => void;
  onShare?: (course: CourseSummary) => void;
  favoritedSlugs?: string[];
  loading?: boolean;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function BrowseCourses({
  courses,
  categories = ['Software Engineering', 'Machine Learning & AI', 'Cloud Architecture', 'Product Design & UX'],
  tags = ['Architecture', 'Kubernetes', 'TypeScript', 'Deep Learning', 'System Design'],
  initialQuery = '',
  initialSort = 'top',
  initialCategory = '',
  initialProgressFilter = 'all',
  onSearchChange,
  onOpenCourse,
  onContinueCourse,
  onJoinCourse,
  onFavorite,
  onShare,
  favoritedSlugs = [],
  loading = false,
  t = defaultT,
  iconSlot,
  className = ''
}: BrowseCoursesProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState(initialSort);
  const [progressFilter, setProgressFilter] = useState(initialProgressFilter);

  // Trigger search update
  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(query, {
      category: selectedCategory,
      tag: selectedTag,
      sort: sortBy,
      progress: progressFilter
    });
  };

  const handleCategorySelect = (cat: string) => {
    const next = selectedCategory === cat ? '' : cat;
    setSelectedCategory(next);
    onSearchChange?.(query, {
      category: next,
      tag: selectedTag,
      sort: sortBy,
      progress: progressFilter
    });
  };

  const handleTagSelect = (tag: string) => {
    const next = selectedTag === tag ? '' : tag;
    setSelectedTag(next);
    onSearchChange?.(query, {
      category: selectedCategory,
      tag: next,
      sort: sortBy,
      progress: progressFilter
    });
  };

  const handleSortSelect = (sort: typeof sortBy) => {
    setSortBy(sort);
    onSearchChange?.(query, {
      category: selectedCategory,
      tag: selectedTag,
      sort,
      progress: progressFilter
    });
  };

  // Client-side filtering when host doesn't re-render externally
  const filteredCourses = courses.filter((c) => {
    if (selectedCategory && c.category !== selectedCategory) return false;
    if (selectedTag && !c.labels?.includes(selectedTag)) return false;
    if (progressFilter === 'not_started' && c.progress && c.progress.status !== 'not started') return false;
    if (progressFilter === 'in_process' && c.progress?.status !== 'in process') return false;
    if (progressFilter === 'completed' && c.progress?.status !== 'completed') return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      const matchTag = c.labels?.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchCat && !matchTag) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'top') return (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0);
    if (sortBy === 'new') return (b.addedTs ?? 0) - (a.addedTs ?? 0);
    if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    return (b.membersCount ?? 0) - (a.membersCount ?? 0);
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input Bar */}
      <form onSubmit={handleQuerySubmit} className="relative">
        <input
          type="text"
          placeholder={t('hub.hero.search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-sm pl-11 pr-24 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
        />
        <div className="absolute left-4 top-3.5 text-zinc-400">
          <RenderIcon name="search" className="w-4 h-4" iconSlot={iconSlot} />
        </div>
        <button
          type="submit"
          className="absolute right-2 top-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Filter Row: Categories & Sort dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip
            label={t('browse.filters.all_categories')}
            active={!selectedCategory}
            onClick={() => handleCategorySelect('')}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onClick={() => handleCategorySelect(cat)}
            />
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500 font-medium">
            {t('browse.filters.sort')}:
          </span>
          <select
            value={sortBy}
            onChange={(e) => handleSortSelect(e.target.value as any)}
            className="text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="top">{t('browse.filters.sort_top')}</option>
            <option value="new">{t('browse.filters.sort_new')}</option>
            <option value="featured">{t('browse.filters.sort_featured')}</option>
            <option value="recommended">{t('browse.filters.sort_recommended')}</option>
          </select>
        </div>
      </div>

      {/* Sub-Filter: Tags & Results Count */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
            {t('browse.filters.tags')}:
          </span>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagSelect(tag)}
              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300'
              }`}
            >
              #{tag}
            </button>
          ))}
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className="text-[11px] text-rose-500 underline ml-1 cursor-pointer"
            >
              Clear tag
            </button>
          )}
        </div>

        <span className="font-mono tabular-nums">
          {t('browse.search_results_count', { count: filteredCourses.length })}
        </span>
      </div>

      {/* Course List */}
      <CourseList
        courses={filteredCourses}
        loading={loading}
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
  );
}

export default BrowseCourses;
