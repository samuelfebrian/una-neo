/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { CommentItem, TranslateFn, IconSlotFn } from '../types';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { RenderIcon } from './IconSlot';
import { RichText } from './RichText';
import { defaultT } from '../tokens/i18n';

export interface CommentThreadProps {
  comments: CommentItem[];
  onPostComment?: (text: string, replyTo?: number) => void;
  onEditComment?: (id: number, text: string) => void;
  onDeleteComment?: (id: number) => void;
  onVoteComment?: (id: number, dir: 1 | -1) => void;
  onReportComment?: (id: number) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function CommentThread({
  comments,
  onPostComment,
  onEditComment,
  onDeleteComment,
  onVoteComment,
  onReportComment,
  t = defaultT,
  iconSlot,
  className = ''
}: CommentThreadProps) {
  const [rootText, setRootText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');

  const handleRootSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootText.trim()) return;
    onPostComment?.(rootText.trim());
    setRootText('');
  };

  const handleReplySubmit = (parentId: number) => {
    if (!replyText.trim()) return;
    onPostComment?.(replyText.trim(), parentId);
    setReplyText('');
    setReplyingTo(null);
  };

  const handleEditSubmit = (id: number) => {
    if (!editText.trim()) return;
    onEditComment?.(id, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  // Group comments hierarchically
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') return (b.votes ?? 0) - (a.votes ?? 0);
    return b.ts - a.ts;
  });

  const rootComments = sortedComments.filter((c) => !c.parentId);
  const repliesMap = new Map<number, CommentItem[]>();
  sortedComments.forEach((c) => {
    if (c.parentId) {
      const list = repliesMap.get(c.parentId) || [];
      list.push(c);
      repliesMap.set(c.parentId, list);
    }
  });

  const renderComment = (comment: CommentItem) => {
    const isReplying = replyingTo === comment.id;
    const isEditing = editingId === comment.id;
    const replies = repliesMap.get(comment.id) || [];

    return (
      <div key={comment.id} className="group relative">
        <div className="flex gap-3">
          <Avatar
            src={comment.author.avatarUrl}
            name={comment.author.name}
            size="sm"
          />

          <div className="flex-1 min-w-0">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {comment.author.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {new Date(comment.ts).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {comment.canReport && onReportComment && (
                    <button
                      type="button"
                      onClick={() => onReportComment(comment.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                      title={t('discussions.report')}
                    >
                      {t('discussions.report')}
                    </button>
                  )}
                  {comment.mine && onEditComment && !isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditText(comment.textHtml.replace(/<[^>]+>/g, ''));
                      }}
                      className="text-slate-400 hover:text-blue-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                      title={t('discussions.edit')}
                    >
                      {t('discussions.edit')}
                    </button>
                  )}
                  {comment.canDelete && onDeleteComment && (
                    <button
                      type="button"
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                      title={t('discussions.delete')}
                    >
                      {t('discussions.delete')}
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditSubmit(comment.id)}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <RichText html={comment.textHtml} className="text-xs" />
              )}
            </div>

            {/* Actions: vote & reply */}
            <div className="flex items-center gap-3 mt-1.5 px-2 text-xs text-slate-500 dark:text-slate-400">
              {comment.canVote && onVoteComment && (
                <button
                  type="button"
                  onClick={() => onVoteComment(comment.id, 1)}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <RenderIcon name="like" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                  <span className="font-mono tabular-nums text-[11px]">
                    {comment.votes ?? 0}
                  </span>
                </button>
              )}

              {comment.canReply && onPostComment && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(isReplying ? null : comment.id);
                    setReplyText('');
                  }}
                  className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
                >
                  {t('discussions.reply')}
                </button>
              )}
            </div>

            {/* Inline reply composer */}
            {isReplying && (
              <div className="mt-3 ml-2 pl-3 border-l-2 border-blue-200 dark:border-blue-900/60">
                <textarea
                  rows={2}
                  placeholder={t('discussions.composer_placeholder')}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReplySubmit(comment.id)}
                  >
                    {t('discussions.reply')}
                  </Button>
                </div>
              </div>
            )}

            {/* Child replies */}
            {replies.length > 0 && (
              <div className="mt-3 pl-4 border-l border-slate-200 dark:border-slate-800 space-y-3">
                {replies.map((reply) => renderComment(reply))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Sorting */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
          Discussions ({comments.length})
        </h4>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setSortBy('new')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              sortBy === 'new'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            {t('discussions.sort_new')}
          </button>
          <button
            type="button"
            onClick={() => setSortBy('top')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              sortBy === 'top'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            {t('discussions.sort_top')}
          </button>
        </div>
      </div>

      {/* Root Composer */}
      {onPostComment && (
        <form onSubmit={handleRootSubmit} className="space-y-3">
          <textarea
            rows={3}
            placeholder={t('discussions.composer_placeholder')}
            value={rootText}
            onChange={(e) => setRootText(e.target.value)}
            className="w-full text-sm p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!rootText.trim()}
              icon="send"
              iconSlot={iconSlot}
            >
              {t('discussions.post_btn')}
            </Button>
          </div>
        </form>
      )}

      {/* Comment List */}
      <div className="space-y-4">
        {rootComments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No comments yet. Start the conversation!
          </div>
        ) : (
          rootComments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}

export default CommentThread;
