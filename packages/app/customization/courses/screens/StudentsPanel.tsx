/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StudentsPanel: Course members directory, pending requests, and invitation manager.
 */

import React, { useState } from 'react';
import type { Member, TranslateFn, IconSlotFn } from '../types';
import { Avatar } from '../primitives/Avatar';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { ProgressRing } from '../primitives/ProgressRing';
import { Modal } from '../primitives/Modal';
import { RenderIcon } from '../primitives/IconSlot';
import { defaultT } from '../tokens/i18n';

export interface StudentsPanelProps {
  members: Member[];
  isOwnerOrAdmin?: boolean;
  onSetRole?: (member: Member, role: Member['role']) => void;
  onRemoveMember?: (member: Member) => void;
  onInvite?: (emails: string[]) => void;
  onAcceptPending?: (member: Member) => void;
  onDeclinePending?: (member: Member) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function StudentsPanel({
  members,
  isOwnerOrAdmin = false,
  onSetRole,
  onRemoveMember,
  onInvite,
  onAcceptPending,
  onDeclinePending,
  t = defaultT,
  iconSlot,
  className = ''
}: StudentsPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'student' | 'instructor' | 'moderator' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmailsText, setInviteEmailsText] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const filteredMembers = members.filter((m) => {
    if (activeTab !== 'all' && m.role !== activeTab) return false;
    if (searchQuery.trim()) {
      return m.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const pendingRequests = members.filter((m) => m.role === 'pending');

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = inviteEmailsText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.includes('@'));
    if (emails.length > 0) {
      onInvite?.(emails);
      setInviteEmailsText('');
      setInviteModalOpen(false);
    }
  };

  const getRoleBadgeVariant = (role: Member['role']) => {
    if (role === 'instructor') return 'brand';
    if (role === 'moderator') return 'neutral';
    if (role === 'pending') return 'warning';
    return 'neutral';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top action toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder={t('students.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <div className="absolute left-3 top-2.5 text-slate-400">
            <RenderIcon name="search" className="w-4 h-4" iconSlot={iconSlot} />
          </div>
        </div>

        {isOwnerOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            iconSlot={iconSlot}
            onClick={() => setInviteModalOpen(true)}
          >
            {t('students.invite_btn')}
          </Button>
        )}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: t('students.tab_all'), count: members.length },
          { key: 'student', label: t('students.tab_students'), count: members.filter((m) => m.role === 'student').length },
          { key: 'instructor', label: t('students.tab_instructors'), count: members.filter((m) => m.role === 'instructor').length },
          { key: 'moderator', label: t('students.tab_moderators'), count: members.filter((m) => m.role === 'moderator').length },
          { key: 'pending', label: t('students.tab_pending'), count: pendingRequests.length }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer select-none ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono text-[10px] tabular-nums opacity-75">
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Pending requests highlight if on pending tab or has items */}
      {activeTab === 'pending' && pendingRequests.length === 0 && (
        <div className="text-center py-8 text-xs text-slate-400">
          No pending join requests.
        </div>
      )}

      {/* Members List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {t('students.empty')}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={member.avatarUrl} name={member.name} size="md" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {member.name}
                    </span>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                  {member.joinedTs && (
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                      Joined {new Date(member.joinedTs < 1e11 ? member.joinedTs * 1000 : member.joinedTs).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Student progress ring */}
                {member.role === 'student' && member.progress && (
                  <div className="flex items-center gap-2">
                    <ProgressRing
                      percent={member.progress.percent}
                      size={28}
                      strokeWidth={3}
                      showText={false}
                    />
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {member.progress.percent}%
                    </span>
                  </div>
                )}

                {/* Pending Actions */}
                {member.role === 'pending' && isOwnerOrAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAcceptPending?.(member)}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors cursor-pointer"
                    >
                      {t('students.actions.accept')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeclinePending?.(member)}
                      className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                    >
                      {t('students.actions.decline')}
                    </button>
                  </div>
                )}

                {/* Owner/Admin Role Menu */}
                {isOwnerOrAdmin && member.role !== 'pending' && (
                  <div className="flex items-center gap-1.5">
                    {onSetRole && (
                      <select
                        value={member.role}
                        onChange={(e) => onSetRole(member, e.target.value as Member['role'])}
                        className="text-xs p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                        title={t('students.actions.set_role')}
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    )}

                    {onRemoveMember && (
                      <button
                        type="button"
                        onClick={() => setMemberToRemove(member)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={t('students.actions.remove')}
                      >
                        <RenderIcon name="trash" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={t('students.invite_btn')}
        description="Enter email addresses of members you wish to invite to this course."
        iconSlot={iconSlot}
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Email Addresses (comma or newline separated)
            </label>
            <textarea
              rows={4}
              placeholder="alex@example.com, sarah@company.org"
              value={inviteEmailsText}
              onChange={(e) => setInviteEmailsText(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Invitations
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        title={t('common.confirm')}
        description={`Are you sure you want to remove "${memberToRemove?.name}" from this course?`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMemberToRemove(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (memberToRemove) onRemoveMember?.(memberToRemove);
                setMemberToRemove(null);
              }}
            >
              {t('common.delete')}
            </Button>
          </>
        }
        iconSlot={iconSlot}
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          This member will lose access to course materials, submitted milestones, and discussion participation.
        </p>
      </Modal>
    </div>
  );
}

export default StudentsPanel;
