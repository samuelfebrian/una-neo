/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeCategory = 'Course' | 'Mastery' | 'Career' | string;

export type NodeStatus = 'completed' | 'in_progress' | 'unlocked' | 'locked';

export interface PrerequisiteRequirement {
  nodeId: string;
  nodeTitle?: string;
  minScore?: number;
}

export interface Colleague {
  id: string;
  name: string;
  avatar: string;
  role: string;
  currentNodeId: string;
  categoryPath?: NodeCategory; // Same category path requirement
  trackId?: string;
  completedAt?: string;
  score?: number;
  kudosReceived?: number;
}

export interface PathNode {
  id: string;
  title: string;
  category: NodeCategory; // 'Course' | 'Mastery' | 'Career'
  trackId: string; // e.g., 'data-analytics' | 'ux-ui' | 'cybersecurity'
  trackName: string;
  description: string;
  status: NodeStatus;
  segmentIndex: number; // 0 to N (used for 7-segment pagination)
  durationHours: number;
  skillsGained: string[];
  prerequisites: string[]; // List of required nodeIds that must be 'completed'
  portfolioArtifact?: string; // Project evidence or deliverable
  completedAt?: string;
  startedAt?: string;
  badgeIcon?: string;
  xpPoints: number;
  level: 'Foundational' | 'Intermediate' | 'Advanced' | 'Mastery';
  colleaguesHere: Colleague[];
  externalUrl?: string;
  // Community Mechanics
  communityGate?: {
    requiredCompletedCount: number;
    currentCompletedCount: number;
    isUnlocked: boolean;
    rewardBadge: string;
    description: string;
  };
  artifactReactions?: {
    id: string;
    emoji: string;
    label: string;
    count: number;
    userReacted?: boolean;
  }[];
}

export interface PathTrack {
  id: string;
  name: string;
  description: string;
  currentSkills: string[];
  targetRole: string;
  colorScheme: {
    primary: string;
    glow: string;
    border: string;
    bg: string;
  };
}

export interface PathwayHistoryEvent {
  id: string;
  pathwayId: string;
  nodeId: string;
  nodeTitle: string;
  action: 'completed' | 'unlocked' | 'updated' | 'created';
  timestamp: string; // ISO datetime
  notes?: string;
  xpEarned?: number;
}

export interface Pathway {
  id: string;
  title: string;
  description: string;
  category: NodeCategory;
  primaryTrackId: string;
  totalSegments: number;
  lastUpdated: string;
  createdAt: string;
  tags: string[];
  currentUser: {
    id: string;
    name: string;
    avatar: string;
    currentNodeId: string;
    totalXp: number;
    completedCount: number;
    streakDays: number;
    fuelPercentage: number;
    hasNeonHalo: boolean;
    communityBadges: string[];
  };
}

export interface PathwayPaginationResponse {
  pathway: Pathway;
  nodes: PathNode[];
  totalSegments: number;
  loadedSegments: number;
  hasMore: boolean;
  nextOffset: number;
}

export interface FilterOptions {
  searchQuery: string;
  selectedCategory: string; // 'all' or category name
  selectedTrack: string; // 'all' or trackId
  viewMode: 'horizontal' | 'vertical' | 'analytics';
}
