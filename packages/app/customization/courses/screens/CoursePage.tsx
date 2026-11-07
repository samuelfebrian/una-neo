/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CoursePage (CourseApp): Complete course profile orchestrating Hero, Deep-linkable Tabs,
 * Curriculum tree, Learning outcomes, Enrollment CTA machine, and Owner administration.
 */

import React, { useState } from 'react';
import type {
  Course,
  Outline,
  OutlineItem,
  Member,
  CommentItem,
  Attachment,
  CourseSummary,
  NodeId,
  TranslateFn,
  IconSlotFn
} from '../types';
import { ImageWithFallback } from '../primitives/ImageWithFallback';
import { Avatar } from '../primitives/Avatar';
import { Ratings } from '../primitives/Ratings';
import { Reactions } from '../primitives/Reactions';
import { Tabs } from '../primitives/Tabs';
import { Button } from '../primitives/Button';
import { ProgressBar } from '../primitives/ProgressBar';
import { ProgressRing } from '../primitives/ProgressRing';
import { AccordionItem } from '../primitives/Accordion';
import { RichText } from '../primitives/RichText';
import { FileRow } from '../primitives/FileRow';
import { Locked } from '../primitives/Locked';
import { EmptyState } from '../primitives/EmptyState';
import { Skeleton } from '../primitives/Skeleton';
import { RenderIcon } from '../primitives/IconSlot';
import { JoinFlow } from './JoinFlow';
import { StudentsPanel } from './StudentsPanel';
import { DiscussionsPanel } from './DiscussionsPanel';
import { AboutPanel } from './AboutPanel';
import { ManagePanel } from './ManagePanel';
import { AgentEntry } from './AgentEntry';
import { CourseCard } from '../units/CourseCard';
import { defaultT } from '../tokens/i18n';

export interface CoursePageProps {
  course: Course;
  outline?: Outline;
  members?: Member[];
  comments?: CommentItem[];
  relatedCourses?: CourseSummary[];
  attachments?: Attachment[];
  attachmentsLoading?: boolean;
  activeTab?: string;
  selectedParentId?: NodeId; // URL parent_id for module selection
  onTabChange?: (tab: string) => void;
  onOpenLesson?: (nodeId: NodeId) => void;
  onJoinFree?: () => void;
  onJoinPlan?: (planId: number) => void;
  onFavorite?: (course: Course) => void;
  onShare?: (course: Course) => void;
  onReport?: (course: Course) => void;
  onSubscribe?: (course: Course) => void;
  onPostComment?: (text: string, replyTo?: number) => void;
  onVoteComment?: (id: number, dir: 1 | -1) => void;
  onDeleteComment?: (id: number) => void;
  onDownloadAttachment?: (a: Attachment) => void;
  onPublishCourse?: (course: Course) => void;
  onUnpublishCourse?: (course: Course) => void;
  onDeleteCourse?: (course: Course, withContent: boolean) => void;
  onAddModuleOrLesson?: (parentNodeId: NodeId, kind: 'module' | 'theme' | 'lesson') => void;
  onAskAgent?: (ctx: { course: Pick<Course, 'id' | 'profileId'>; nodeId?: NodeId; hint?: string; prompt?: string }) => void;
  /** Optional embedded UNA blocks surfaced inside the About tab (no UNA feature removed). */
  aboutSlot?: React.ReactNode;
  /** Optional embedded UNA discussions source (timeline/comments) inside the Discussions tab. */
  discussionsSlot?: React.ReactNode;
  isFavorited?: boolean;
  formatPrice?: (price: string, currency?: string, periodUnit?: string) => string;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function CoursePage({
  course,
  outline,
  members = [],
  comments = [],
  relatedCourses = [],
  attachments,
  attachmentsLoading = false,
  activeTab: controlledTab,
  selectedParentId,
  onTabChange,
  onOpenLesson,
  onJoinFree,
  onJoinPlan,
  onFavorite,
  onShare,
  onReport,
  onSubscribe,
  onPostComment,
  onVoteComment,
  onDeleteComment,
  onDownloadAttachment,
  onPublishCourse,
  onUnpublishCourse,
  onDeleteCourse,
  onAddModuleOrLesson,
  onAskAgent,
  aboutSlot,
  discussionsSlot,
  isFavorited = false,
  formatPrice,
  t = defaultT,
  iconSlot,
  className = ''
}: CoursePageProps) {
  const [internalTab, setInternalTab] = useState('overview');
  const activeTab = controlledTab ?? internalTab;

  const handleTabClick = (key: string) => {
    if (controlledTab === undefined) {
      setInternalTab(key);
    }
    onTabChange?.(key);
  };

  const isOwner = Boolean(course.isOwnerOrAdmin || course.canEdit);
  const isEnrolled = Boolean(course.enrolled);
  const isLockedPrivate = course.visibility === 'private' && !isEnrolled && !isOwner;

  // Aggregate attachments across all outline lessons (real UNA data via attachments prop)
  const allAttachments: Attachment[] = attachments ?? [];
  // Build modules & lessons hierarchy (UNA nests lessons under themes → roll them up to the module)
  const moduleItems = outline?.items?.filter((i) => i.level === 1) || [];
  const itemByNode = new Map<number, OutlineItem>();
  outline?.items?.forEach((item) => itemByNode.set(item.nodeId, item));
  const moduleIdForLesson = (lesson: OutlineItem): number => {
    let parent = itemByNode.get(lesson.parentId);
    while (parent && parent.level > 1) parent = itemByNode.get(parent.parentId);
    return parent?.level === 1 ? parent.nodeId : 0;
  };
  const lessonsByParent = new Map<number, OutlineItem[]>();
  outline?.items?.forEach((item) => {
    if (item.level === 3) {
      const moduleId = moduleIdForLesson(item);
      const list = lessonsByParent.get(moduleId) || [];
      list.push(item);
      lessonsByParent.set(moduleId, list);
    }
  });
  lessonsByParent.forEach((list) =>
    list.sort((a, b) => (a.order || a.index || 0) - (b.order || b.index || 0))
  );

  // Find first incomplete lesson for "Continue" button
  const firstIncompleteLesson = outline?.items?.find(
    (i) => i.level === 3 && (!i.progress || i.progress.status !== 'completed') && !i.locked
  );

  const tabs = [
    { key: 'overview', label: t('course.tabs.overview') },
    { key: 'curriculum', label: t('course.tabs.curriculum'), count: outline?.items?.filter((i) => i.level === 3).length },
    { key: 'resources', label: t('course.tabs.resources') },
    { key: 'students', label: t('course.tabs.students'), count: course.membersCount },
    { key: 'discussions', label: t('course.tabs.discussions'), count: comments.length },
    { key: 'about', label: t('course.tabs.about') },
    ...(isOwner ? [{ key: 'manage', label: t('course.tabs.manage') }] : [])
  ];

  /* ---------------- PRIVATE & LOCKED SCREEN ---------------- */
  if (isLockedPrivate) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="relative aspect-[16/7] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <ImageWithFallback
            src={course.cover?.src}
            alt={course.title}
            aspectRatio="auto"
            focus={course.cover?.focus}
            className="w-full h-full object-cover filter blur-xs"
          />
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-6">
            <Locked
              title={t('course.locked.private_title')}
              reason={t('course.locked.private_desc')}
              actionLabel={t('card.cta.join')}
              onAction={onJoinFree}
              iconSlot={iconSlot}
              className="max-w-md w-full bg-white dark:bg-slate-900 border-none shadow-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hidden Draft Banner (for Owners) */}
      {course.status === 'hidden' && isOwner && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RenderIcon name="alert" className="w-5 h-5 text-amber-600" iconSlot={iconSlot} />
            <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
              {t('course.owner.hidden_banner')}
            </span>
          </div>
          {onPublishCourse && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPublishCourse(course)}
            >
              {t('course.owner.publish_btn')}
            </Button>
          )}
        </div>
      )}

      {/* Hero Section */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {/* Cover Artwork (16:7) */}
        <div className="relative aspect-[16/7] w-full overflow-hidden bg-slate-950">
          <ImageWithFallback
            src={course.cover?.src}
            alt={course.title}
            aspectRatio="auto"
            focus={course.cover?.focus}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Top category & tags overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              {course.category && (
                <span className="text-xs font-semibold text-white/90 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                  {course.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {onFavorite && (
                <button
                  type="button"
                  onClick={() => onFavorite(course)}
                  aria-label="Save to favorites"
                  className={`p-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer ${
                    isFavorited
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-950/60 text-white hover:bg-slate-950/80'
                  }`}
                >
                  <RenderIcon name="bookmark" className="w-4 h-4" iconSlot={iconSlot} />
                </button>
              )}
              {onShare && (
                <button
                  type="button"
                  onClick={() => onShare(course)}
                  aria-label="Share course"
                  className="p-2 rounded-xl bg-slate-950/60 text-white hover:bg-slate-950/80 backdrop-blur-md transition-colors cursor-pointer"
                >
                  <RenderIcon name="share" className="w-4 h-4" iconSlot={iconSlot} />
                </button>
              )}
            </div>
          </div>

          {/* Hero Bottom Info (Overlaid on Scrim) */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
            <h1 className="text-xl sm:text-3xl font-extrabold font-display leading-tight tracking-tight max-w-3xl">
              {course.title}
            </h1>

            <div className="mt-3 flex items-center gap-4 text-xs text-white/80 flex-wrap">
              <div className="flex items-center gap-2">
                <Avatar
                  src={course.author.avatarUrl}
                  name={course.author.name}
                  size="xs"
                />
                <span className="font-semibold text-white">
                  {course.author.name}
                </span>
                {onSubscribe && (
                  <button
                    type="button"
                    onClick={() => onSubscribe(course)}
                    className="text-[11px] underline text-blue-300 hover:text-white cursor-pointer ml-1"
                  >
                    Follow
                  </button>
                )}
              </div>

              {course.rating && (
                <>
                  <span aria-hidden="true">·</span>
                  <Ratings avg={course.rating.avg} votes={course.rating.votes} />
                </>
              )}

              {course.membersCount !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {course.membersCount.toLocaleString()} enrolled
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hero Action Bar */}
        <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          {/* Enrollment Progress or Join CTAs */}
          <div className="flex-1 max-w-md">
            {course.enrolled === undefined ? (
              // UNA membership still resolving: hold the CTA steady instead of Join→Continue flicker.
              <div className="space-y-2">
                <Skeleton variant="rectangular" width="100%" height={28} />
                <Skeleton variant="rectangular" width="60%" height={12} />
              </div>
            ) : isEnrolled && course.progress ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Your Curriculum Progress
                  </span>
                  <span className="font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                    {course.progress.percent}%
                  </span>
                </div>
                <ProgressBar percent={course.progress.percent} height="md" />
              </div>
            ) : (
              <JoinFlow
                course={course}
                enrollmentStatus={isEnrolled ? 'enrolled' : 'not_enrolled'}
                onJoinFree={onJoinFree}
                onJoinPlan={onJoinPlan}
                onOpenCurriculum={() => handleTabClick('curriculum')}
                formatPrice={formatPrice}
                t={t}
                iconSlot={iconSlot}
              />
            )}
          </div>

          {/* Primary Continue / AI Assistant button */}
          <div className="flex items-center gap-3 shrink-0">
            {isEnrolled && firstIncompleteLesson && onOpenLesson && (
              <Button
                variant="primary"
                size="md"
                icon="play"
                iconSlot={iconSlot}
                onClick={() => onOpenLesson(firstIncompleteLesson.nodeId)}
              >
                {course.progress?.status === 'in process' ? t('card.cta.continue') : t('card.cta.start')}
              </Button>
            )}

            <AgentEntry
              course={{ id: course.id, profileId: course.profileId, title: course.title }}
              variant="compact"
              onAskAgent={onAskAgent}
              iconSlot={iconSlot}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        items={tabs}
        activeKey={activeTab}
        onChange={handleTabClick}
        variant="underline"
        iconSlot={iconSlot}
      />

      {/* 2-Column Content Layout (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Tab Zone (Left 8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  About This Course
                </h3>
                <RichText html={course.textHtml} />
              </div>

              {/* Learning Outcomes */}
              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                    {t('course.overview.outcomes_title')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.learningOutcomes.map((outcome, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <RenderIcon name="check" className="w-2.5 h-2.5" iconSlot={iconSlot} />
                        </div>
                        <span className="leading-snug">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Summary Stats */}
              {course.studentSummary && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                    {t('course.overview.summary_title')}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {course.studentSummary.joined}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t('course.overview.enrolled_count')}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {course.studentSummary.started}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t('course.overview.started_count')}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {course.studentSummary.passed}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t('course.overview.passed_count')}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {course.studentSummary.passedPercent}%
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t('course.overview.pass_rate')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reactions & Rating summary */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Learner Reactions & Ratings
                </span>
                <Reactions reactions={course.reactions} />
              </div>
            </div>
          )}

          {/* TAB 2: CURRICULUM */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {moduleItems.length} Modules · {outline?.items?.filter((i) => i.level === 3).length} Total Lessons
                </span>

                {isEnrolled && firstIncompleteLesson && onOpenLesson && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon="play"
                    iconSlot={iconSlot}
                    onClick={() => onOpenLesson(firstIncompleteLesson.nodeId)}
                  >
                    {t('course.curriculum.continue_next')}
                  </Button>
                )}
              </div>

              {moduleItems.map((module, idx) => {
                const lessons = lessonsByParent.get(module.nodeId) || [];
                const lessonCount =
                  lessons.length ||
                  module.counters?.find((c) => /lesson/i.test(c.title))?.total ||
                  0;
                const isSelectedModule = selectedParentId === module.nodeId;

                return (
                  <AccordionItem
                    key={module.nodeId}
                    id={String(module.nodeId)}
                    title={module.title}
                    subtitle={`${lessonCount} lessons`}
                    defaultOpen={idx === 0 || isSelectedModule}
                    leading={
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono text-xs font-bold">
                        {idx + 1}
                      </div>
                    }
                    trailing={
                      module.progress ? (
                        <ProgressRing
                          percent={module.progress.percent}
                          size={28}
                          strokeWidth={3}
                          showText={false}
                        />
                      ) : undefined
                    }
                    iconSlot={iconSlot}
                  >
                    <div className="space-y-2">
                      {lessons.map((lesson) => {
                        const isLessonPassed = lesson.progress?.status === 'completed';

                        return (
                          <div
                            key={lesson.nodeId}
                            onClick={() => !lesson.locked && onOpenLesson?.(lesson.nodeId)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              lesson.locked
                                ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                                  isLessonPassed
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                    : lesson.locked
                                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                                }`}
                              >
                                <RenderIcon
                                  name={isLessonPassed ? 'check' : lesson.locked ? 'lock' : 'play'}
                                  className="w-3 h-3"
                                  iconSlot={iconSlot}
                                />
                              </div>

                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {lesson.title}
                                </h5>
                                {lesson.locked && (
                                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                    Prerequisite milestone required
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.progress && (
                                <span className="font-mono tabular-nums text-xs font-semibold text-slate-500">
                                  {lesson.progress.percent}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {isOwner && onAddModuleOrLesson && (
                        <button
                          type="button"
                          onClick={() => onAddModuleOrLesson(module.nodeId, 'lesson')}
                          className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RenderIcon name="plus" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                          <span>{t('course.curriculum.add_lesson')}</span>
                        </button>
                      )}
                    </div>
                  </AccordionItem>
                );
              })}

              {isOwner && onAddModuleOrLesson && (
                <button
                  type="button"
                  onClick={() => onAddModuleOrLesson(0, 'module')}
                  className="w-full py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RenderIcon name="plus" className="w-4 h-4" iconSlot={iconSlot} />
                  <span>{t('course.curriculum.add_module')}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                Downloadable Course Resources
              </h4>
              {attachmentsLoading && (
                <div className="space-y-2.5">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} variant="rectangular" width="100%" height={56} />
                  ))}
                </div>
              )}
              {!attachmentsLoading && allAttachments.length > 0 && (
                <div className="space-y-2.5">
                  {allAttachments.map((att) => (
                    <FileRow
                      key={att.id}
                      attachment={att}
                      onDownload={onDownloadAttachment}
                    />
                  ))}
                </div>
              )}
              {!attachmentsLoading && allAttachments.length === 0 && (
                <EmptyState
                  title={t('course.resources.empty_title')}
                  description={t('course.resources.empty_desc')}
                  icon="download"
                  iconSlot={iconSlot}
                />
              )}
            </div>
          )}

          {/* TAB 4: STUDENTS */}
          {activeTab === 'students' && (
            <StudentsPanel
              members={members}
              isOwnerOrAdmin={isOwner}
              t={t}
              iconSlot={iconSlot}
            />
          )}

          {/* TAB 5: DISCUSSIONS */}
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              {discussionsSlot && <div>{discussionsSlot}</div>}
              <DiscussionsPanel
                comments={comments}
                courseTitle={course.title}
                guidelinesOnly={Boolean(discussionsSlot)}
                onPostComment={onPostComment}
                onVoteComment={onVoteComment}
                onDeleteComment={onDeleteComment}
                t={t}
                iconSlot={iconSlot}
              />
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {aboutSlot && <div>{aboutSlot}</div>}
              <AboutPanel course={course} t={t} iconSlot={iconSlot} />
            </div>
          )}

          {/* TAB 7: MANAGE (OWNER ONLY) */}
          {activeTab === 'manage' && isOwner && (
            <ManagePanel
              course={course}
              outline={outline}
              onPublishCourse={onPublishCourse}
              onUnpublishCourse={onUnpublishCourse}
              onDeleteCourse={onDeleteCourse}
              t={t}
              iconSlot={iconSlot}
            />
          )}
        </div>

        {/* Right Rail (Desktop 4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Facts */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {t('course.overview.quick_facts')}
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Access Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {course.visibility}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {course.category}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Milestones</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {outline?.items?.filter((i) => i.level === 3).length || 0} lessons
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Community</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {course.membersCount || 0} students
                </span>
              </div>
            </div>
          </div>

          {/* Related Courses List */}
          {relatedCourses.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Related Learning Tracks
              </h4>
              <div className="space-y-3">
                {relatedCourses.slice(0, 2).map((rel) => (
                  <CourseCard
                    key={rel.id}
                    course={rel}
                    layout="compact"
                    t={t}
                    iconSlot={iconSlot}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoursePage;
