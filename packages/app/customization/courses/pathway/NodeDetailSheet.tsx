/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Briefcase,
  Users,
  FolderGit2,
  AlertCircle,
  MapPin,
  Check,
} from './lucideIcons';
import { PathNode } from './types';
import { pathwayApi } from './pathwayApi';

interface NodeDetailSheetProps {
  node: PathNode | null;
  allNodes: PathNode[];
  onClose: () => void;
  onCompleteNode: (nodeId: string, notes?: string) => Promise<void>;
  onMoveAvatar: (nodeId: string) => Promise<void>;
  isCurrentUserHere: boolean;
  /** Real lesson navigation (cards mapped to UNA lessons carry externalUrl). */
  onOpenNode?: (url?: string) => void;
}

export const NodeDetailSheet: React.FC<NodeDetailSheetProps> = ({
  node,
  allNodes,
  onClose,
  onCompleteNode,
  onMoveAvatar,
  isCurrentUserHere,
  onOpenNode,
}) => {
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  if (!node) return null;

  // Real lesson cards point at the UNA lesson page; passing happens there.
  const isLesson = Boolean(node.externalUrl);

  // Resolve prerequisite titles & statuses
  const prerequisiteDetails = node.prerequisites.map((reqId) => {
    const found = allNodes.find((n) => n.id === reqId);
    return {
      id: reqId,
      title: found?.title || reqId,
      status: found?.status || 'unknown',
      isCompleted: found?.status === 'completed',
    };
  });

  const allPrereqsMet = prerequisiteDetails.every((p) => p.isCompleted);

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      await onCompleteNode(node.id, completionNotes || undefined);
      setSuccessBanner(`Milestone Completed! +${node.xpPoints} XP awarded.`);
      setTimeout(() => {
        setSuccessBanner(null);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveAvatar = async () => {
    try {
      setIsSubmitting(true);
      await onMoveAvatar(node.id);
      setSuccessBanner('Avatar moved to this milestone.');
      setTimeout(() => {
        setSuccessBanner(null);
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Course':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'Mastery':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'Career':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      {/* Drawer Container */}
      <div className="relative w-full max-w-xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              {getCategoryIcon(node.category)}
              <span>{node.category}</span>
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-400">{node.trackName}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successBanner && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-medium text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Title & Status Strip */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {node.status === 'completed' && (
                <span className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </span>
              )}
              {node.status === 'in_progress' && (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>In Progress</span>
                </span>
              )}
              {node.status === 'unlocked' && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <Unlock className="w-4 h-4" />
                  <span>Ready to Begin</span>
                </span>
              )}
              {node.status === 'locked' && (
                <span className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <span>Locked (Prerequisite Required)</span>
                </span>
              )}

              {isCurrentUserHere && (
                <span className="ml-auto text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Current User Active Node
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{node.title}</h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {node.description}
            </p>
          </div>

          {/* Stats Bar — real data only (pass progress for lesson cards) */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center">
            <div>
              <span className="block text-[11px] text-zinc-500 uppercase tracking-wider">
                {isLesson ? 'Progress' : 'XP Reward'}
              </span>
              <span className="text-sm font-mono font-bold text-blue-400">
                {isLesson ? `${node.progressPercent ?? 0}%` : `+${node.xpPoints} XP`}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-zinc-500 uppercase tracking-wider">
                {isLesson ? 'Lesson' : 'Estimated Time'}
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {isLesson ? `#${node.segmentIndex + 1}` : `${node.durationHours} Hours`}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-zinc-500 uppercase tracking-wider">
                Mastery Level
              </span>
              <span className="text-sm font-mono font-bold text-purple-400">
                {node.level}
              </span>
            </div>
          </div>

          {/* Prerequisite Condition Verification Engine */}
          <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Prerequisites & Requirements</span>
              </span>
              <span
                className={`text-[11px] font-medium ${
                  allPrereqsMet ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {allPrereqsMet ? 'All Requirements Met ✓' : 'Condition Unfulfilled'}
              </span>
            </div>

            {prerequisiteDetails.length === 0 ? (
              <p className="text-xs text-zinc-400">
                No prior milestones required. This node is an open foundational entry point.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {prerequisiteDetails.map((prereq) => (
                  <div
                    key={prereq.id}
                    className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {prereq.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className={prereq.isCompleted ? 'text-zinc-200' : 'text-zinc-400'}>
                        {prereq.title}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono ${
                        prereq.isCompleted ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {prereq.isCompleted ? 'Completed' : 'Required'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills / real theme grouping */}
          {node.skillsGained.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                {isLesson ? 'Theme' : 'Skills & Competencies Acquired'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {node.skillsGained.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-zinc-800/90 text-blue-300 border border-blue-500/20 text-xs rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Artifact / Deliverable with 1-Click Peer Reactions */}
          {node.portfolioArtifact && (
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-start gap-3">
                <FolderGit2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-semibold text-white">
                      Portfolio Artifact Output
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono">
                      Peer Review Showcase
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    {node.portfolioArtifact}
                  </p>
                </div>
              </div>

              {/* 1-Click Peer Reactions (Clean architecture, Visual hierarchy, Security, Production ready) */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Community Peer Endorsements
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">
                    +2 Karma per reaction
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    node.artifactReactions || [
                      { id: 'r_clean', emoji: '🚀', label: 'Clean Architecture', count: 12 },
                      { id: 'r_visual', emoji: '✨', label: 'Great Visual Hierarchy', count: 9 },
                      { id: 'r_sec', emoji: '🛡️', label: 'Rock-solid Security', count: 15 },
                      { id: 'r_prod', emoji: '⚡', label: 'Production Ready', count: 11 },
                    ]
                  ).map((reaction) => (
                    <button
                      key={reaction.id}
                      type="button"
                      onClick={async () => {
                        const res = await pathwayApi.reactToArtifact(node.id, reaction.id);
                        node.artifactReactions = res.reactions;
                        setSuccessBanner(`Endorsed: "${reaction.label}"! +2 Community Karma`);
                        setTimeout(() => setSuccessBanner(null), 2500);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                        reaction.userReacted
                          ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-sm shadow-blue-500/20'
                          : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                      title={`Endorse this artifact with ${reaction.label}`}
                    >
                      <span className="text-sm">{reaction.emoji}</span>
                      <span>{reaction.label}</span>
                      <span className="text-[11px] font-mono font-bold ml-0.5 text-blue-400">
                        {reaction.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collaborative Milestone Gate ("Raid Boss") Banner if present */}
          {node.communityGate && (
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              node.communityGate.isUnlocked
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{node.communityGate.isUnlocked ? '🎉' : '🔒'}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {node.communityGate.isUnlocked ? 'Community Gate Cleared!' : 'Collaborative Milestone Gate'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-blue-300">
                  {node.communityGate.currentCompletedCount}/{node.communityGate.requiredCompletedCount} Squad Members
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                {node.communityGate.description}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-amber-300 font-medium">
                  Reward: <span className="font-bold underline">{node.communityGate.rewardBadge}</span> (+500 XP)
                </span>
                {!node.communityGate.isUnlocked && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await pathwayApi.rallySquadForGate(node.id);
                      node.communityGate = res.node.communityGate;
                      setSuccessBanner(`Squad member joined! Progress: ${res.node.communityGate?.currentCompletedCount}/${res.node.communityGate?.requiredCompletedCount}`);
                      setTimeout(() => setSuccessBanner(null), 3000);
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow cursor-pointer active:scale-95"
                  >
                    Rally Squad (+1)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Peer & Colleague Activity on this Milestone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Colleagues on this Milestone ({node.colleaguesHere.length})</span>
              </h4>
            </div>

            {node.colleaguesHere.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">
                Be the first in your network to master this milestone!
              </p>
            ) : (
              <div className="space-y-2">
                {node.colleaguesHere.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={col.avatar}
                        alt={col.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-white">
                          {col.name}
                        </span>
                        <span className="block text-[11px] text-zinc-400">{col.role}</span>
                      </div>
                    </div>
                    {col.completedAt ? (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Mastered
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono">
                        Active Now
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isCurrentUserHere && (
              <button
                onClick={handleMoveAvatar}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Move your avatar to indicate you are currently working on this node"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Move Avatar Here</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {node.status === 'completed' ? (
              <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{node.completedAt ? `Completed (${new Date(node.completedAt).toLocaleDateString()})` : 'Completed'}</span>
              </div>
            ) : node.status === 'locked' && !allPrereqsMet ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-500 bg-zinc-800/60 border border-zinc-800 rounded-lg cursor-not-allowed opacity-80"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Locked by Prerequisites</span>
              </button>
            ) : isLesson ? (
              <button
                onClick={() => onOpenNode?.(node.externalUrl)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-blue-400 hover:bg-blue-300 rounded-lg shadow-lg shadow-blue-400/20 transition-all active:scale-95"
                title="Open this lesson in the course player"
              >
                <BookOpen className="w-4 h-4" />
                <span>{node.status === 'in_progress' ? 'Continue Lesson' : 'Open Lesson'}</span>
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-blue-400 hover:bg-blue-300 rounded-lg shadow-lg shadow-blue-400/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Verifying via API...' : `Mark Completed (+${node.xpPoints} XP)`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
