/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AdminCourses: Platform governance and moderation grid for all courses.
 * Uses AuthoringGrid + GridRenderer with status filters and bulk actions.
 */

import React, { useState } from 'react';
import type { Course, AuthoringGrid, GridAction, TranslateFn, IconSlotFn } from '../types';
import { GridRenderer } from '../primitives/GridRenderer';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface AdminCoursesProps {
  courses: Course[];
  onCourseAction?: (actionName: string, courseId?: number, action?: GridAction) => void;
  onBulkAction?: (actionName: string, selectedCourseIds: number[]) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function AdminCourses({
  courses,
  onCourseAction,
  onBulkAction,
  t = defaultT,
  iconSlot,
  className = ''
}: AdminCoursesProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'pending' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = courses.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.author.name.toLowerCase().includes(q);
    }
    return true;
  });

  const authoringGrid: AuthoringGrid = {
    header: [
      { name: 'course', title: 'Course Title', width: '35%' },
      { name: 'author', title: 'Instructor', width: '20%' },
      { name: 'status', title: 'Status', width: '15%' },
      { name: 'members', title: 'Enrolled', width: '10%' },
      { name: 'actions', title: 'Actions', width: '20%' }
    ],
    rows: filtered.map((c) => ({
      id: c.id,
      cells: {
        course: { type: 'link', text: c.title, url: c.url },
        author: {
          type: 'profile',
          data: {
            id: c.author.id,
            name: c.author.name,
            avatarUrl: c.author.avatarUrl
          }
        },
        status: { type: 'text', value: c.status.toUpperCase() },
        members: { type: 'counters', value: String(c.membersCount ?? 0) },
        actions: {
          type: 'actions',
          actions: [
            { name: 'audit_content', title: 'Audit Content', kind: 'callback' },
            { name: 'settings', title: 'Settings', kind: 'callback' },
            { name: 'delete', title: 'Delete', kind: 'callback', confirm: true }
          ]
        }
      }
    })),
    actions: {
      bulk: [
        { name: 'clear_reports', title: t('admin.bulk.clear_reports'), kind: 'callback' },
        { name: 'bulk_delete', title: t('admin.bulk.delete'), kind: 'callback', confirm: true }
      ]
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Moderation Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
            {t('admin.title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review, verify, and moderate published and draft courses across the learning ecosystem.
          </p>
        </div>

        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-2.5 text-slate-400">
            <RenderIcon name="search" className="w-4 h-4" iconSlot={iconSlot} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: t('admin.status_all') },
          { key: 'active', label: t('admin.status_active') },
          { key: 'hidden', label: t('admin.status_hidden') },
          { key: 'pending', label: t('admin.status_pending') },
          { key: 'suspended', label: t('admin.status_suspended') }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer select-none ${
              statusFilter === tab.key
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Authoring Grid */}
      <GridRenderer
        grid={authoringGrid}
        onActionClick={onCourseAction}
        onBulkAction={onBulkAction}
        t={t}
        iconSlot={iconSlot}
      />
    </div>
  );
}

export default AdminCourses;
