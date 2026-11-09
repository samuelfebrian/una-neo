/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'app/lib/hooks/router';
import { useCurrentUser } from 'app/context/user';
import { IsometricRoadmapView } from './IsometricRoadmapView';
import { NodeDetailSheet } from './NodeDetailSheet';
import { pathwayApi } from './pathwayApi';
import { buildPathwayFromOutlines, ActiveCourseInfo } from './buildPathway';
import { coursesApi } from '../api';
import { appPath } from '../apps/app-path';
import type { Pathway, PathNode, PathTrack } from './types';

export interface PathwayCanvasProps {
  /** Active courses (in-progress first, max 3) — each renders as one track lane. */
  activeCourses: ActiveCourseInfo[];
}

export function PathwayCanvas({ activeCourses = [] }: PathwayCanvasProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [tracks, setTracks] = useState<PathTrack[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [allExistingNodes, setAllExistingNodes] = useState<PathNode[]>([]);

  const [loadedSegments, setLoadedSegments] = useState(0);
  const [totalSegments, setTotalSegments] = useState(0);
  const [hasMoreSegments, setHasMoreSegments] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
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

  // Rebuild the window keys only when the course set or viewer identity changes,
  // not on every store update.
  const activeKey = activeCourses.map((c) => c.id).join(',');
  const viewerKey = currentUser ? String(currentUser.id) : '';

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      const courses = activeCourses.slice(0, 3);
      if (courses.length === 0) return;

      const viewer = currentUser
        ? {
            id: currentUser.id,
            name: currentUser.display_name || 'You',
            avatarUrl: currentUser.avatar || '',
          }
        : undefined;

      const [outlines, passesArr] = await Promise.all([
        Promise.all(
          courses.map(async (course) => {
            try {
              return await coursesApi.fullOutline(course.id, course.slug);
            } catch {
              return null;
            }
          })
        ),
        Promise.all(
          courses.map(async (course) => {
            try {
              return await coursesApi.passedNodes(course.id);
            } catch {
              return [];
            }
          })
        ),
      ]);
      if (cancelled) return;

      const built = buildPathwayFromOutlines(
        courses,
        new Map(courses.map((course, index) => [course.id, outlines[index] ?? null])),
        viewer,
        new Map(courses.map((course, index) => [course.id, passesArr[index] ?? []]))
      );
      pathwayApi.setDataSource(built);
      if (cancelled) return;

      // fetchSegments only sets pathway/nodes from the response — tracks and the
      // pathway snapshot come straight from the built model (same as the creator's
      // getPathway + getTracks initialization).
      setPathway(built.pathway);
      setTracks(built.tracks);
      await fetchSegments(false, built.initialOffset);
    };
    initialize();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, viewerKey, fetchSegments]);

  const handleLoadMoreSegments = async () => {
    if (!hasMoreSegments || isLoadingSegments) return;
    await fetchSegments(true, nextOffset);
    showToast(`Loaded segments ${nextOffset + 1}-${Math.min(nextOffset + 7, totalSegments)} on demand`);
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

  const openNode = (url?: string) => {
    if (!url) return;
    router.push(appPath(url));
  };

  const currentUserNodeId = pathway?.currentUser.currentNodeId || '';

  if (activeCourses.length === 0) {
    return (
      <div className="pathway-canvas relative w-full h-full min-h-[720px] flex items-center justify-center bg-zinc-950">
        <p className="max-w-sm px-6 text-center text-sm text-zinc-400 font-medium">
          No active course yet. Join or continue a course and your learning road appears here.
        </p>
      </div>
    );
  }

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
        currentUserName={pathway?.currentUser.name || 'You'}
        onOpenAdmin={() => {}}
        streakDays={pathway?.currentUser.streakDays ?? 0}
        fuelPercentage={pathway?.currentUser.fuelPercentage ?? 0}
        hasNeonHalo={pathway?.currentUser.hasNeonHalo ?? false}
        onGateCelebration={() => {
          fetchSegments(false, 0);
        }}
      />

      <NodeDetailSheet
        node={selectedNode}
        allNodes={allExistingNodes.length > 0 ? allExistingNodes : nodes}
        onClose={() => setSelectedNode(null)}
        onCompleteNode={handleCompleteNode}
        onMoveAvatar={handleMoveAvatar}
        isCurrentUserHere={selectedNode?.id === currentUserNodeId}
        onOpenNode={openNode}
      />
    </div>
  );
}
