/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LessonEditor: Inspector for editing lesson details, steps (usage: 0), and attachments (usage: 1).
 * Tabs: Details / Steps / Attachments.
 */

import React, { useState } from 'react';
import type { Lesson, Step, TranslateFn, IconSlotFn } from '../types';
import { Tabs } from '../primitives/Tabs';
import { Button } from '../primitives/Button';
import { Modal } from '../primitives/Modal';
import { DragList } from '../primitives/DragList';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface LessonEditorProps {
  lesson: Lesson;
  onSaveDetails?: (details: { title: string; textHtml: string; passing: 0 | 1 }) => void;
  onAddStep?: (usage: 0 | 1, contentType: string, title: string) => void;
  onEditStep?: (step: Step) => void;
  onDeleteStep?: (stepId: number) => void;
  onReorderSteps?: (usage: 0 | 1, idsInOrder: number[]) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function LessonEditor({
  lesson,
  onSaveDetails,
  onAddStep,
  onEditStep,
  onDeleteStep,
  onReorderSteps,
  t = defaultT,
  iconSlot,
  className = ''
}: LessonEditorProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'steps' | 'attachments'>('steps');
  const [title, setTitle] = useState(lesson.title);
  const [textHtml, setTextHtml] = useState(lesson.textHtml);
  const [passing, setPassing] = useState<0 | 1>(lesson.passing);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStepUsage, setNewStepUsage] = useState<0 | 1>(0);
  const [newStepType, setNewStepType] = useState('bx_videos');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [deleteStepId, setDeleteStepId] = useState<number | null>(null);

  // UNA content modules available for steps and attachments. The list follows
  // UNA's content modules; a module that isn't installed simply 404s and can be
  // installed anytime in UNA Studio.
  const contentTypes = [
    { key: 'bx_videos', label: 'Video Lesson' },
    { key: 'bx_classes', label: 'Interactive Class / Lab' },
    { key: 'bx_posts', label: 'Rich Article / Notes' },
    { key: 'bx_polls', label: 'Knowledge Poll / Quiz' },
    { key: 'bx_files', label: 'Downloadable File Resource' }
  ];

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDetails?.({ title, textHtml, passing });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    onAddStep?.(newStepUsage, newStepType, newStepTitle.trim());
    setNewStepTitle('');
    setAddModalOpen(false);
  };

  const stepListItems = lesson.steps.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: `${s.typeLabel || s.contentType} · ${s.passed ? 'Completed' : 'Pending'}`,
    extra: (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEditStep?.(s)}
          className="p-1 hover:text-blue-600 text-slate-400"
          title="Edit step"
        >
          <RenderIcon name="edit" className="w-3.5 h-3.5" iconSlot={iconSlot} />
        </button>
        <button
          type="button"
          onClick={() => setDeleteStepId(s.id)}
          className="p-1 hover:text-rose-600 text-slate-400"
          title="Delete step"
        >
          <RenderIcon name="trash" className="w-3.5 h-3.5" iconSlot={iconSlot} />
        </button>
      </div>
    )
  }));

  const attachmentListItems = lesson.attachments.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.file?.sizeLabel || a.typeLabel,
    extra: (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEditStep?.(a)}
          className="p-1 hover:text-blue-600 text-slate-400"
          title="Edit attachment"
        >
          <RenderIcon name="edit" className="w-3.5 h-3.5" iconSlot={iconSlot} />
        </button>
        <button
          type="button"
          onClick={() => setDeleteStepId(a.id)}
          className="p-1 hover:text-rose-600 text-slate-400"
          title="Delete attachment"
        >
          <RenderIcon name="trash" className="w-3.5 h-3.5" iconSlot={iconSlot} />
        </button>
      </div>
    )
  }));

  return (
    <div className={`border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xs space-y-5 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
            Lesson Authoring: {lesson.title}
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Node ID: {lesson.nodeId} · Course ID: {lesson.courseId}
          </span>
        </div>

        <Tabs
          items={[
            { key: 'steps', label: `Steps (${lesson.steps.length})` },
            { key: 'attachments', label: `Attachments (${lesson.attachments.length})` },
            { key: 'details', label: 'Settings' }
          ]}
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          variant="segmented"
          iconSlot={iconSlot}
        />
      </div>

      {/* TAB 1: STEPS */}
      {activeTab === 'steps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Interactive milestone steps learners must pass to complete this lesson.
            </span>
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              iconSlot={iconSlot}
              onClick={() => {
                setNewStepUsage(0);
                setAddModalOpen(true);
              }}
            >
              Add Step
            </Button>
          </div>

          {stepListItems.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
              No steps created yet. Add a video, lab, poll, or reading step.
            </div>
          ) : (
            <DragList
              items={stepListItems}
              onReorder={(ids) => onReorderSteps?.(0, ids as number[])}
            />
          )}
        </div>
      )}

      {/* TAB 2: ATTACHMENTS */}
      {activeTab === 'attachments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Downloadable supplementary files and cheatsheets.
            </span>
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              iconSlot={iconSlot}
              onClick={() => {
                setNewStepUsage(1);
                setAddModalOpen(true);
              }}
            >
              Add Attachment
            </Button>
          </div>

          {attachmentListItems.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
              No attachments linked to this lesson.
            </div>
          ) : (
            <DragList
              items={attachmentListItems}
              onReorder={(ids) => onReorderSteps?.(1, ids as number[])}
            />
          )}
        </div>
      )}

      {/* TAB 3: DETAILS */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Lesson Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Lesson Overview & Objectives
            </label>
            <textarea
              rows={4}
              value={textHtml}
              onChange={(e) => setTextHtml(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={passing === 1}
                onChange={(e) => setPassing(e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Sequential Progression Lock
                </span>
                <p className="text-[11px] text-slate-500">
                  When enabled, learners cannot access this lesson until completing all preceding lessons.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm">
              Save Lesson Details
            </Button>
          </div>
        </form>
      )}

      {/* Add Step/Attachment Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={newStepUsage === 0 ? 'Add Lesson Step' : 'Add Attachment'}
        iconSlot={iconSlot}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Content Type
            </label>
            <select
              value={newStepType}
              onChange={(e) => setNewStepType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              {contentTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Architecture Video Walkthrough"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Content
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteStepId)}
        onClose={() => setDeleteStepId(null)}
        title={t('common.confirm')}
        description="Are you sure you want to delete this content item?"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteStepId(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (deleteStepId) onDeleteStep?.(deleteStepId);
                setDeleteStepId(null);
              }}
            >
              {t('common.delete')}
            </Button>
          </>
        }
        iconSlot={iconSlot}
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          This removes the step or attachment reference and wipes its associated progression data.
        </p>
      </Modal>
    </div>
  );
}

export default LessonEditor;
