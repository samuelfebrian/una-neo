/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Pathway,
  PathNode,
  PathwayHistoryEvent,
  PathwayPaginationResponse,
  PathTrack,
  NodeCategory,
  Colleague,
} from './types';
import {
  INITIAL_PATHWAY,
  ALL_PATH_NODES,
  INITIAL_HISTORY,
  INITIAL_TRACKS,
  COLLEAGUES_DATA,
} from './seedData';

const STORAGE_KEYS = {
  PATHWAYS: 'mini_app_pathway_data_v2',
  NODES: 'mini_app_nodes_data_v2',
  HISTORY: 'mini_app_history_data_v2',
  TRACKS: 'mini_app_tracks_data_v2',
};

// Internal in-memory and persistent cache
class PathwayDatabaseService {
  private pathway: Pathway;
  private nodes: PathNode[];
  private history: PathwayHistoryEvent[];
  private tracks: PathTrack[];

  constructor() {
    this.pathway = this.loadFromStorage(STORAGE_KEYS.PATHWAYS, INITIAL_PATHWAY);
    this.nodes = this.loadFromStorage(STORAGE_KEYS.NODES, ALL_PATH_NODES);
    this.history = this.loadFromStorage(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    this.tracks = this.loadFromStorage(STORAGE_KEYS.TRACKS, INITIAL_TRACKS);
    this.hydrateColleagues();
  }

  private hydrateColleagues(): void {
    // Ensure colleagues have categoryPath and valid avatars
    this.nodes.forEach((node) => {
      node.colleaguesHere = (node.colleaguesHere || []).map((col) => {
        if (!col.categoryPath) {
          col.categoryPath = node.category;
        }
        if (!col.trackId) {
          col.trackId = node.trackId;
        }
        return col;
      });
    });
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback silently
    }
    return fallback;
  }

  private saveToStorage(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  private persistAll(): void {
    this.saveToStorage(STORAGE_KEYS.PATHWAYS, this.pathway);
    this.saveToStorage(STORAGE_KEYS.NODES, this.nodes);
    this.saveToStorage(STORAGE_KEYS.HISTORY, this.history);
    this.saveToStorage(STORAGE_KEYS.TRACKS, this.tracks);
  }

  public resetToDefaults(): void {
    this.pathway = JSON.parse(JSON.stringify(INITIAL_PATHWAY));
    this.nodes = JSON.parse(JSON.stringify(ALL_PATH_NODES));
    this.history = JSON.parse(JSON.stringify(INITIAL_HISTORY));
    this.tracks = JSON.parse(JSON.stringify(INITIAL_TRACKS));
    this.persistAll();
  }

  // API 1: Fetch Pathway Metadata
  public async getPathway(pathwayId: string = INITIAL_PATHWAY.id): Promise<Pathway> {
    await this.simulateLatency(80);
    return JSON.parse(JSON.stringify(this.pathway));
  }

  // API 2: Fetch Tracks
  public async getTracks(): Promise<PathTrack[]> {
    await this.simulateLatency(60);
    return JSON.parse(JSON.stringify(this.tracks));
  }

  // API 3: Load on Demand Segments (Default limit: 7 main path segments, supports infinite scrolling)
  public async getPathwaySegments(params: {
    pathwayId?: string;
    offsetSegment?: number; // Segment start index (e.g. 0, then 7)
    limitSegments?: number; // Up to 7 segments per request
    trackId?: string;
    category?: string;
    query?: string;
  }): Promise<PathwayPaginationResponse> {
    await this.simulateLatency(120);

    const {
      offsetSegment = 0,
      limitSegments = 7,
      trackId = 'all',
      category = 'all',
      query = '',
    } = params;

    const maxSegmentInDb = Math.max(...this.nodes.map((n) => n.segmentIndex), 0) + 1;
    const requestedEndSegment = offsetSegment + limitSegments;

    // Filter by segment range first (Load on Demand core engine)
    let filteredNodes = this.nodes.filter(
      (node) => node.segmentIndex >= offsetSegment && node.segmentIndex < requestedEndSegment
    );

    // Apply track filter if selected
    if (trackId !== 'all') {
      filteredNodes = filteredNodes.filter((node) => node.trackId === trackId);
    }

    // Apply category filter if selected
    if (category !== 'all') {
      filteredNodes = filteredNodes.filter((node) => node.category.toLowerCase() === category.toLowerCase());
    }

    // Apply search query filter if provided
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filteredNodes = filteredNodes.filter(
        (node) =>
          node.title.toLowerCase().includes(q) ||
          node.category.toLowerCase().includes(q) ||
          node.skillsGained.some((skill) => skill.toLowerCase().includes(q)) ||
          node.trackName.toLowerCase().includes(q)
      );
    }

    // COMMUNITY FILTER: Friends only shown if they are on the same category path!
    filteredNodes = filteredNodes.map((n) => {
      const cloned = { ...n };
      const nodeCat = cloned.category.toLowerCase();
      cloned.colleaguesHere = (cloned.colleaguesHere || []).filter((col) => {
        // Friend is shown if their progression category matches this node's category
        const colCat = (col.categoryPath || cloned.category).toLowerCase();
        return colCat === nodeCat;
      });
      return cloned;
    });

    const hasMore = requestedEndSegment < maxSegmentInDb;

    return {
      pathway: JSON.parse(JSON.stringify(this.pathway)),
      nodes: JSON.parse(JSON.stringify(filteredNodes)),
      totalSegments: maxSegmentInDb,
      loadedSegments: Math.min(requestedEndSegment, maxSegmentInDb),
      hasMore,
      nextOffset: requestedEndSegment,
    };
  }

  // API 3b: Send Kudo / Community Cheer to a colleague on the highway
  public async sendKudos(colleagueId: string, nodeId: string): Promise<{ success: boolean; newKudos: number }> {
    await this.simulateLatency(60);
    let updatedCount = 1;
    this.nodes.forEach((n) => {
      n.colleaguesHere.forEach((c) => {
        if (c.id === colleagueId) {
          c.kudosReceived = (c.kudosReceived || 0) + 1;
          updatedCount = c.kudosReceived;
        }
      });
    });

    // Add community cheer event to history
    this.history.unshift({
      id: `hist-kudo-${Date.now()}`,
      pathwayId: this.pathway.id,
      nodeId,
      nodeTitle: 'Community Learning Kudo',
      action: 'updated',
      timestamp: new Date().toISOString(),
      notes: `Sent learning high-five to peer on this milestone! (+5 Community Karma)`,
      xpEarned: 5,
    });
    this.pathway.currentUser.totalXp += 5;

    this.persistAll();
    return { success: true, newKudos: updatedCount };
  }

  // API 3b.1: Get All Peers & Colleagues in the network
  public async getColleagues(): Promise<Colleague[]> {
    await this.simulateLatency(30);
    const map = new Map<string, Colleague>();
    COLLEAGUES_DATA.forEach((c) => {
      if (c.id !== 'user_self') {
        map.set(c.id, { ...c });
      }
    });

    // Check where they are currently placed in the pathway
    this.nodes.forEach((n) => {
      n.colleaguesHere.forEach((c) => {
        if (c.id !== 'user_self') {
          const existing = map.get(c.id) || { ...c };
          map.set(c.id, {
            ...existing,
            currentNodeId: n.id,
            trackId: n.trackId,
            categoryPath: c.categoryPath || n.category,
          });
        }
      });
    });

    return Array.from(map.values());
  }

  // API 3b.2: Assign Colleague to Specific Track & Milestone
  public async assignColleagueToTrack(
    colleagueId: string,
    trackId: string,
    targetNodeId?: string
  ): Promise<{ success: boolean; colleague: Colleague; assignedNode: PathNode }> {
    await this.simulateLatency(60);
    const baseColleague =
      COLLEAGUES_DATA.find((c) => c.id === colleagueId) ||
      this.nodes.flatMap((n) => n.colleaguesHere).find((c) => c.id === colleagueId);
    if (!baseColleague) throw new Error('Colleague not found');

    // Remove colleague from previous nodes
    this.nodes.forEach((n) => {
      n.colleaguesHere = n.colleaguesHere.filter((c) => c.id !== colleagueId);
    });

    // Find target node on requested track
    const targetNode = targetNodeId
      ? this.nodes.find((n) => n.id === targetNodeId)
      : this.nodes.find((n) => n.trackId === trackId) || this.nodes[0];

    if (!targetNode) throw new Error('Target node not found');

    const updatedColleague: Colleague = {
      ...baseColleague,
      currentNodeId: targetNode.id,
      trackId,
      categoryPath: targetNode.category,
    };

    targetNode.colleaguesHere.push(updatedColleague);

    this.history.unshift({
      id: `hist-assign-${Date.now()}`,
      pathwayId: this.pathway.id,
      nodeId: targetNode.id,
      nodeTitle: `Peer Shift: ${baseColleague.name}`,
      action: 'updated',
      timestamp: new Date().toISOString(),
      notes: `Reassigned ${baseColleague.name} to "${targetNode.title}" on the ${targetNode.trackName}.`,
      xpEarned: 10,
    });

    this.persistAll();
    return { success: true, colleague: updatedColleague, assignedNode: targetNode };
  }

  // API 3b.3: Pair as Study Buddy (Instant Co-Op on User's Track)
  public async pairStudyBuddy(colleagueId: string): Promise<{
    success: boolean;
    colleague: Colleague;
    userNode: PathNode;
    pairedNode: PathNode;
  }> {
    await this.simulateLatency(60);
    const userNode =
      this.nodes.find((n) => n.id === this.pathway.currentUser.currentNodeId) || this.nodes[0];
    if (!userNode) throw new Error('User node not found');

    const baseColleague =
      COLLEAGUES_DATA.find((c) => c.id === colleagueId) ||
      this.nodes.flatMap((n) => n.colleaguesHere).find((c) => c.id === colleagueId);
    if (!baseColleague) throw new Error('Colleague not found');

    // Remove from previous locations
    this.nodes.forEach((n) => {
      n.colleaguesHere = n.colleaguesHere.filter((c) => c.id !== colleagueId);
    });

    // Place colleague on adjacent node on the same track with matching category
    let targetNode = this.nodes.find(
      (n) =>
        n.trackId === userNode.trackId &&
        n.id !== userNode.id &&
        n.category.toLowerCase() === userNode.category.toLowerCase()
    );

    if (!targetNode) {
      targetNode = this.nodes.find(
        (n) => n.trackId === userNode.trackId && n.id !== userNode.id
      );
    }
    if (!targetNode) {
      targetNode = userNode;
    }

    const updatedColleague: Colleague = {
      ...baseColleague,
      currentNodeId: targetNode.id,
      trackId: targetNode.trackId,
      categoryPath: userNode.category,
    };

    targetNode.colleaguesHere.push(updatedColleague);

    this.history.unshift({
      id: `hist-squad-${Date.now()}`,
      pathwayId: this.pathway.id,
      nodeId: targetNode.id,
      nodeTitle: `Study Squad: Paired with ${baseColleague.name}`,
      action: 'updated',
      timestamp: new Date().toISOString(),
      notes: `✨ Study Squad online! Paired with ${baseColleague.name} on ${targetNode.trackName}. Connection Beam active (+15% XP Synergy)!`,
      xpEarned: 50,
    });
    this.pathway.currentUser.totalXp += 50;

    this.persistAll();
    return {
      success: true,
      colleague: updatedColleague,
      userNode,
      pairedNode: targetNode,
    };
  }

  // API 3c: 1-Click Peer Artifact Reactions
  public async reactToArtifact(
    nodeId: string,
    reactionId: string
  ): Promise<{ reactions: NonNullable<PathNode['artifactReactions']> }> {
    await this.simulateLatency(50);
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error('Node not found');

    const defaultReactions = [
      { id: 'r_clean', emoji: '🚀', label: 'Clean Architecture', count: 12 },
      { id: 'r_visual', emoji: '✨', label: 'Great Visual Hierarchy', count: 9 },
      { id: 'r_sec', emoji: '🛡️', label: 'Rock-solid Security', count: 15 },
      { id: 'r_prod', emoji: '⚡', label: 'Production Ready', count: 11 },
    ];

    if (!node.artifactReactions || node.artifactReactions.length === 0) {
      node.artifactReactions = defaultReactions;
    }

    node.artifactReactions = node.artifactReactions.map((r) => {
      if (r.id === reactionId) {
        const isReacted = !r.userReacted;
        return {
          ...r,
          count: isReacted ? r.count + 1 : Math.max(r.count - 1, 0),
          userReacted: isReacted,
        };
      }
      return r;
    });

    this.pathway.currentUser.totalXp += 2;
    this.persistAll();
    return { reactions: JSON.parse(JSON.stringify(node.artifactReactions)) };
  }

  // API 3d: Trigger Collaborative Gate Unlock Check ("Raid Boss" Unlocks)
  public async checkCommunityGates(): Promise<{
    unlockedGates: { nodeId: string; gate: NonNullable<PathNode['communityGate']> }[];
  }> {
    const unlockedGates: { nodeId: string; gate: NonNullable<PathNode['communityGate']> }[] = [];

    this.nodes.forEach((n) => {
      if (n.communityGate && !n.communityGate.isUnlocked) {
        if (n.communityGate.currentCompletedCount >= n.communityGate.requiredCompletedCount) {
          n.communityGate.isUnlocked = true;
          n.status = 'unlocked';
          unlockedGates.push({ nodeId: n.id, gate: n.communityGate });

          // Add to currentUser community badges
          if (!this.pathway.currentUser.communityBadges.includes(n.communityGate.rewardBadge)) {
            this.pathway.currentUser.communityBadges.push(n.communityGate.rewardBadge);
          }

          this.history.unshift({
            id: `hist-gate-${Date.now()}-${n.id}`,
            pathwayId: this.pathway.id,
            nodeId: n.id,
            nodeTitle: n.title,
            action: 'unlocked',
            timestamp: new Date().toISOString(),
            notes: `🎉 Community Gate Unlocked! 3/3 squad peers cleared the prerequisite milestone. Reward: "${n.communityGate.rewardBadge}"!`,
            xpEarned: 500,
          });
        }
      }
    });

    if (unlockedGates.length > 0) {
      this.persistAll();
    }

    return { unlockedGates };
  }

  // API 3e: Rally Squad to contribute to Community Gate unlock ("Raid Boss")
  public async rallySquadForGate(nodeId: string): Promise<{
    node: PathNode;
    isNowUnlocked: boolean;
    rewardBadge: string;
    xpAwarded: number;
  }> {
    await this.simulateLatency(120);
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node || !node.communityGate) throw new Error('Gate node not found');

    // Simulate squad member joining and completing the prerequisite
    node.communityGate.currentCompletedCount = Math.min(
      node.communityGate.currentCompletedCount + 1,
      node.communityGate.requiredCompletedCount
    );

    const isNowUnlocked =
      node.communityGate.currentCompletedCount >= node.communityGate.requiredCompletedCount;

    let xpAwarded = 0;
    if (isNowUnlocked && !node.communityGate.isUnlocked) {
      node.communityGate.isUnlocked = true;
      node.status = 'unlocked';
      xpAwarded = 500;
      this.pathway.currentUser.totalXp += 500;

      if (!this.pathway.currentUser.communityBadges.includes(node.communityGate.rewardBadge)) {
        this.pathway.currentUser.communityBadges.push(node.communityGate.rewardBadge);
      }

      this.history.unshift({
        id: `hist-raid-${Date.now()}`,
        pathwayId: this.pathway.id,
        nodeId: node.id,
        nodeTitle: node.title,
        action: 'unlocked',
        timestamp: new Date().toISOString(),
        notes: `🎉 SQUAD MILESTONE CLEARED! The 3-person squad completed the prerequisite gate. Reward: "${node.communityGate.rewardBadge}" badge (+500 XP)!`,
        xpEarned: 500,
      });
    }

    this.persistAll();
    return {
      node: JSON.parse(JSON.stringify(node)),
      isNowUnlocked,
      rewardBadge: node.communityGate.rewardBadge,
      xpAwarded,
    };
  }

  // API 4: Load on Demand Path Histories based on date/time
  public async getHistory(params: {
    pathwayId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<PathwayHistoryEvent[]> {
    await this.simulateLatency(90);

    let items = [...this.history];

    if (params.startDate) {
      const start = new Date(params.startDate).getTime();
      items = items.filter((h) => new Date(h.timestamp).getTime() >= start);
    }

    if (params.endDate) {
      const end = new Date(params.endDate).getTime();
      items = items.filter((h) => new Date(h.timestamp).getTime() <= end);
    }

    // Sort descending by timestamp
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (params.limit) {
      items = items.slice(0, params.limit);
    }

    return JSON.parse(JSON.stringify(items));
  }

  // API 5: Complete Node & Auto-Unlock Dependent Paths (Prerequisite Engine)
  public async completeNode(
    nodeId: string,
    details?: { notes?: string; completionDate?: string }
  ): Promise<{
    completedNode: PathNode;
    unlockedNodes: PathNode[];
    historyEvent: PathwayHistoryEvent;
    userXp: number;
  }> {
    await this.simulateLatency(150);

    const targetNodeIndex = this.nodes.findIndex((n) => n.id === nodeId);
    if (targetNodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    const targetNode = this.nodes[targetNodeIndex];
    if (!targetNode) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    const timestamp = details?.completionDate || new Date().toISOString();

    // Mark as completed
    targetNode.status = 'completed';
    targetNode.completedAt = timestamp;

    // Check for "Study Squad" Synergy: If any peer is on the same track with matching category, apply +15% XP multiplier!
    const hasSynergyPeer = this.nodes.some(
      (n) =>
        n.trackId === targetNode.trackId &&
        n.colleaguesHere.some(
          (c) => c.id !== 'user_self' && c.categoryPath?.toLowerCase() === targetNode.category.toLowerCase()
        )
    );
    const xpBonus = hasSynergyPeer ? Math.round(targetNode.xpPoints * 0.15) : 0;
    const totalAwardedXp = targetNode.xpPoints + xpBonus;

    // Update current user position and XP
    this.pathway.currentUser.totalXp += totalAwardedXp;
    this.pathway.currentUser.completedCount += 1;
    this.pathway.currentUser.currentNodeId = targetNode.id;
    this.pathway.lastUpdated = timestamp;

    // Log history
    const historyEvent: PathwayHistoryEvent = {
      id: `hist-${Date.now()}`,
      pathwayId: this.pathway.id,
      nodeId: targetNode.id,
      nodeTitle: targetNode.title,
      action: 'completed',
      timestamp,
      notes:
        details?.notes ||
        `Successfully mastered ${targetNode.title} (+${totalAwardedXp} XP${
          hasSynergyPeer ? ' including +15% Study Squad Synergy Boost!' : ''
        })`,
      xpEarned: totalAwardedXp,
    };
    this.history.unshift(historyEvent);

    // AUTO-UNLOCK ENGINE: Find all nodes that require this completed node and verify all their prerequisites
    const unlockedNodes: PathNode[] = [];
    const completedNodeIds = new Set(
      this.nodes.filter((n) => n.status === 'completed').map((n) => n.id)
    );

    this.nodes.forEach((candidate) => {
      if (candidate.status === 'locked' && candidate.prerequisites.length > 0) {
        const allPrereqsMet = candidate.prerequisites.every((reqId) => completedNodeIds.has(reqId));
        if (allPrereqsMet) {
          candidate.status = 'unlocked';
          unlockedNodes.push(candidate);

          // Add unlock event to history
          this.history.unshift({
            id: `hist-unlock-${Date.now()}-${candidate.id}`,
            pathwayId: this.pathway.id,
            nodeId: candidate.id,
            nodeTitle: candidate.title,
            action: 'unlocked',
            timestamp: new Date().toISOString(),
            notes: `Auto-unlocked after meeting prerequisites (${candidate.prerequisites.join(', ')})`,
            xpEarned: 0,
          });
        }
      }
    });

    this.persistAll();

    return {
      completedNode: JSON.parse(JSON.stringify(targetNode)),
      unlockedNodes: JSON.parse(JSON.stringify(unlockedNodes)),
      historyEvent,
      userXp: this.pathway.currentUser.totalXp,
    };
  }

  // API 6: Add or Create New Pathway Node / Milestone
  public async addNode(nodeData: Omit<PathNode, 'id' | 'status'> & { status?: PathNode['status'] }): Promise<PathNode> {
    await this.simulateLatency(120);

    const newId = `node-custom-${Date.now()}`;
    const status = nodeData.status || (nodeData.prerequisites.length === 0 ? 'unlocked' : 'locked');

    const newNode: PathNode = {
      ...nodeData,
      id: newId,
      status,
      colleaguesHere: nodeData.colleaguesHere || [],
    };

    this.nodes.push(newNode);

    // History event
    this.history.unshift({
      id: `hist-create-${Date.now()}`,
      pathwayId: this.pathway.id,
      nodeId: newId,
      nodeTitle: newNode.title,
      action: 'created',
      timestamp: new Date().toISOString(),
      notes: `New milestone pathway node added in segment ${newNode.segmentIndex + 1}`,
      xpEarned: 0,
    });

    this.persistAll();
    return JSON.parse(JSON.stringify(newNode));
  }

  // API 6b: Update Existing Node
  public async updateNode(nodeId: string, updates: Partial<PathNode>): Promise<PathNode> {
    await this.simulateLatency(100);
    const index = this.nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) throw new Error(`Node ${nodeId} not found`);

    const targetNode = this.nodes[index];
    if (!targetNode) throw new Error(`Node ${nodeId} not found`);

    const updatedNode: PathNode = { ...targetNode, ...updates };
    this.nodes[index] = updatedNode;
    this.history.unshift({
      id: `hist-update-${Date.now()}`,
      pathwayId: this.pathway.id,
      nodeId,
      nodeTitle: updatedNode.title,
      action: 'updated',
      timestamp: new Date().toISOString(),
      notes: `Milestone updated via Admin Pathway Manager`,
      xpEarned: 0,
    });

    this.persistAll();
    return JSON.parse(JSON.stringify(updatedNode));
  }

  // API 6c: Delete Node from Pathway
  public async deleteNode(nodeId: string): Promise<boolean> {
    await this.simulateLatency(100);
    const targetNode = this.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return false;

    // Remove node
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);

    // Clean up prerequisites in remaining nodes
    this.nodes.forEach((n) => {
      n.prerequisites = n.prerequisites.filter((reqId) => reqId !== nodeId);
    });

    // Clean up current user reference if was on this node
    if (this.pathway.currentUser.currentNodeId === nodeId && this.nodes.length > 0) {
      const firstNode = this.nodes[0];
      if (firstNode) {
        this.pathway.currentUser.currentNodeId = firstNode.id;
      }
    }

    this.history.unshift({
      id: `hist-delete-${Date.now()}`,
      pathwayId: this.pathway.id,
      nodeId,
      nodeTitle: targetNode.title,
      action: 'updated',
      timestamp: new Date().toISOString(),
      notes: `Milestone removed from road via Admin Pathway Manager`,
      xpEarned: 0,
    });

    this.persistAll();
    return true;
  }

  // API 7: Add Custom Pathway
  public async createPathway(newPathway: Partial<Pathway>): Promise<Pathway> {
    await this.simulateLatency(140);
    this.pathway = {
      ...this.pathway,
      ...newPathway,
      id: `pathway_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    this.persistAll();
    return JSON.parse(JSON.stringify(this.pathway));
  }

  // API 8: Insert Custom History Event with Date/Time
  public async insertHistoryEvent(
    eventData: Omit<PathwayHistoryEvent, 'id'>
  ): Promise<PathwayHistoryEvent> {
    await this.simulateLatency(100);
    const newEvent: PathwayHistoryEvent = {
      ...eventData,
      id: `hist-manual-${Date.now()}`,
    };
    this.history.unshift(newEvent);
    this.persistAll();
    return JSON.parse(JSON.stringify(newEvent));
  }

  // API 9: Add New Track
  public async addTrack(track: PathTrack): Promise<PathTrack> {
    await this.simulateLatency(100);
    this.tracks.push(track);
    this.persistAll();
    return JSON.parse(JSON.stringify(track));
  }

  // API 10: Move Current User Avatar to a specific node
  public async moveUserAvatar(nodeId: string): Promise<Pathway> {
    const targetNode = this.nodes.find((n) => n.id === nodeId);
    if (!targetNode) throw new Error('Target node not found');

    this.pathway.currentUser.currentNodeId = nodeId;
    // ensure user is present in targetNode.colleaguesHere
    this.nodes.forEach((n) => {
      n.colleaguesHere = n.colleaguesHere.filter((c) => c.id !== 'user_self');
    });
    targetNode.colleaguesHere.push({
      id: 'user_self',
      name: this.pathway.currentUser.name,
      avatar: this.pathway.currentUser.avatar,
      role: 'Current User',
      currentNodeId: nodeId,
    });

    this.persistAll();
    return JSON.parse(JSON.stringify(this.pathway));
  }

  // API 11: Get Analytics & Career Growth
  public async getAnalytics(): Promise<{
    totalNodes: number;
    completedNodes: number;
    completionRate: number;
    totalXp: number;
    totalHoursInvested: number;
    skillsMastered: { skill: string; count: number; track: string }[];
    categoryDistribution: { category: NodeCategory; completed: number; total: number }[];
    trackProgress: {
      trackId: string;
      trackName: string;
      completed: number;
      total: number;
      percentage: number;
    }[];
  }> {
    await this.simulateLatency(80);

    const total = this.nodes.length;
    const completed = this.nodes.filter((n) => n.status === 'completed');
    const totalHours = completed.reduce((acc, curr) => acc + curr.durationHours, 0);

    // Track progression
    const trackProgress = this.tracks.map((track) => {
      const trackNodes = this.nodes.filter((n) => n.trackId === track.id);
      const trackCompleted = trackNodes.filter((n) => n.status === 'completed');
      return {
        trackId: track.id,
        trackName: track.name,
        completed: trackCompleted.length,
        total: trackNodes.length,
        percentage: trackNodes.length > 0 ? Math.round((trackCompleted.length / trackNodes.length) * 100) : 0,
      };
    });

    // Categories
    const categories: NodeCategory[] = ['Course', 'Mastery', 'Career'];
    const categoryDistribution = categories.map((cat) => {
      const catNodes = this.nodes.filter((n) => n.category === cat);
      const catCompleted = catNodes.filter((n) => n.status === 'completed');
      return {
        category: cat,
        completed: catCompleted.length,
        total: catNodes.length,
      };
    });

    // Skills
    const skillMap = new Map<string, { count: number; track: string }>();
    completed.forEach((node) => {
      node.skillsGained.forEach((skill) => {
        const existing = skillMap.get(skill) || { count: 0, track: node.trackName };
        skillMap.set(skill, { count: existing.count + 1, track: node.trackName });
      });
    });

    const skillsMastered = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      count: data.count,
      track: data.track,
    }));

    return {
      totalNodes: total,
      completedNodes: completed.length,
      completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      totalXp: this.pathway.currentUser.totalXp,
      totalHoursInvested: totalHours,
      skillsMastered,
      categoryDistribution,
      trackProgress,
    };
  }

  private simulateLatency(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const pathwayApi = new PathwayDatabaseService();
