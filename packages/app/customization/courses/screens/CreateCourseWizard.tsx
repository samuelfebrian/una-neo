/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CreateCourseWizard: 6-step creation flow for authors:
 * Step 1: Details
 * Step 2: Media & Artwork
 * Step 3: Privacy & Access
 * Step 4: Initial Members
 * Step 5: Pricing Setup
 * Step 6: Review & Launch (Created as hidden draft)
 */

import React, { useState } from 'react';
import type { Course, TranslateFn, IconSlotFn } from '../types';
import { Button } from '../primitives/Button';
import { ImageWithFallback } from '../primitives/ImageWithFallback';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface CreateCourseWizardProps {
  onCreateCourse?: (courseData: Partial<Course>) => Promise<{ ok: boolean; slug?: string } | void>;
  onCancel?: () => void;
  onSuccessOpenEditor?: (slug: string) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function CreateCourseWizard({
  onCreateCourse,
  onCancel,
  onSuccessOpenEditor,
  t = defaultT,
  iconSlot,
  className = ''
}: CreateCourseWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Software Engineering');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Online / Remote');
  const [labels, setLabels] = useState('react, typescript, architecture');

  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinConfirmation, setJoinConfirmation] = useState(false);

  const [initialInvites, setInitialInvites] = useState('');
  const [pricingType, setPricingType] = useState<'free' | 'paid'>('free');
  const [paidPrice, setPaidPrice] = useState('49');

  const stepTitles = [
    { num: 1, title: t('authoring.create.step1') },
    { num: 2, title: t('authoring.create.step2') },
    { num: 3, title: t('authoring.create.step3') },
    { num: 4, title: t('authoring.create.step4') },
    { num: 5, title: t('authoring.create.step5') },
    { num: 6, title: t('authoring.create.step6') }
  ];

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `course-${Date.now()}`;
      const res = await onCreateCourse?.({
        title,
        slug,
        category,
        textHtml: `<p>${description}</p>`,
        location,
        labels: labels.split(',').map((s) => s.trim()).filter(Boolean),
        visibility,
        joinConfirmation,
        status: 'hidden', // Warning rule: Created as hidden draft
        cover: { src: coverUrl, height: 400 },
        pricing:
          pricingType === 'paid'
            ? [
                {
                  id: 1,
                  roleId: 1,
                  roleName: 'Student Access',
                  name: 'Standard Enrollment',
                  price: paidPrice,
                  currency: '$',
                  period: 1,
                  periodUnit: 'month',
                  isDefault: true,
                  active: true,
                  action: 'buy',
                  purchasable: true
                }
              ]
            : []
      });

      setCreatedSlug(res && res.slug ? res.slug : slug);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdSlug) {
    return (
      <div className={`p-8 sm:p-12 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 text-center max-w-xl mx-auto shadow-sm ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <RenderIcon name="check" className="w-7 h-7" iconSlot={iconSlot} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
          Course Created in Draft Mode!
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
          Your new course &quot;{title}&quot; is safely stored as a draft. Open the content outline editor now to structure your curriculum modules, author lessons, and publish live.
        </p>
        <Button
          variant="primary"
          size="md"
          icon="folder"
          iconSlot={iconSlot}
          onClick={() => onSuccessOpenEditor?.(createdSlug)}
        >
          Open Curriculum Editor
        </Button>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs ${className}`}>
      {/* Wizard Step Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
          <span>Step {currentStep} of 6</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {stepTitles[currentStep - 1]?.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {stepTitles.map((s) => (
            <div
              key={s.num}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s.num <= currentStep
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: DETAILS */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Course Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Systems & High-Scale Microservices"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="Software Engineering">Software Engineering</option>
              <option value="Machine Learning & AI">Machine Learning & AI</option>
              <option value="Cloud Architecture">Cloud Architecture</option>
              <option value="Product Design & UX">Product Design & UX</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Course Overview & Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Explain the technical concepts, hands-on milestones, and outcomes students will acquire..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Labels / Tags (comma separated)
              </label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MEDIA */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Course Cover Artwork (16:7 preview)
          </label>
          <div className="w-full aspect-[16/7] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <ImageWithFallback
              src={coverUrl}
              alt="Cover Preview"
              aspectRatio="auto"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Artwork Image URL
            </label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Recommended resolution: 1200x525 (16:7 aspect ratio).
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: PRIVACY & ACCESS */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Catalog Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                  visibility === 'public'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs">Public Course</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Listed in the hub catalog; anyone can find and enroll.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                  visibility === 'private'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs">Private Course</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Hidden curriculum; requires invitation or approval to view lessons.
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={joinConfirmation}
                onChange={(e) => setJoinConfirmation(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Require manual instructor approval
                </span>
                <p className="text-[11px] text-slate-500">
                  New student enrollments will be queued in &quot;Pending&quot; status for your review.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* STEP 4: INITIAL MEMBERS */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Invite Cohort Members (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="dev-cohort@company.org, alex@test.com"
              value={initialInvites}
              onChange={(e) => setInitialInvites(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Invitations will be dispatched once you publish the course live.
            </p>
          </div>
        </div>
      )}

      {/* STEP 5: PRICING */}
      {currentStep === 5 && (
        <div className="space-y-5">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Pricing Model
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPricingType('free')}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                pricingType === 'free'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Free Enrollment
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Learners can freely join without entering payment credentials.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPricingType('paid')}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                pricingType === 'paid'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Paid Access Plan
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Monetize your curriculum with subscriptions or one-time access.
              </div>
            </button>
          </div>

          {pricingType === 'paid' && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Monthly Subscription Price ($ USD)
              </label>
              <input
                type="number"
                min="1"
                value={paidPrice}
                onChange={(e) => setPaidPrice(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          )}
        </div>
      )}

      {/* STEP 6: REVIEW & LAUNCH */}
      {currentStep === 6 && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-bold">Important Notice: </span>
            This course will be created in <strong>Hidden / Draft mode</strong>. You can comfortably add modules, video lessons, and resources in the Outline Editor before publishing it to the public catalog.
          </div>

          <div className="space-y-3 text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-between">
              <span className="text-slate-500">Title:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Visibility:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{visibility}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pricing:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {pricingType === 'paid' ? `$${paidPrice} / month` : 'Free'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-100 dark:border-slate-800">
        <div>
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              {t('common.back')}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
        </div>

        <div>
          {currentStep < 6 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={currentStep === 1 && (!title.trim() || !description.trim())}
              onClick={() => setCurrentStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleFinish}
            >
              Create Course (Draft)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateCourseWizard;
