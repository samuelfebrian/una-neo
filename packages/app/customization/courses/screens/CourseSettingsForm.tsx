/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CourseSettingsForm: Edit course metadata, cover image, category, and access policies.
 */

import React from 'react';
import type { Course, FormPayload, TranslateFn, IconSlotFn } from '../types';
import { FormRenderer } from '../primitives/FormRenderer';
import { ImageWithFallback } from '../primitives/ImageWithFallback';
import { Button } from '../primitives/Button';
import { defaultT } from '../tokens/i18n';

export interface CourseSettingsFormProps {
  course: Course;
  onSave?: (updatedCourse: Partial<Course>) => Promise<{ ok: boolean; errors?: Record<string, string> } | void>;
  onPickCover?: () => void;
  onCancel?: () => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function CourseSettingsForm({
  course,
  onSave,
  onPickCover,
  onCancel,
  t = defaultT,
  iconSlot,
  className = ''
}: CourseSettingsFormProps) {
  const formPayload: FormPayload = {
    display: 'course_settings',
    title: 'General Course Settings',
    inputs: [
      {
        name: 'title',
        type: 'text',
        caption: 'Course Title',
        required: true,
        value: course.title,
        placeholder: 'e.g. Full-Stack Web Architecture'
      },
      {
        name: 'category',
        type: 'select',
        caption: 'Category',
        required: true,
        value: course.category || 'Software Engineering',
        values: [
          { key: 'Software Engineering', value: 'Software Engineering' },
          { key: 'Machine Learning & AI', value: 'Machine Learning & AI' },
          { key: 'Cloud & DevOps', value: 'Cloud & DevOps' },
          { key: 'Product Design & UX', value: 'Product Design & UX' }
        ]
      },
      {
        name: 'textHtml',
        type: 'textarea',
        caption: 'Course Description',
        required: true,
        value: course.textHtml,
        attrs: { rows: 5 },
        placeholder: 'Provide comprehensive information about what learners will achieve...'
      },
      {
        name: 'location',
        type: 'text',
        caption: 'Location / Region',
        value: course.location || 'Online / Global Remote',
        placeholder: 'e.g. Online, San Francisco, London'
      },
      {
        name: 'visibility',
        type: 'select',
        caption: 'Course Visibility',
        required: true,
        value: course.visibility,
        values: [
          { key: 'public', value: 'Public (Listed in Catalog)' },
          { key: 'private', value: 'Private (Invite or Request Only)' }
        ]
      },
      {
        name: 'joinConfirmation',
        type: 'switcher',
        caption: 'Require Instructor Approval for Join Requests',
        value: Boolean(course.joinConfirmation)
      }
    ]
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    return onSave?.({
      title: String(values.title),
      category: String(values.category),
      textHtml: String(values.textHtml),
      location: String(values.location),
      visibility: values.visibility as Course['visibility'],
      joinConfirmation: Boolean(values.joinConfirmation)
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cover image preview & recrop button */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
          Course Cover Artwork (16:7 Aspect Ratio)
        </label>
        <div className="w-full max-w-md aspect-[16/7] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <ImageWithFallback
            src={course.cover?.src}
            alt={course.title}
            aspectRatio="auto"
            focus={course.cover?.focus}
            className="w-full h-full object-cover"
          />
        </div>
        {onPickCover && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="image"
            iconSlot={iconSlot}
            onClick={onPickCover}
          >
            Change Artwork / Focus Point
          </Button>
        )}
      </div>

      <FormRenderer
        form={formPayload}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        t={t}
        iconSlot={iconSlot}
      />
    </div>
  );
}

export default CourseSettingsForm;
