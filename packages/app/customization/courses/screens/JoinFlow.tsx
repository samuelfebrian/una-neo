/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * JoinFlow: Handles enrollment transitions (free join, pricing modal, pending review, invitation accept/decline).
 */

import React, { useState } from 'react';
import type { Course, TranslateFn, IconSlotFn } from '../types';
import { Button } from '../primitives/Button';
import { Modal } from '../primitives/Modal';
import { PricingPanel } from './PricingPanel';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface JoinFlowProps {
  course: Course;
  enrollmentStatus?: 'guest' | 'not_enrolled' | 'pending' | 'invited' | 'enrolled' | 'completed';
  invitationKey?: string;
  onJoinFree?: () => void;
  onJoinPlan?: (planId: number) => void;
  onCancelJoinRequest?: () => void;
  onAcceptInvitation?: (key: string) => void;
  onDeclineInvitation?: (key: string) => void;
  onOpenCurriculum?: () => void;
  formatPrice?: (price: string, currency?: string, periodUnit?: string) => string;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function JoinFlow({
  course,
  enrollmentStatus = 'not_enrolled',
  invitationKey,
  onJoinFree,
  onJoinPlan,
  onCancelJoinRequest,
  onAcceptInvitation,
  onDeclineInvitation,
  onOpenCurriculum,
  formatPrice,
  t = defaultT,
  iconSlot,
  className = ''
}: JoinFlowProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showConfirmFree, setShowConfirmFree] = useState(false);

  const hasPaidPlans = course.pricing && course.pricing.length > 0;

  // 1. Invited Banner
  if (enrollmentStatus === 'invited' && invitationKey) {
    return (
      <div
        className={`p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <RenderIcon name="sparkles" className="w-5 h-5 text-blue-600" iconSlot={iconSlot} />
          <div>
            <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              You&apos;ve been invited to join this course!
            </h4>
            <p className="text-[11px] text-blue-700 dark:text-blue-300">
              Accept to immediately start learning and participating.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeclineInvitation?.(invitationKey)}
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAcceptInvitation?.(invitationKey)}
          >
            Accept Invitation
          </Button>
        </div>
      </div>
    );
  }

  // 2. Pending Approval
  if (enrollmentStatus === 'pending') {
    return (
      <div
        className={`p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <RenderIcon name="clock" className="w-5 h-5 text-amber-600" iconSlot={iconSlot} />
          <div>
            <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Join Request Pending Review
            </h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              The instructor has been notified and will approve your access shortly.
            </p>
          </div>
        </div>

        {onCancelJoinRequest && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancelJoinRequest}
          >
            Cancel Request
          </Button>
        )}
      </div>
    );
  }

  // 3. Already Enrolled / Completed
  if (enrollmentStatus === 'enrolled' || enrollmentStatus === 'completed') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Button
          variant="primary"
          size="md"
          icon="book"
          iconSlot={iconSlot}
          onClick={onOpenCurriculum}
        >
          {enrollmentStatus === 'completed' ? 'Review Lessons' : 'Continue Learning'}
        </Button>
      </div>
    );
  }

  // 4. Guest / Not Enrolled
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {hasPaidPlans ? (
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowPricingModal(true)}
          icon="sparkles"
          iconSlot={iconSlot}
        >
          {t('card.cta.join_paid')}
        </Button>
      ) : (
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowConfirmFree(true)}
        >
          {t('card.cta.join')}
        </Button>
      )}

      {/* Free join confirmation modal */}
      <Modal
        isOpen={showConfirmFree}
        onClose={() => setShowConfirmFree(false)}
        title={t('card.cta.join')}
        description={`Confirm your enrollment in "${course.title}".`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmFree(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowConfirmFree(false);
                onJoinFree?.();
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
        iconSlot={iconSlot}
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Enrolling will grant you full access to the course outline, sequential lessons, progress tracking, and student discussions.
        </p>
      </Modal>

      {/* Paid plans modal */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        size="lg"
        iconSlot={iconSlot}
      >
        <PricingPanel
          plans={course.pricing || []}
          onSelectPlan={(planId) => {
            setShowPricingModal(false);
            onJoinPlan?.(planId);
          }}
          formatPrice={formatPrice}
          t={t}
          iconSlot={iconSlot}
        />
      </Modal>
    </div>
  );
}

export default JoinFlow;
