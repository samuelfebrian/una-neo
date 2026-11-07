/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AgentEntry: Contextual AI assistant entry point & action chips.
 * Invokes onAskAgent({ course, nodeId, hint, prompt }).
 */

import React, { useState } from 'react';
import type { Course, NodeId, TranslateFn, IconSlotFn } from '../types';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface AgentEntryProps {
  course: Pick<Course, 'id' | 'profileId' | 'title'>;
  nodeId?: NodeId;
  nodeTitle?: string;
  onAskAgent?: (ctx: {
    course: Pick<Course, 'id' | 'profileId'>;
    nodeId?: NodeId;
    hint?: string;
    prompt?: string;
  }) => void;
  variant?: 'button' | 'chips' | 'compact' | 'full';
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function AgentEntry({
  course,
  nodeId,
  nodeTitle,
  onAskAgent,
  variant = 'button',
  t = defaultT,
  iconSlot,
  className = ''
}: AgentEntryProps) {
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const chips = [
    { key: 'explain', label: t('agent.chip.explain'), hint: 'explain_step' },
    { key: 'summarize', label: t('agent.chip.summarize'), hint: 'summarize' },
    { key: 'quiz', label: t('agent.chip.quiz'), hint: 'quiz_me' },
    { key: 'next', label: t('agent.chip.next'), hint: 'whats_next' },
    { key: 'attachments', label: t('agent.chip.attachments'), hint: 'find_attachments' }
  ];

  const handleChipClick = (hint: string, label: string) => {
    setActiveHint(hint);
    onAskAgent?.({
      course: { id: course.id, profileId: course.profileId },
      nodeId,
      hint,
      prompt: `${label} regarding "${nodeTitle || course.title}"`
    });
  };

  const handlePrimaryClick = () => {
    onAskAgent?.({
      course: { id: course.id, profileId: course.profileId },
      nodeId,
      hint: nodeId ? 'lesson_query' : 'course_query',
      prompt: nodeId
        ? `I have a question about this lesson: "${nodeTitle || ''}"`
        : `I have a question about this course: "${course.title}"`
    });
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handlePrimaryClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer ${className}`}
        title="Ask AI Assistant"
      >
        <RenderIcon name="sparkles" className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" iconSlot={iconSlot} />
        <span>Ask AI</span>
      </button>
    );
  }

  if (variant === 'chips') {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => handleChipClick(chip.hint, chip.label)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              activeHint === chip.hint
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <RenderIcon name="sparkles" className="w-3 h-3 text-blue-500" iconSlot={iconSlot} />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-xl border border-blue-100 dark:border-blue-950/60 bg-gradient-to-r from-blue-50/70 via-slate-50 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <RenderIcon name="sparkles" className="w-4 h-4" iconSlot={iconSlot} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {nodeId ? t('agent.btn_lesson') : t('agent.btn_course')}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Instant insights, conceptual explanations, code explanations, and knowledge checks.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        {chips.slice(0, 3).map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => handleChipClick(chip.hint, chip.label)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
          >
            {chip.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          Ask Anything
        </button>
      </div>
    </div>
  );
}

export default AgentEntry;
