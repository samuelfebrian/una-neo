/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CourseCard: Primary atomic presentation unit for courses across Hub, Browse, Profile, and Rails.
 * Layouts: grid, list, compact (rail)
 */

import React, { useState } from 'react';
import type { CourseSummary, TranslateFn, IconSlotFn } from '../types';
import { ImageWithFallback } from '../primitives/ImageWithFallback';
import { ProgressBar } from '../primitives/ProgressBar';
import { Ratings } from '../primitives/Ratings';
import { Badge } from '../primitives/Badge';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface CourseCardProps {
  course: CourseSummary;
  layout?: 'grid' | 'list' | 'compact';
  onOpenCourse?: (url: string) => void;
  onContinue?: (course: CourseSummary) => void;
  onJoin?: (course: CourseSummary) => void;
  onFavorite?: (course: CourseSummary) => void;
  onShare?: (course: CourseSummary) => void;
  onSubscribe?: (course: CourseSummary) => void;
  isFavorited?: boolean;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function CourseCard({
  course,
  layout = 'grid',
  onOpenCourse,
  onContinue,
  onJoin,
  onFavorite,
  onShare,
  onSubscribe,
  isFavorited = false,
  t = defaultT,
  iconSlot,
  className = ''
}: CourseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger if click wasn't on an inner button
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    onOpenCourse?.(course.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if ((e.target as HTMLElement).closest('button, a, input')) return;
      e.preventDefault();
      onOpenCourse?.(course.url);
    }
  };

  const isEnrolled = course.enrolled;
  const progressPercent = course.progress?.percent ?? 0;
  const isCompleted = course.progress?.status === 'completed';
  const isStarted = course.progress?.status === 'in process';

  // Check if course is recently updated or new
  const isUpdated = course.changedTs && now - course.changedTs < 14 * 86400 * 1000;
  const isNew = course.addedTs && now - course.addedTs < 7 * 86400 * 1000;

  // Counter labels (modules/themes/lessons)
  const lessonCounter = course.counters?.find((c) => c.level === 3 || c.title.toLowerCase().includes('lesson'));
  const moduleCounter = course.counters?.find((c) => c.level === 1 || c.title.toLowerCase().includes('module'));

  // Paid join or free join
  const hasPricing = course.pricing && course.pricing.length > 0;
  const lowestPricePlan = hasPricing ? course.pricing?.[0] : null;

  /* ---------------- COMPACT (CONTINUE RAIL) LAYOUT ---------------- */
  if (layout === 'compact') {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-3.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-xs transition-all cursor-pointer group select-none ${className}`}
      >
        <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
          <ImageWithFallback
            src={course.cover?.src}
            alt={course.title}
            aspectRatio="auto"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {course.title}
          </h4>
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar percent={progressPercent} height="sm" className="flex-1" />
            <span className="font-mono text-[10px] tabular-nums font-semibold text-zinc-500">
              {progressPercent}%
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue ? onContinue(course) : onOpenCourse?.(course.url);
          }}
          className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors shrink-0 cursor-pointer"
        >
          {t('hub.continue_learning.resume')}
        </button>
      </div>
    );
  }

  /* ---------------- LIST LAYOUT ---------------- */
  if (layout === 'list') {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs transition-all cursor-pointer group select-none ${className}`}
      >
        <div className="w-full sm:w-56 aspect-[16/7] sm:aspect-[16/9] rounded-xl overflow-hidden shrink-0 relative">
          <ImageWithFallback
            src={course.cover?.src}
            alt={course.title}
            aspectRatio="auto"
            focus={course.cover?.focus}
            className="w-full h-full object-cover"
          />
          {course.visibility === 'private' && (
            <div className="absolute top-2 left-2 p-1 rounded-md bg-zinc-950/70 text-white backdrop-blur-xs">
              <RenderIcon name="lock" className="w-3.5 h-3.5" iconSlot={iconSlot} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Metadata unboxed text */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 flex-wrap">
              {course.category && <span>{course.category}</span>}
              {course.category && (moduleCounter || lessonCounter) && (
                <span aria-hidden="true">·</span>
              )}
              {moduleCounter && <span>{moduleCounter.total} modules</span>}
              {lessonCounter && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{lessonCounter.total} lessons</span>
                </>
              )}
            </div>

            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 font-display">
              {course.title}
            </h3>

            {course.textHtml && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                {course.textHtml.replace(/<[^>]+>/g, '')}
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {course.rating && (
                <Ratings avg={course.rating.avg} votes={course.rating.votes} />
              )}
              {course.membersCount !== undefined && (
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <RenderIcon name="users" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                  <span className="font-mono tabular-nums">{course.membersCount}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEnrolled ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContinue ? onContinue(course) : onOpenCourse?.(course.url);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {isStarted ? t('card.cta.continue') : isCompleted ? 'Review' : t('card.cta.start')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoin ? onJoin(course) : onOpenCourse?.(course.url);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {lowestPricePlan ? `${t('card.cta.join_paid')} (${lowestPricePlan.price})` : t('card.cta.join')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- GRID (DEFAULT) LAYOUT ---------------- */
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs transition-all cursor-pointer overflow-hidden select-none relative ${className}`}
    >
      {/* Media Cover: 16:7 crop with focus */}
      <div className="relative w-full aspect-[16/7] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <ImageWithFallback
          src={course.cover?.src}
          alt={course.title}
          aspectRatio="auto"
          focus={course.cover?.focus}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />

        {/* Top Floating Badges (Functional status only) */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            {course.status === 'hidden' && (
              <Badge variant="warning">{t('card.status.hidden')}</Badge>
            )}
            {course.status === 'pending' && (
              <Badge variant="warning">{t('card.status.pending')}</Badge>
            )}
            {course.featured && (
              <Badge variant="brand">{t('card.badge.featured')}</Badge>
            )}
            {isNew && !course.featured && (
              <Badge variant="neutral">{t('card.badge.new')}</Badge>
            )}
            {isUpdated && !isNew && (
              <Badge variant="neutral">{t('card.badge.updated')}</Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {course.visibility === 'private' && (
              <div
                className="p-1.5 rounded-lg bg-zinc-950/70 text-white backdrop-blur-xs"
                title={t('card.visibility.private')}
              >
                <RenderIcon name="lock" className="w-3.5 h-3.5" iconSlot={iconSlot} />
              </div>
            )}

            {/* Secondary actions dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-950/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title="Options"
              >
                <RenderIcon name="more" className="w-3.5 h-3.5" iconSlot={iconSlot} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-20 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onFavorite && (
                    <button
                      type="button"
                      onClick={() => {
                        onFavorite(course);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-300"
                    >
                      <RenderIcon name="bookmark" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                      <span>{isFavorited ? t('card.actions.favorited') : t('card.actions.favorite')}</span>
                    </button>
                  )}
                  {onShare && (
                    <button
                      type="button"
                      onClick={() => {
                        onShare(course);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-300"
                    >
                      <RenderIcon name="share" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                      <span>{t('card.actions.share')}</span>
                    </button>
                  )}
                  {onSubscribe && (
                    <button
                      type="button"
                      onClick={() => {
                        onSubscribe(course);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <RenderIcon name="user" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                      <span>{t('card.actions.subscribe')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Modules unboxed metadata (anti-slop) */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 font-medium flex-wrap">
            {course.category && <span>{course.category}</span>}
            {course.category && (moduleCounter || lessonCounter) && (
              <span aria-hidden="true">·</span>
            )}
            {moduleCounter && <span>{moduleCounter.total} modules</span>}
            {lessonCounter && (
              <>
                <span aria-hidden="true">·</span>
                <span>{lessonCounter.total} lessons</span>
              </>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug font-display">
            {course.title}
          </h3>

          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            {course.rating && (
              <Ratings avg={course.rating.avg} votes={course.rating.votes} />
            )}
            {course.membersCount !== undefined && (
              <div className="flex items-center gap-1">
                <RenderIcon name="users" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                <span className="font-mono tabular-nums">{course.membersCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Progress bar or CTA */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {isEnrolled ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {isCompleted ? 'Completed' : 'Your Progress'}
                </span>
                <span className="font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                  {progressPercent}%
                </span>
              </div>
              <ProgressBar percent={progressPercent} height="sm" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onContinue ? onContinue(course) : onOpenCourse?.(course.url);
                }}
                className="w-full mt-2 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{isStarted ? t('card.cta.continue') : isCompleted ? 'Review Course' : t('card.cta.start')}</span>
                <RenderIcon name="arrow-right" className="w-3.5 h-3.5" iconSlot={iconSlot} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div>
                {lowestPricePlan ? (
                  <div>
                    <span className="font-mono tabular-nums text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {lowestPricePlan.price}
                    </span>
                    <span className="text-[11px] text-zinc-500 ml-1">
                      /{lowestPricePlan.periodUnit}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Free Course
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin ? onJoin(course) : onOpenCourse?.(course.url);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                {lowestPricePlan ? t('card.cta.join_paid') : t('card.cta.join')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
