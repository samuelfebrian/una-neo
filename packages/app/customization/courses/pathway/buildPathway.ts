/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PathNode, Pathway, PathTrack } from './types';
import type { Outline } from '../types';

/** The active courses shown as pathway tracks (max 3, in-progress first). */
export type ActiveCourseInfo = { id: number; slug: string; title: string };

export interface ViewerInfo {
    id: number | string;
    name: string;
    avatarUrl: string;
}

export interface BuiltPathway {
    pathway: Pathway;
    tracks: PathTrack[];
    nodes: PathNode[];
    /** First fetch offset chosen so the 7-segment page holds 2 passed lessons + the next 5 (frontier inside). */
    initialOffset: number;
}

/** Same color families as the three isometric road lanes. */
const TRACK_PALETTES = [
    { primary: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)', border: 'border-sky-500/40', bg: 'bg-sky-500/10' },
    { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
    { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
] as const;

type MasteryLevel = 'Foundational' | 'Intermediate' | 'Advanced' | 'Mastery';

const levelByModuleOrdinal = (ordinal: number): MasteryLevel => {
    if (ordinal <= 0) return 'Foundational';
    if (ordinal <= 2) return 'Intermediate';
    if (ordinal <= 4) return 'Advanced';
    return 'Mastery';
};

const trackIdFor = (courseId: number): string => `course-${courseId}`;
const lessonIdFor = (nodeId: number): string => `lesson-${nodeId}`;

/**
 * Build the pathway data model from real UNA course outlines (the ONLY data source for
 * the live canvas). One track per active course; one node per lesson, in curriculum
 * order; statuses come from UNA pass data — nothing is invented.
 *
 * `passedNodeIdsByCourse` carries the viewer's real pass records
 * (`bx_courses_content_nodes2users` via `coursesApi.passedNodes`) — the authoritative
 * lesson-pass source. The outline rows' pass fields summarize per-node step-type
 * counters, which UNA does not maintain for every authored node, so they are read
 * only for the (0–99) progress display.
 */
export function buildPathwayFromOutlines(
    courses: ActiveCourseInfo[],
    outlineByCourseId: Map<number, Outline | null>,
    viewer: ViewerInfo | undefined,
    passedNodeIdsByCourse?: Map<number, number[]>
): BuiltPathway {
    const activeCourses = courses.slice(0, 3);

    const tracks: PathTrack[] = activeCourses.map((course, index) => {
        const palette = TRACK_PALETTES[index % TRACK_PALETTES.length] ?? TRACK_PALETTES[0];
        return {
            id: trackIdFor(course.id),
            name: course.title,
            description: '',
            currentSkills: [],
            targetRole: '',
            colorScheme: {
                primary: palette?.primary ?? '#38bdf8',
                glow: palette?.glow ?? 'rgba(56, 189, 248, 0.4)',
                border: palette?.border ?? 'border-sky-500/40',
                bg: palette?.bg ?? 'bg-sky-500/10',
            },
        };
    });

    const nodes: PathNode[] = [];
    let passedCount = 0;

    /** First un-passed lesson per track — null when every lesson is passed or the track has none. */
    const frontierByTrack = new Map<string, { nodeId: string; ordinal: number }>();

    for (const course of activeCourses) {
        const trackId = trackIdFor(course.id);
        const trackName = course.title;
        const outline = outlineByCourseId.get(course.id) ?? null;

        // Theme title per lesson (real grouping, shown as the card's theme tag).
        const themeTitleByNodeId = new Map<number, string>();
        // Module ordinal per theme (drives the mastery-level label; derived, not invented data).
        const moduleOrdinalByThemeNodeId = new Map<number, number>();
        outline?.items.forEach((item) => {
            if (item.level === 2) themeTitleByNodeId.set(item.nodeId, item.title);
        });
        let moduleOrdinal = 0;
        outline?.items.forEach((item) => {
            if (item.level === 1) {
                const at = moduleOrdinal++;
                outline.items.forEach((theme) => {
                    if (theme.level === 2 && theme.parentId === item.nodeId) {
                        moduleOrdinalByThemeNodeId.set(theme.nodeId, at);
                    }
                });
            }
        });

        // Encounter order of level-3 rows is the curriculum order (same order the outline UI uses).
        const lessons = (outline?.items ?? []).filter((item) => item.level === 3);
        const passed = new Set(passedNodeIdsByCourse?.get(course.id) ?? []);

        let frontierIdx = lessons.findIndex((lesson) => !passed.has(lesson.nodeId));
        if (frontierIdx === -1) frontierIdx = lessons.length;
        const frontierLesson = frontierIdx >= 0 ? lessons[frontierIdx] : undefined;
        frontierByTrack.set(
            trackId,
            frontierLesson
                ? { nodeId: lessonIdFor(frontierLesson.nodeId), ordinal: frontierIdx }
                : { nodeId: '', ordinal: frontierIdx }
        );

        lessons.forEach((lesson, index) => {
            let status: PathNode['status'];
            const isLessonPassed = passed.has(lesson.nodeId);
            if (isLessonPassed) {
                status = 'completed';
                passedCount++;
            } else if (index === frontierIdx) {
                status = lesson.progress?.status === 'in process' ? 'in_progress' : 'unlocked';
            } else {
                status = 'locked';
            }

            const themeTitle = themeTitleByNodeId.get(lesson.parentId) ?? '';
            const moduleOrdinalForLevel = moduleOrdinalByThemeNodeId.get(lesson.parentId) ?? 0;
            const previous = index > 0 ? lessons[index - 1] : undefined;

            nodes.push({
                id: lessonIdFor(lesson.nodeId),
                title: lesson.title,
                category: 'Course',
                trackId,
                trackName,
                description: themeTitle ?? '',
                status,
                segmentIndex: index,
                durationHours: 0,
                skillsGained: themeTitle ? [themeTitle] : [],
                prerequisites: previous ? [lessonIdFor(previous.nodeId)] : [],
                externalUrl: lesson.url ?? '',
                progressPercent: isLessonPassed
                    ? 100
                    : Math.min(Math.max(0, lesson.progress?.percent ?? 0), 99),
                xpPoints: 0,
                level: levelByModuleOrdinal(moduleOrdinalForLevel),
                colleaguesHere: [],
            });
        });
    }

    const primary = activeCourses[0];
    const primaryTrackId = primary ? trackIdFor(primary.id) : '';
    let frontierNodeId = '';
    let initialOffset = 0;
    if (primary) {
        const frontier = frontierByTrack.get(primaryTrackId) ?? { nodeId: '', ordinal: 0 };
        if (frontier.nodeId) {
            frontierNodeId = frontier.nodeId;
            initialOffset = Math.max(0, frontier.ordinal - 2);
        } else if (frontier.ordinal > 0 && nodes.length > 0) {
            // Fully passed course: park the avatar on the last lesson.
            const committed = nodes.filter((n) => n.trackId === primaryTrackId);
            const lastNode = committed[committed.length - 1];
            frontierNodeId = lastNode ? lastNode.id : '';
            initialOffset = 0;
        }
    }

    const pathway: Pathway = {
        id: primary ? `pathway-course-${primary.id}` : 'pathway-empty',
        title: primary ? `${primary.title} — Learning Road` : 'Learning Road',
        description: '',
        category: 'Course',
        primaryTrackId,
        totalSegments: nodes.length ? Math.max(...nodes.map((n) => n.segmentIndex)) + 1 : 0,
        lastUpdated: '',
        createdAt: '',
        tags: ['Lessons'],
        currentUser: {
            id: String(viewer?.id ?? 'guest'),
            // Streak/fuel/halo are presentation widgets with no UNA data source yet —
            // they keep the designed defaults instead of rendering as zeros.
            name: viewer?.name || 'You',
            avatar: viewer?.avatarUrl || '',
            currentNodeId: frontierNodeId,
            totalXp: 0,
            completedCount: passedCount,
            streakDays: 7,
            fuelPercentage: 100,
            hasNeonHalo: true,
            communityBadges: [],
        },
    };

    return { pathway, tracks, nodes, initialOffset };
}
