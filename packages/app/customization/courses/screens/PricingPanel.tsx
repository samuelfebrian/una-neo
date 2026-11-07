/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PricingPanel: Displays available enrollment plans (buy, subscribe, choose).
 * States: default plan badge, unpurchasable / payment disabled, confirmation modal.
 */

import React, { useState } from 'react';
import type { PricingPlan, TranslateFn, IconSlotFn } from '../types';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import { Modal } from '../primitives/Modal';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface PricingPanelProps {
  plans: PricingPlan[];
  onSelectPlan: (planId: number) => void;
  formatPrice?: (price: string, currency?: string, periodUnit?: string) => string;
  isPaymentAvailable?: boolean;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function PricingPanel({
  plans,
  onSelectPlan,
  formatPrice,
  isPaymentAvailable = true,
  t = defaultT,
  iconSlot,
  className = ''
}: PricingPanelProps) {
  const [selectedPlanForConfirm, setSelectedPlanForConfirm] = useState<PricingPlan | null>(null);

  const formatPeriodLabel = (unit: PricingPlan['periodUnit'], period = 1) => {
    if (unit === 'lifetime') return 'lifetime access';
    if (period === 1) return `per ${unit}`;
    return `every ${period} ${unit}s`;
  };

  const getActionLabel = (plan: PricingPlan) => {
    if (plan.action === 'subscribe') return t('pricing.cta.subscribe');
    if (plan.action === 'choose') return t('pricing.cta.choose');
    return t('pricing.cta.buy');
  };

  const handlePlanClick = (plan: PricingPlan) => {
    if (!plan.purchasable || !isPaymentAvailable) return;
    // Safety net: confirm before submit
    setSelectedPlanForConfirm(plan);
  };

  const handleConfirm = () => {
    if (selectedPlanForConfirm) {
      onSelectPlan(selectedPlanForConfirm.id);
      setSelectedPlanForConfirm(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center max-w-xl mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
          {t('pricing.title')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {t('pricing.subtitle')}
        </p>
      </div>

      {!isPaymentAvailable && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-2">
          <RenderIcon name="alert" className="w-4 h-4 text-amber-600" iconSlot={iconSlot} />
          <span>{t('pricing.disabled_unavailable')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {plans.map((plan) => {
          const isPurchasable = plan.purchasable && isPaymentAvailable;
          const displayPrice = formatPrice
            ? formatPrice(plan.price, plan.currency, plan.periodUnit)
            : `${plan.currency || '$'}${plan.price}`;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative bg-white dark:bg-slate-900 ${
                plan.isDefault
                  ? 'border-blue-600 dark:border-blue-500 shadow-md ring-1 ring-blue-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              } ${!isPurchasable ? 'opacity-60' : ''}`}
            >
              {plan.isDefault && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand">{t('pricing.badge_recommended')}</Badge>
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                      {plan.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Role: {plan.roleName}
                    </span>
                  </div>
                </div>

                {plan.caption && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {plan.caption}
                  </p>
                )}

                <div className="my-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-display font-mono tabular-nums">
                      {displayPrice}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      /{formatPeriodLabel(plan.periodUnit, plan.period)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant={plan.isDefault ? 'primary' : 'secondary'}
                  disabled={!isPurchasable}
                  onClick={() => handlePlanClick(plan)}
                  className="w-full"
                >
                  {getActionLabel(plan)}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation modal before money / plan commitment */}
      <Modal
        isOpen={Boolean(selectedPlanForConfirm)}
        onClose={() => setSelectedPlanForConfirm(null)}
        title={t('common.confirm')}
        description={
          selectedPlanForConfirm
            ? t('pricing.confirm_prompt', {
                planName: selectedPlanForConfirm.name,
                price: `${selectedPlanForConfirm.currency || '$'}${selectedPlanForConfirm.price}`
              })
            : ''
        }
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPlanForConfirm(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirm}>
              {t('common.confirm')}
            </Button>
          </>
        }
        iconSlot={iconSlot}
      >
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <p>
            You will gain immediate access to the curriculum modules, step evaluations, downloadable resources, and mentor discussions for the duration of this plan.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default PricingPanel;
