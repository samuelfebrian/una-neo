/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Award,
  Briefcase,
  Compass,
  Plus,
  Minus,
  RotateCcw,
  Users,
  Navigation,
} from './lucideIcons';
import { PathNode, PathTrack, Colleague } from './types';
import { pathwayApi } from './pathwayApi';

interface IsometricRoadmapViewProps {
  nodes: PathNode[];
  tracks: PathTrack[];
  currentUserNodeId: string;
  onSelectNode: (node: PathNode) => void;
  hasMoreSegments: boolean;
  onLoadMoreSegments: () => void;
  isLoadingSegments: boolean;
  totalSegments: number;
  loadedSegments: number;
  currentUserAvatar: string;
  currentUserName: string;
  onSendKudo?: (colleagueId: string, nodeId: string) => void;
  onOpenAdmin: () => void;
  streakDays?: number;
  fuelPercentage?: number;
  hasNeonHalo?: boolean;
  onGateCelebration?: (gateDesc: string) => void;
  onOpenStudySquad?: () => void;
  onPairBuddy?: (colleagueId: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
  z?: number;
  trackColor: string;
  isTurn?: boolean;
}

export const IsometricRoadmapView: React.FC<IsometricRoadmapViewProps> = ({
  nodes,
  tracks,
  currentUserNodeId,
  onSelectNode,
  hasMoreSegments,
  onLoadMoreSegments,
  isLoadingSegments,
  totalSegments,
  loadedSegments,
  currentUserAvatar,
  currentUserName,
  onSendKudo,
  onOpenAdmin,
  streakDays = 7,
  fuelPercentage = 100,
  hasNeonHalo = true,
  onGateCelebration,
  onOpenStudySquad,
  onPairBuddy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Group nodes by track for drawing roads & compute track-specific index
  const trackNodesMap = new Map<string, PathNode[]>();
  tracks.forEach((t) => trackNodesMap.set(t.id, []));
  nodes.forEach((n) => {
    const list = trackNodesMap.get(n.trackId) || [];
    list.push(n);
    trackNodesMap.set(n.trackId, list);
  });

  // Sort each track's nodes by segmentIndex
  trackNodesMap.forEach((tNodes) => {
    tNodes.sort((a, b) => a.segmentIndex - b.segmentIndex);
  });

  const nodeTrackIndexMap = new Map<string, number>();
  trackNodesMap.forEach((tNodes) => {
    tNodes.forEach((n, idx) => {
      nodeTrackIndexMap.set(n.id, idx);
    });
  });

  // Map tracks to distinct road paths with consistent uniform spacing regardless of category filter
  const getNodePosition = (node: PathNode, indexInTrack: number): NodePosition => {
    const track = tracks.find((t) => t.id === node.trackId);
    const color = track?.colorScheme.primary || '#60a5fa';
    const idx = indexInTrack;

    if (node.trackId === 'data-analytics') {
      // Top Road branch (Cyan) - evenly spaced consecutive points along the highway
      const points = [
        { x: 180, y: -80 },
        { x: 340, y: -160 },
        { x: 500, y: -240 },
        { x: 680, y: -240 },
        { x: 840, y: -180 },
        { x: 1000, y: -120 },
        { x: 1160, y: -60 },
        { x: 1320, y: 0 },
        { x: 1480, y: 60 },
      ];
      const p = points[idx] || { x: 180 + idx * 160, y: -80 + (idx > 3 ? (idx - 3) * 50 : -idx * 60) };
      return { x: p.x, y: p.y, trackColor: color };
    } else if (node.trackId === 'ux-ui-design') {
      // Middle Road branch (Purple)
      const points = [
        { x: 140, y: 40 },
        { x: 300, y: 80 },
        { x: 460, y: 40 },
        { x: 640, y: 0 },
        { x: 800, y: -40 },
        { x: 960, y: -20 },
        { x: 1120, y: 20 },
        { x: 1280, y: 80 },
        { x: 1440, y: 140 },
      ];
      const p = points[idx] || { x: 140 + idx * 160, y: 40 + idx * 15 };
      return { x: p.x, y: p.y, trackColor: color };
    } else {
      // Bottom Road branch (Emerald)
      const points = [
        { x: 120, y: 160 },
        { x: 280, y: 220 },
        { x: 440, y: 280 },
        { x: 620, y: 240 },
        { x: 780, y: 180 },
        { x: 940, y: 140 },
        { x: 1100, y: 120 },
        { x: 1260, y: 160 },
        { x: 1420, y: 220 },
      ];
      const p = points[idx] || { x: 120 + idx * 160, y: 160 + idx * 15 };
      return { x: p.x, y: p.y, trackColor: color };
    }
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Center on current user node on mount or filter change
  useEffect(() => {
    const activeNode = nodes.find((n) => n.id === currentUserNodeId);
    if (activeNode) {
      const trackIdx = nodeTrackIndexMap.get(activeNode.id) ?? 0;
      const pos = getNodePosition(activeNode, trackIdx);
      setPan({ x: -pos.x * 0.7 + 200, y: -pos.y * 0.7 + 100 });
    }
  }, [currentUserNodeId, nodes]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Course':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Mastery':
        return <Award className="w-3.5 h-3.5" />;
      case 'Career':
        return <Briefcase className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  // 1. "Study Squad" Co-Op Detection: Current user and peer on same category path and track
  const activeUserNode = nodes.find((n) => n.id === currentUserNodeId);
  let squadPeerInfo: {
    peer: Colleague;
    node: PathNode;
    userPos: { x: number; y: number };
    peerPos: { x: number; y: number };
    midpoint: { x: number; y: number };
  } | null = null;

  if (activeUserNode) {
    const userTrackIdx = nodeTrackIndexMap.get(activeUserNode.id) ?? 0;
    const userRawPos = getNodePosition(activeUserNode, userTrackIdx);
    const userPos = { x: userRawPos.x + 160, y: userRawPos.y + 480 - 45 };

    // Find colleague on the same track with matching category
    for (const n of nodes) {
      if (n.trackId === activeUserNode.trackId) {
        const peer = n.colleaguesHere.find(
          (c) =>
            c.id !== 'user_self' &&
            c.categoryPath?.toLowerCase() === activeUserNode.category.toLowerCase()
        );
        if (peer) {
          const peerTrackIdx = nodeTrackIndexMap.get(n.id) ?? 0;
          const peerRawPos = getNodePosition(n, peerTrackIdx);
          const peerPos = { x: peerRawPos.x + 160, y: peerRawPos.y + 480 - 40 };
          squadPeerInfo = {
            peer,
            node: n,
            userPos,
            peerPos,
            midpoint: {
              x: (userPos.x + peerPos.x) / 2,
              y: (userPos.y + peerPos.y) / 2,
            },
          };
          break;
        }
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full min-h-[720px] overflow-hidden select-none cursor-grab active:cursor-grabbing flex flex-col flex-1"
    >
      {/* Background Cybernetic Isometric Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 80%),
            linear-gradient(30deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(-30deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        }}
      />

      {/* Floating Blueprint Math & Formulas (matching user's reference schematic!) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden font-mono text-[11px] text-blue-500/25 select-none">
        <span className="absolute top-20 left-36 font-semibold">{'1-m = (r^2)^2'}</span>
        <span className="absolute top-48 left-96">{'Δm/2 + χ'}</span>
        <span className="absolute bottom-36 left-48">{'+Σ^2   X · #'}</span>
        <span className="absolute top-28 right-96">{'O(n^2) → λ'}</span>
        <span className="absolute bottom-48 right-64">{'∇ · B = 0'}</span>
      </div>

      {/* Mini App Google-Maps HUD Controls */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        {/* Roadway Streak & Daily Fuel Widget */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-1 text-amber-400 font-bold" title="7-Day Roadway Study Streak Active">
            <span>🔥</span>
            <span>{streakDays}d Streak</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1.5 text-blue-300" title="Daily Roadway Traffic Fuel">
            <span className="text-xs">⚡</span>
            <div className="w-14 h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"
                style={{ width: `${fuelPercentage}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold">{fuelPercentage}%</span>
          </div>
          {squadPeerInfo && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="text-[11px] text-purple-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>+15% XP Synergy</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
            className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.65))}
            className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(0.95);
              const activeNode = nodes.find((n) => n.id === currentUserNodeId);
              if (activeNode) {
                const trackIdx = nodeTrackIndexMap.get(activeNode.id) ?? 0;
                const pos = getNodePosition(activeNode, trackIdx);
                setPan({ x: -pos.x * 0.7 + 200, y: -pos.y * 0.7 + 100 });
              } else {
                setPan({ x: 0, y: 0 });
              }
            }}
            className="p-2 text-zinc-300 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Recenter On My Location"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Study Squad Hub Button */}
        {onOpenStudySquad && (
          <button
            onClick={onOpenStudySquad}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/50 text-purple-200 rounded-xl font-sans text-xs font-semibold shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title="Study Squad Hub: Assign peers, pair buddy, trigger Raid Gates"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Study Squad & Raid Hub</span>
          </button>
        )}

        {/* Segments HUD status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-xl backdrop-blur-md text-xs text-zinc-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Segments: {loadedSegments}/{totalSegments}</span>
        </div>
      </div>

      {/* Main Pan/Zoom World Stage */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="relative w-[1800px] h-[900px] shrink-0">
          {/* ================= SVG 3D ROAD HIGHWAYS & CIRCUITS ================= */}
          <svg
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            viewBox="0 0 1800 900"
          >
            <defs>
              {/* Neon arrow markers */}
              <linearGradient id="cyanRoadGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="purpleRoadGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="emeraldRoadGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
              </linearGradient>

            </defs>

            {/* Central Junction Roads branching out */}
            {/* Origin Hub Base Platform (Elevated 3D Hex/Square Hub) */}
            <g transform="translate(40, 480)">
              {/* Base shadow */}
              <polygon
                points="0,40 120,-30 240,40 120,110"
                fill="#09090b"
                opacity="0.9"
              />
              {/* 3D Depth Extrusion */}
              <polygon
                points="0,30 0,50 120,120 120,100"
                fill="#18181b"
              />
              <polygon
                points="240,30 240,50 120,120 120,100"
                fill="#27272a"
              />
              {/* Top Face */}
              <polygon
                points="0,30 120,-40 240,30 120,100"
                fill="url(#cyanRoadGlow)"
                opacity="0.25"
                stroke="#60a5fa"
                strokeWidth="2"
              />
              {/* Central Glowing Icon Base */}
              <circle cx="120" cy="30" r="28" fill="#18181b" stroke="#60a5fa" strokeWidth="2" />
              <text
                x="120"
                y="34"
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="12"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                HUB
              </text>
            </g>

            {/* Render 3D Roads for each Track */}
            {tracks.map((track) => {
              const trackNodes = trackNodesMap.get(track.id) || [];
              if (trackNodes.length === 0) return null;

              // Generate coordinate list starting from Hub (160, 510)
              const points: { x: number; y: number }[] = [
                { x: 160, y: 510 },
                ...trackNodes.map((n, i) => {
                  const pos = getNodePosition(n, i);
                  return { x: pos.x + 160, y: pos.y + 480 };
                }),
              ];

              // Build Road Path with 3D Slab Thickness
              const pathD = points
                .map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
                .join(' ');

              return (
                <g key={track.id}>
                  {/* Under-road dark shadow */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#09090b"
                    strokeWidth="38"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                    transform="translate(0, 10)"
                  />

                  {/* 3D Road Thickness / Bevel Side */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#18181b"
                    strokeWidth="30"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0, 4)"
                  />

                  {/* Main Road Surface (Dark Metallic Road) */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Road Edges (Subtle Neon Curbs) */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={track.colorScheme.primary}
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Glowing Animated Center Line with Directional Pulse */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={track.colorScheme.primary}
                    strokeWidth="3"
                    strokeDasharray="14 10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />

                  {/* Stepped Pedestal Bases along the road for each milestone */}
                  {trackNodes.map((node, i) => {
                    const pos = getNodePosition(node, i);
                    const cx = pos.x + 160;
                    const cy = pos.y + 480;

                    return (
                      <g key={`pedestal-${node.id}`} transform={`translate(${cx}, ${cy})`}>
                        {/* 3D Isometric Base Pedestal */}
                        <polygon
                          points="-28,14 0,-2 28,14 0,30"
                          fill="#0b0b0d"
                          stroke={track.colorScheme.primary}
                          strokeWidth="1.5"
                          strokeOpacity="0.7"
                        />
                        <polygon
                          points="-28,14 -28,20 0,36 0,30"
                          fill="#09090b"
                        />
                        <polygon
                          points="28,14 28,20 0,36 0,30"
                          fill="#101012"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}

                  {/* Routing Laser Connection Beam for Study Squad (Co-Op Shared Velocity Boost) */}
                  {/* Performance: static composite glow (layered strokes, no SVG blur filter, no CSS animation) */}
                  {squadPeerInfo && (
                    <g>
                      {/* Static fake glow: wide low-opacity halo instead of feGaussianBlur */}
                      <line
                        x1={squadPeerInfo.userPos.x}
                        y1={squadPeerInfo.userPos.y}
                        x2={squadPeerInfo.peerPos.x}
                        y2={squadPeerInfo.peerPos.y}
                        stroke="#60a5fa"
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0.08"
                      />
                      {/* Outer halo line */}
                      <line
                        x1={squadPeerInfo.userPos.x}
                        y1={squadPeerInfo.userPos.y}
                        x2={squadPeerInfo.peerPos.x}
                        y2={squadPeerInfo.peerPos.y}
                        stroke="#60a5fa"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.35"
                      />
                      {/* Core beam */}
                      <line
                        x1={squadPeerInfo.userPos.x}
                        y1={squadPeerInfo.userPos.y}
                        x2={squadPeerInfo.peerPos.x}
                        y2={squadPeerInfo.peerPos.y}
                        stroke="#c084fc"
                        strokeWidth="2.5"
                        strokeDasharray="8 6"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </svg>

          {/* ================= HTML HOLOGRAPHIC BILLBOARDS & AVATARS ================= */}
          {/* Study Squad Holographic Badge on Road between Avatars */}
          {squadPeerInfo && (
            <div
              className="absolute z-35 pointer-events-auto transition-transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${squadPeerInfo.midpoint.x}px`,
                top: `${squadPeerInfo.midpoint.y - 15}px`,
              }}
            >
              <button
                type="button"
                onClick={onOpenStudySquad}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950/90 border border-blue-400/80 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.6)] backdrop-blur-md text-[10px] text-blue-200 font-bold whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 transition-all"
                title={`Study Squad with ${squadPeerInfo.peer.name}! Click to open Study Squad & Raid Hub`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Study Squad · +15% XP Synergy</span>
              </button>
            </div>
          )}

          {/* Each card stands upright on its pedestal with minimal text: TITLE ONLY */}
          {nodes.map((node) => {
            const trackIdx = nodeTrackIndexMap.get(node.id) ?? 0;
            const pos = getNodePosition(node, trackIdx);
            const cx = pos.x + 160;
            const cy = pos.y + 480;
            const isCurrentUserHere = node.id === currentUserNodeId;

            // Visual styling matching the reference image holographic cards
            const isCompleted = node.status === 'completed';
            const isUnlocked = node.status === 'unlocked';
            const isLocked = node.status === 'locked';

            let cardTheme = {
              border: 'border-blue-400/80',
              glow: 'shadow-[0_0_20px_rgba(56,189,248,0.35)]',
              bg: 'bg-gradient-to-b from-blue-950/80 to-zinc-950/90',
              text: 'text-blue-300',
              badge: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
            };

            if (node.trackId === 'ux-ui-design') {
              cardTheme = {
                border: 'border-purple-400/80',
                glow: 'shadow-[0_0_20px_rgba(192,132,252,0.35)]',
                bg: 'bg-gradient-to-b from-purple-950/80 to-zinc-950/90',
                text: 'text-purple-300',
                badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
              };
            } else if (node.trackId === 'cybersecurity') {
              cardTheme = {
                border: 'border-emerald-400/80',
                glow: 'shadow-[0_0_20px_rgba(52,211,153,0.35)]',
                bg: 'bg-gradient-to-b from-emerald-950/80 to-zinc-950/90',
                text: 'text-emerald-300',
                badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
              };
            }

            if (isLocked) {
              cardTheme = {
                border: 'border-zinc-800',
                glow: 'shadow-none',
                bg: 'bg-zinc-950/80',
                text: 'text-zinc-500',
                badge: 'bg-zinc-900 text-zinc-500 border-zinc-800',
              };
            }

            return (
              <div
                key={node.id}
                className="absolute z-20 pointer-events-auto transition-transform duration-200"
                style={{
                  left: `${cx}px`,
                  top: `${cy}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                {/* 1. GOOGLE MAPS STYLE FLOATING AVATAR BEACON (For Current User with 7-Day Neon Halo) */}
                {isCurrentUserHere && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none animate-bounce-slow">
                    {/* Circle Avatar with Glow Rings and 7-Day Streak Neon Halo */}
                    <div className="relative">
                      {hasNeonHalo && (
                        <span className="absolute -inset-2.5 rounded-full ring-2 ring-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.9)] neon-halo-effect pointer-events-none" />
                      )}
                      <div className="w-12 h-12 rounded-full ring-3 ring-blue-400 shadow-[0_0_25px_rgba(56,189,248,0.8)] overflow-hidden bg-zinc-900 flex items-center justify-center">
                        <img
                          src={currentUserAvatar}
                          alt={currentUserName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {/* Pulsing Radar Ring */}
                      <span className="absolute -inset-1 rounded-full ring-2 ring-blue-400 animate-ping opacity-75" />
                    </div>

                    {/* Downward Location Beacon Pin */}
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-400 -mt-0.5 filter drop-shadow-[0_2px_4px_rgba(56,189,248,0.8)]" />

                    {/* "YOU" Floating Pill with 7-Day Streak */}
                    <div className="mt-0.5 flex items-center gap-1 px-2 py-0.5 bg-blue-400 text-zinc-950 text-[9px] font-black rounded-full shadow-lg tracking-wider">
                      <span>YOU</span>
                      {hasNeonHalo && <span title="7-Day Roadway Streak Active">🔥 7d</span>}
                    </div>
                  </div>
                )}

                {/* 2. COLLABORATIVE MILESTONE GATE ("RAID BOSS") ARCHWAY */}
                {node.communityGate && (
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-35 pointer-events-auto flex flex-col items-center">
                    <div
                      className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl flex flex-col items-center gap-1 text-center min-w-[150px] transition-all ${
                        node.communityGate.isUnlocked
                          ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-emerald-500/20'
                          : 'bg-zinc-950/95 border-amber-500/80 text-amber-200 shadow-amber-500/25'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                        <span>{node.communityGate.isUnlocked ? '🎉 Gate Open' : '🔒 Raid Gate'}</span>
                        <span className="font-mono text-blue-300">
                          {node.communityGate.currentCompletedCount}/{node.communityGate.requiredCompletedCount}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-300 font-medium line-clamp-1">
                        {node.communityGate.rewardBadge}
                      </span>

                      {!node.communityGate.isUnlocked && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const res = await pathwayApi.rallySquadForGate(node.id);
                            node.communityGate = res.node.communityGate;
                            if (res.isNowUnlocked) {
                              onGateCelebration?.(
                                `🎉 SQUAD MILESTONE CLEARED! "${res.rewardBadge}" badge awarded (+500 XP)!`
                              );
                            }
                          }}
                          className="w-full mt-0.5 py-0.5 px-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded text-[9px] font-bold cursor-pointer transition-colors active:scale-95 shadow-md"
                          title="Simulate squad member contributing to this milestone unlock"
                        >
                          Rally Squad (+1)
                        </button>
                      )}
                    </div>
                    {/* Glowing holographic downward guide line */}
                    <div
                      className={`w-0.5 h-4 ${
                        node.communityGate.isUnlocked ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                )}

                {/* 2. COLLEAGUE CIRCULAR AVATARS FLOATING ON ROAD (Google Maps Style Pins - Filtered by category path) */}
                {!isCurrentUserHere && node.colleaguesHere.length > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 flex items-center -space-x-2 pointer-events-none">
                    {node.colleaguesHere.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPairBuddy) {
                            onPairBuddy(col.id);
                          } else {
                            onSendKudo?.(col.id, node.id);
                          }
                        }}
                        className="relative group/colleague pointer-events-auto cursor-pointer hover:scale-125 transition-transform focus:outline-none"
                        title={`${col.name} (${col.role}) · Click to Pair in Study Squad or send High-Five ⚡`}
                      >
                        <img
                          src={col.avatar}
                          alt={col.name}
                          className="w-7 h-7 rounded-full ring-2 ring-purple-400 object-cover shadow-lg shadow-purple-500/40 bg-zinc-800"
                        />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full text-[9px] flex items-center justify-center text-zinc-950 font-bold opacity-0 group-hover/colleague:opacity-100 transition-opacity shadow-md">
                          ⚡
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. UPRIGHT HOLOGRAPHIC GLASS CARD (Minimal: Only Title, reduced height, no lock icon) */}
                <button
                  onClick={() => onSelectNode(node)}
                  className={`group relative text-left w-36 sm:w-40 px-3 py-2 rounded-xl border backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${cardTheme.border} ${cardTheme.glow} ${cardTheme.bg}`}
                >
                  {/* Holographic light reflection sweep */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                  {/* Title only - minimal text and reduced card height */}
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-blue-200 transition-colors">
                      {node.title}
                    </h4>
                    {isCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </div>

                  {/* Stem connecting down to the category icon on the road */}
                  <div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-3 transition-colors"
                    style={{ backgroundColor: isLocked ? '#3f3f46' : pos.trackColor }}
                  />

                  {/* Pure Category Icon on the road point below the card - NO icon background */}
                  <div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center transition-transform group-hover:scale-125 pointer-events-none drop-shadow-md"
                    style={{
                      color: isCompleted
                        ? '#60a5fa'
                        : isLocked
                        ? '#71717a'
                        : pos.trackColor,
                    }}
                    title={`Category: ${node.category}`}
                  >
                    {getCategoryIcon(node.category)}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
