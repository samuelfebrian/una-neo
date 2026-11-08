/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LessonPlayer (LessonApp): High-focus 3-zone learning player for modules, sequential milestone steps, and attachments.
 * Desktop: Outline Rail (Left) | Step Content (Center) | Attachments & Resources (Right)
 * Mobile: Collapsible drawer for outline + sticky bottom action bar.
 */

import React, { useState, useEffect } from 'react';
import type { Lesson, Outline, OutlineItem, Step, Attachment, NodeId, DataId, TranslateFn, IconSlotFn } from '../types';
import { Breadcrumbs } from '../primitives/Breadcrumbs';
import { Button } from '../primitives/Button';
import { ProgressBar } from '../primitives/ProgressBar';
import { VideoPlayer } from '../primitives/VideoPlayer';
import { ImageWithFallback } from '../primitives/ImageWithFallback';
import { FileRow } from '../primitives/FileRow';
import { RichText } from '../primitives/RichText';
import { TreeView } from '../primitives/TreeView';
import { Modal } from '../primitives/Modal';
import { RenderIcon } from '../primitives/IconSlot';
import { AgentEntry } from './AgentEntry';
import { defaultT } from '../tokens/i18n';

export interface LessonPlayerProps {
  lesson: Lesson;
  outline?: Outline;
  onPassStep?: (dataId: DataId) => void;
  onPassOrResetLesson?: (nodeId: NodeId) => void;
  onSelectLesson?: (nodeId: NodeId) => void;
  onNextLesson?: (nodeId: NodeId) => void;
  onPrevLesson?: (nodeId: NodeId) => void;
  onBackToCourse?: () => void;
  onDownloadAttachment?: (a: Attachment) => void;
  onAskAgent?: (ctx: { course: { id: number; profileId: number }; nodeId?: NodeId; hint?: string; prompt?: string }) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function LessonPlayer({
  lesson,
  outline,
  onPassStep,
  onPassOrResetLesson,
  onSelectLesson,
  onNextLesson,
  onPrevLesson,
  onBackToCourse,
  onDownloadAttachment,
  onAskAgent,
  t = defaultT,
  iconSlot,
  className = ''
}: LessonPlayerProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showOutlineMobile, setShowOutlineMobile] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [pollVotedOption, setPollVotedOption] = useState<string | null>(null);

  const steps = lesson.steps || [];
  const currentStep: Step | undefined = steps[activeStepIndex];
  const isLessonComplete = lesson.progress.status === 'completed';

  // Keyboard navigation: Left/Right arrow for steps, '?' for shortcuts help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;

      if (e.key === 'ArrowRight' && activeStepIndex < steps.length - 1) {
        setActiveStepIndex((idx) => idx + 1);
      } else if (e.key === 'ArrowLeft' && activeStepIndex > 0) {
        setActiveStepIndex((idx) => idx - 1);
      } else if (e.key === '?') {
        setShowShortcutsModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStepIndex, steps.length]);

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Courses', onClick: onBackToCourse },
    ...(lesson.modulePath?.map((m) => ({
      label: m.title,
      onClick: () => onSelectLesson?.(m.nodeId)
    })) || []),
    { label: lesson.title }
  ];

  const handleStepPass = (step: Step) => {
    onPassStep?.(step.id);
    // If not last step, advance automatically
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex((idx) => idx + 1);
    }
  };

  /* ---------------- STEP CONTENT RENDERER ---------------- */
  const STEP_TYPE_LABELS: Record<string, string> = {
    bx_classes: 'Lesson',
    bx_posts: 'Post',
    bx_videos: 'Video',
    bx_photos: 'Image',
    bx_polls: 'Quiz',
    bx_files: 'File'
  };
  const renderStepContent = (step: Step) => {
    switch (step.contentType) {
      case 'bx_videos':
        if (!step.video?.src) return null;
        return (
          <div className="space-y-4">
            <VideoPlayer
              src={step.video.src}
              poster={step.video.poster}
              title={step.title}
              onEnded={() => !step.passed && onPassStep?.(step.id)}
            />
            {step.textHtml && <RichText html={step.textHtml} className="text-sm" />}
          </div>
        );

      case 'bx_photos':
        return (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <ImageWithFallback
                src={step.image?.src}
                alt={step.title}
                aspectRatio="16:9"
                className="w-full object-cover"
              />
            </div>
            {step.textHtml && <RichText html={step.textHtml} className="text-sm" />}
          </div>
        );

      case 'bx_polls':
        return (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
              <RenderIcon name="check" className="w-4 h-4" iconSlot={iconSlot} />
              <span>Knowledge Check Assessment</span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              {step.title}
            </h4>
            {step.textHtml && <RichText html={step.textHtml} className="text-xs" />}

            <div className="space-y-2.5 pt-2">
              {step.options?.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPollVotedOption(opt)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    pollVotedOption === opt
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      case 'bx_files':
        return (
          <div className="space-y-4">
            <FileRow
              attachment={step}
              onDownload={onDownloadAttachment}
            />
            {step.textHtml && <RichText html={step.textHtml} className="text-sm" />}
          </div>
        );

      case 'bx_classes':
      case 'bx_posts':
      default:
        if (!step.textHtml && !step.image?.src) return null;
        return (
          <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            {step.image?.src && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <ImageWithFallback
                  src={step.image.src}
                  alt={step.title}
                  aspectRatio="16:9"
                  className="w-full object-cover"
                />
              </div>
            )}
            {step.textHtml && <RichText html={step.textHtml} />}
          </div>
        );
    }
  };

  return (
    <div className={`min-h-[85vh] flex flex-col justify-between ${className}`}>
      {/* Top Header Bar */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <Breadcrumbs items={breadcrumbItems} iconSlot={iconSlot} className="mb-1.5" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 font-display truncate">
            {lesson.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile outline drawer toggle */}
          <button
            type="button"
            onClick={() => setShowOutlineMobile(true)}
            className="lg:hidden px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <RenderIcon name="list" className="w-3.5 h-3.5" iconSlot={iconSlot} />
            <span>Outline</span>
          </button>

          {/* AI assistant entry */}
          <AgentEntry
            course={{ id: lesson.courseId, profileId: lesson.courseId, title: lesson.title }}
            nodeId={lesson.nodeId}
            nodeTitle={lesson.title}
            variant="compact"
            onAskAgent={onAskAgent}
            iconSlot={iconSlot}
          />
        </div>
      </div>

      {/* Main 3-Zone Body Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-start">
        {/* Left Zone: Outline Tree Rail (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 sticky top-6 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Curriculum Outline
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {lesson.progress.percent}% Done
            </span>
          </div>

          {outline ? (
            <TreeView
              items={outline.items}
              selectedNodeId={lesson.nodeId}
              onSelectNode={(node) => {
                if (node.level === 3) onSelectLesson?.(node.nodeId);
              }}
              iconSlot={iconSlot}
            />
          ) : (
            <div className="py-4 space-y-2.5" aria-hidden="true">
              {['w-11/12', 'w-10/12', 'w-9/12', 'w-10/12', 'w-8/12'].map((w, i) => (
                <div key={i} className={`h-3 rounded bg-slate-100 dark:bg-slate-800 ${w}`} />
              ))}
            </div>
          )}
        </div>

        {/* Center Zone: Lesson & Step Content */}
        <div className="lg:col-span-6 space-y-6">
          {/* Completed lesson congratulations banner */}
          {isLessonComplete && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <RenderIcon name="check" className="w-5 h-5" iconSlot={iconSlot} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {t('lesson.lesson_completed_banner')}
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    {t('lesson.lesson_completed_desc')}
                  </p>
                </div>
              </div>

              {onPassOrResetLesson && (
                <button
                  type="button"
                  onClick={() => onPassOrResetLesson(lesson.nodeId)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {t('lesson.reset_lesson')}
                </button>
              )}
            </div>
          )}

          {/* Steps navigation dots / indicators (dots need 2+ steps to mean anything) */}
          {steps.length > 0 ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('lesson.step_count', {
                    current: activeStepIndex + 1,
                    total: steps.length
                  })}
                </span>

                {steps.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {steps.map((st, i) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveStepIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                          i === activeStepIndex
                            ? 'w-6 bg-blue-600'
                            : st.passed
                            ? 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        title={st.title}
                        aria-label={`Step ${i + 1}: ${st.title}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {currentStep && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
                        {STEP_TYPE_LABELS[currentStep.contentType] || currentStep.typeLabel || 'Lesson'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                        {currentStep.title}
                      </h3>
                    </div>

                    {currentStep.passed && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <RenderIcon name="check" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>

                  {/* Render the specific step */}
                  {renderStepContent(currentStep)}

                  {/* Pass / Complete Step Primary CTA */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button
                      variant={currentStep.passed ? 'outline' : 'primary'}
                      size="md"
                      icon={currentStep.passed ? 'check' : 'arrow-right'}
                      iconPosition="right"
                      iconSlot={iconSlot}
                      onClick={() => handleStepPass(currentStep)}
                    >
                      {currentStep.passed ? 'Completed (Next Step)' : t('lesson.mark_complete')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-center space-y-3">
              <p className="text-xs text-slate-500">{t('lesson.no_steps')}</p>
              {lesson.textHtml && <RichText html={lesson.textHtml} />}
            </div>
          )}
        </div>

        {/* Right Zone: Attachments Rail */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
              {t('lesson.attachments_title')}
            </h4>

            {lesson.attachments && lesson.attachments.length > 0 ? (
              <div className="space-y-2.5">
                {lesson.attachments.map((att) => (
                  <FileRow
                    key={att.id}
                    attachment={att}
                    onDownload={onDownloadAttachment}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                {t('lesson.no_attachments')}
              </p>
            )}
          </div>

          {/* Quick Keyboard shortcuts hint */}
          <div className="p-3 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl text-center">
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium"
            >
              {t('lesson.keyboard_help')}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar (hidden when the lesson has neither neighbour) */}
      {(lesson.prev?.nodeId || lesson.next?.nodeId) && (
        <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-4 rounded-xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          {lesson.prev && onPrevLesson && (
            <Button
              variant="secondary"
              size="sm"
              icon="chevron-left"
              iconSlot={iconSlot}
              onClick={() => onPrevLesson(lesson.prev!.nodeId)}
            >
              {t('lesson.prev_lesson')}
            </Button>
          )}
        </div>

        {/* Center: upcoming lesson title */}
        <div className="flex items-center justify-center min-w-0 flex-1 px-3">
          {lesson.next?.title && (
            <h5 className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate text-center">
              <span className="font-semibold text-slate-400 dark:text-slate-500">Next: </span>
              {lesson.next.title}
            </h5>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end shrink-0">
          {lesson.next && onNextLesson && (
            <Button
              variant="primary"
              size="sm"
              icon="chevron-right"
              iconPosition="right"
              iconSlot={iconSlot}
              onClick={() => onNextLesson(lesson.next!.nodeId)}
            >
              {t('lesson.next_lesson')}
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Mobile Outline Drawer Modal */}
      <Modal
        isOpen={showOutlineMobile}
        onClose={() => setShowOutlineMobile(false)}
        title="Course Outline"
        iconSlot={iconSlot}
      >
        {outline && (
          <TreeView
            items={outline.items}
            selectedNodeId={lesson.nodeId}
            onSelectNode={(node) => {
              if (node.level === 3) {
                setShowOutlineMobile(false);
                onSelectLesson?.(node.nodeId);
              }
            }}
            iconSlot={iconSlot}
          />
        )}
      </Modal>

      {/* Keyboard Shortcuts Help Modal */}
      <Modal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        title="Keyboard Shortcuts"
        iconSlot={iconSlot}
      >
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
            <span>Next Step</span>
            <kbd className="px-2 py-1 font-mono bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              →
            </kbd>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
            <span>Previous Step</span>
            <kbd className="px-2 py-1 font-mono bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ←
            </kbd>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
            <span>Open Shortcuts Help</span>
            <kbd className="px-2 py-1 font-mono bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ?
            </kbd>
          </div>
          <div className="flex justify-between items-center py-1">
            <span>Close Modal / Drawer</span>
            <kbd className="px-2 py-1 font-mono bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LessonPlayer;
