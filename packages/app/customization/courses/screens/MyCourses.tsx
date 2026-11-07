/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MyCourses: Dashboard for learner enrolled courses (Attended) and author created courses (Created / Drafts).
 */

import React, { useState } from 'react';
import type { CourseSummary, TranslateFn, IconSlotFn } from '../types';
import { CourseList } from '../units/CourseList';
import { Tabs } from '../primitives/Tabs';
import { Button } from '../primitives/Button';
import { defaultT } from '../tokens/i18n';

export interface MyCoursesProps {
  attendedCourses: CourseSummary[];
  createdCourses: CourseSummary[];
  initialTab?: 'attended' | 'created';
  onOpenCourse?: (url: string) => void;
  onContinueCourse?: (course: CourseSummary) => void;
  onCreateCourse?: () => void;
  onEditCourse?: (course: CourseSummary) => void;
  onPublishCourse?: (course: CourseSummary) => void;
  onDeleteCourse?: (course: CourseSummary) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function MyCourses({
  attendedCourses,
  createdCourses,
  initialTab = 'attended',
  onOpenCourse,
  onContinueCourse,
  onCreateCourse,
  onEditCourse,
  t = defaultT,
  iconSlot,
  className = ''
}: MyCoursesProps) {
  const [activeTab, setActiveTab] = useState<'attended' | 'created'>(initialTab);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
            My Courses & Learning Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your milestone completions, resume lessons, and author curriculum content.
          </p>
        </div>

        {onCreateCourse && (
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            iconSlot={iconSlot}
            onClick={onCreateCourse}
          >
            Create New Course
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          {
            key: 'attended',
            label: 'Attended & In Progress',
            count: attendedCourses.length,
            icon: 'book'
          },
          {
            key: 'created',
            label: 'Authored & Drafts',
            count: createdCourses.length,
            icon: 'folder'
          }
        ]}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as any)}
        variant="underline"
        iconSlot={iconSlot}
      />

      {/* Course List Display */}
      {activeTab === 'attended' ? (
        <CourseList
          courses={attendedCourses}
          onOpenCourse={onOpenCourse}
          onContinue={onContinueCourse}
          emptyTitle="You haven't enrolled in any courses yet"
          emptyDescription="Browse the course catalog to discover expert-led curriculums and start learning."
          emptyActionLabel="Browse Catalog"
          onEmptyAction={() => onOpenCourse?.('/courses-search')}
          t={t}
          iconSlot={iconSlot}
        />
      ) : (
        <CourseList
          courses={createdCourses}
          onOpenCourse={onOpenCourse}
          onContinue={onEditCourse}
          emptyTitle="No courses created yet"
          emptyDescription="Start authoring your first technical course today with structured modules and lessons."
          emptyActionLabel="Create Course"
          onEmptyAction={onCreateCourse}
          t={t}
          iconSlot={iconSlot}
        />
      )}
    </div>
  );
}

export default MyCourses;
