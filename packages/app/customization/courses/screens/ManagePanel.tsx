/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ManagePanel: Course administration hub for owners and managers.
 * Provides entry cards for Settings, Curriculum authoring, Pricing, Members, and Publish Checklist.
 */

import React, { useState } from 'react';
import type { Course, Outline, TranslateFn, IconSlotFn } from '../types';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import { Modal } from '../primitives/Modal';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface ManagePanelProps {
  course: Course;
  outline?: Outline;
  onNavigateSub?: (section: 'settings' | 'content' | 'pricing' | 'students' | 'invite') => void;
  onPublishCourse?: (course: Course) => void;
  onUnpublishCourse?: (course: Course) => void;
  onDeleteCourse?: (course: Course, withContent: boolean) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function ManagePanel({
  course,
  outline,
  onNavigateSub,
  onPublishCourse,
  onUnpublishCourse,
  onDeleteCourse,
  t = defaultT,
  iconSlot,
  className = ''
}: ManagePanelProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteWithContent, setDeleteWithContent] = useState(false);

  // Compute publish checklist rules
  const hasTitle = Boolean(course.title && course.title.trim().length > 3);
  const hasDescription = Boolean(course.textHtml && course.textHtml.trim().length > 10);
  const hasCover = Boolean(course.cover?.src);
  const modules = outline?.items?.filter((i) => i.level === 1) || [];
  const lessons = outline?.items?.filter((i) => i.level === 3) || [];
  const hasStructure = modules.length >= 1 && lessons.length >= 1;

  const isPublishReady = hasTitle && hasDescription && hasCover && hasStructure;
  const isPublished = course.status === 'active';

  const checklistItems = [
    { label: t('authoring.checklist.rule_title'), passed: hasTitle },
    { label: t('authoring.checklist.rule_desc'), passed: hasDescription },
    { label: t('authoring.checklist.rule_cover'), passed: hasCover },
    {
      label: `${t('authoring.checklist.rule_module')} (${modules.length} mod, ${lessons.length} les)`,
      passed: hasStructure
    }
  ];

  const manageCards = [
    {
      id: 'content',
      title: 'Curriculum & Outline Editor',
      desc: 'Author modules, topics, lessons, interactive steps, and resources.',
      icon: 'folder',
      action: () => onNavigateSub?.('content')
    },
    {
      id: 'settings',
      title: 'Course Settings & Metadata',
      desc: 'Configure title, description, categories, tags, and visibility.',
      icon: 'settings',
      action: () => onNavigateSub?.('settings')
    },
    {
      id: 'students',
      title: 'Members & Roles Management',
      desc: `Manage ${course.membersCount || 0} enrolled students, mentors, and invitations.`,
      icon: 'users',
      action: () => onNavigateSub?.('students')
    },
    {
      id: 'invite',
      title: 'Invite Members to Course',
      desc: 'UNA invite form for students and mentors, with its own role checks.',
      icon: 'send',
      action: () => onNavigateSub?.('invite')
    },
    {
      id: 'pricing',
      title: 'Pricing Plans & Enrollment',
      desc: 'Configure free or paid membership plans, subscriptions, and access terms.',
      icon: 'sparkles',
      action: () => onNavigateSub?.('pricing')
    }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Status & Publish Checklist Banner */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                {t('authoring.checklist.title')}
              </h4>
              <Badge variant={isPublished ? 'success' : 'warning'}>
                {isPublished ? 'Published Live' : 'Draft (Hidden)'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isPublishReady
                ? t('authoring.checklist.ready')
                : t('authoring.checklist.not_ready')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPublished ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUnpublishCourse?.(course)}
              >
                Unpublish to Draft
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={!isPublishReady}
                onClick={() => onPublishCourse?.(course)}
              >
                {t('course.owner.publish_btn')}
              </Button>
            )}
          </div>
        </div>

        {/* Checklist rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  item.passed
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                }`}
              >
                <RenderIcon name={item.passed ? 'check' : 'close'} className="w-2.5 h-2.5" iconSlot={iconSlot} />
              </div>
              <span
                className={
                  item.passed
                    ? 'text-slate-700 dark:text-slate-300 font-medium'
                    : 'text-slate-400 line-through'
                }
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Management Navigation Cards */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display mb-4">
          Authoring & Operational Tools
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {manageCards.map((card) => (
            <div
              key={card.id}
              onClick={card.action}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <RenderIcon name={card.icon} className="w-5 h-5" iconSlot={iconSlot} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Configure <RenderIcon name="arrow-right" className="w-3 h-3" iconSlot={iconSlot} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Delete Course */}
      <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            Danger Zone
          </h4>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
            Permanently remove this course from the platform.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
        >
          Delete Course
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('common.confirm')}
        description={`Are you sure you want to delete "${course.title}"?`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDeleteCourse?.(course, deleteWithContent);
                setDeleteModalOpen(false);
              }}
            >
              {t('common.delete')}
            </Button>
          </>
        }
        iconSlot={iconSlot}
      >
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <p>
            This action cannot be undone. All student progress records and enrolled member data will be wiped.
          </p>
          <label className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteWithContent}
              onChange={(e) => setDeleteWithContent(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500"
            />
            <span className="font-medium text-rose-700 dark:text-rose-300">
              Also permanently delete underlying lesson steps, attachments, and files
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

export default ManagePanel;
