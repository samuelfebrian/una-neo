/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IsometricRoadmapView } from './IsometricRoadmapView';
import { NodeDetailSheet } from './NodeDetailSheet';
import { pathwayApi } from './pathwayApi';
import type { Pathway, PathNode, PathTrack } from './types';

export function PathwayCanvas() {
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [tracks, setTracks] = useState<PathTrack[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [allExistingNodes, setAllExistingNodes] = useState<PathNode[]>([]);

  const [loadedSegments, setLoadedSegments] = useState(7);
  const [totalSegments, setTotalSegments] = useState(9);
  const [hasMoreSegments, setHasMoreSegments] = useState(true);
  const [nextOffset, setNextOffset] = useState(7);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSegments = useCallback(async (isAppending = false, offset = 0) => {
    setIsLoadingSegments(true);
    try {
      const response = await pathwayApi.getPathwaySegments({
        offsetSegment: offset,
        limitSegments: 7,
      });

      setPathway(response.pathway);
      setTotalSegments(response.totalSegments);
      setLoadedSegments(response.loadedSegments);
      setHasMoreSegments(response.hasMore);
      setNextOffset(response.nextOffset);

      if (isAppending) {
        setNodes((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newUnique = response.nodes.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newUnique];
        });
      } else {
        setNodes(response.nodes);
      }

      const fullDump = await pathwayApi.getPathwaySegments({
        offsetSegment: 0,
        limitSegments: 50,
      });
      setAllExistingNodes(fullDump.nodes);
    } finally {
      setIsLoadingSegments(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      const [pw, trks] = await Promise.all([
        pathwayApi.getPathway(),
        pathwayApi.getTracks(),
      ]);
      if (cancelled) return;
      setPathway(pw);
      setTracks(trks);
      fetchSegments(false, 0);
    };
    initialize();
    return () => {
      cancelled = true;
    };
  }, [fetchSegments]);

  const handleLoadMoreSegments = async () => {
    if (!hasMoreSegments || isLoadingSegments) return;
    await fetchSegments(true, nextOffset);
    showToast(`Loaded Segments ${nextOffset + 1}-${Math.min(nextOffset + 7, totalSegments)} on demand via API`);
  };

  const handleCompleteNode = async (nodeId: string, notes?: string) => {
    const result = await pathwayApi.completeNode(nodeId, { notes });

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) return result.completedNode;
        const unlockedMatch = result.unlockedNodes.find((u) => u.id === n.id);
        if (unlockedMatch) return unlockedMatch;
        return n;
      })
    );

    if (selectedNode?.id === nodeId) {
      setSelectedNode(result.completedNode);
    }

    const updatedPathway = await pathwayApi.getPathway();
    setPathway(updatedPathway);

    if (result.unlockedNodes.length > 0) {
      showToast(
        `Milestone completed! Auto-unlocked ${result.unlockedNodes.length} dependent ${
          result.unlockedNodes.length === 1 ? 'path' : 'paths'
        }!`
      );
    } else {
      showToast(`Milestone completed! +${result.completedNode.xpPoints} XP earned.`);
    }
  };

  const handleMoveAvatar = async (nodeId: string) => {
    const updated = await pathwayApi.moveUserAvatar(nodeId);
    setPathway(updated);
    await fetchSegments(false, 0);
    showToast('Your avatar is now positioned on this milestone.');
  };

  const currentUserNodeId = pathway?.currentUser.currentNodeId || 'node-da-3';

  return (
    <div className="pathway-canvas relative w-full h-full min-h-[720px]">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-zinc-900/95 border border-blue-500/40 text-blue-300 text-xs font-semibold rounded-xl shadow-2xl shadow-blue-500/20 backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      <IsometricRoadmapView
        nodes={nodes}
        tracks={tracks}
        currentUserNodeId={currentUserNodeId}
        onSelectNode={(node) => setSelectedNode(node)}
        hasMoreSegments={hasMoreSegments}
        onLoadMoreSegments={handleLoadMoreSegments}
        isLoadingSegments={isLoadingSegments}
        totalSegments={totalSegments}
        loadedSegments={loadedSegments}
        currentUserAvatar={pathway?.currentUser.avatar || ''}
        currentUserName={pathway?.currentUser.name || 'Jordan Taylor'}
        onOpenAdmin={() => {}}
        streakDays={pathway?.currentUser.streakDays || 7}
        fuelPercentage={pathway?.currentUser.fuelPercentage || 100}
        hasNeonHalo={pathway?.currentUser.hasNeonHalo ?? true}
        onGateCelebration={() => {
          fetchSegments(false, 0);
        }}
        roadTrafficFlowEnabled={true}
      />

      <NodeDetailSheet
        node={selectedNode}
        allNodes={allExistingNodes.length > 0 ? allExistingNodes : nodes}
        onClose={() => setSelectedNode(null)}
        onCompleteNode={handleCompleteNode}
        onMoveAvatar={handleMoveAvatar}
        isCurrentUserHere={selectedNode?.id === currentUserNodeId}
      />
    </div>
  );
}
