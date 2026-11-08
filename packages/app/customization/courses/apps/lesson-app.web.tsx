'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'app/lib/hooks/router';
import { appPath } from './app-path';
import LessonPlayer from '../screens/LessonPlayer';
import type { Lesson as LessonType, OutlineItem, Step } from '../types';
import { coursesApi } from '../api';
import { pageNodeId, type LessonAppProps } from './lesson-app.types';

/**
 * Web lesson element for the `lesson_structure` block type.
 * Bridges the UNA node payload (block.data) with the designed lesson player:
 * - resolves the course context from the page URL/cover,
 * - fetches the full outline for the player sidebar and prev/next navigation,
 * - wires pass/step and pass/lesson to the real UNA services.
 */
export default function LessonApp(props: LessonAppProps) {
    const [lesson, setLesson] = useState<LessonType | null>(null);
    const [outline, setOutline] = useState<{ courseId: number; isEditable: boolean; items: OutlineItem[] } | null>(null);
    const [slug, setSlug] = useState('');
    const [routeNodeId, setRouteNodeId] = useState<number | null>(null);
    const outlineRef = useRef<{ courseId: number; isEditable: boolean; items: OutlineItem[] } | null>(null);
    /** Client-side navigation: switching lessons fetches only the next page data — no document reload. */
    const router = useRouter();

    // Attach the sequential prev/next lesson the player's bottom bar and teaser render.
    const attachNav = useCallback(
        (built: LessonType, o: { items: OutlineItem[] } | null): LessonType => {
            const lessonItems = (o?.items ?? []).filter((i) => i.level === 3);
            const idx = lessonItems.findIndex((i) => i.nodeId === built.nodeId);
            if (idx === -1) return built;
            return {
                ...built,
                prev: idx > 0 ? { nodeId: lessonItems[idx - 1].nodeId, title: lessonItems[idx - 1].title } : built.prev,
                next:
                    idx < lessonItems.length - 1
                        ? { nodeId: lessonItems[idx + 1].nodeId, title: lessonItems[idx + 1].title }
                        : built.next
            };
        },
        []
    );

    const buildLesson = useCallback(
        async (nodeId: number, base: LessonAppProps['data'], courseId: number, lessonSlug: string) => {
            // prefer a proper service fetch (carries pass state for the member) - fall back to the block payload
            const fetched = courseId ? await coursesApi.nodeBlock(courseId, nodeId, lessonSlug) : null;
            if (fetched) return fetched; // already normalized in coursesApi; never re-normalize or text/labels are lost
            const payload: any = {
                index: base?.index ?? 0,
                sample: base?.sample ?? 'lesson',
                title: base?.title ?? '',
                text: base?.text ?? '',
                passing: base?.passing,
                steps: base?.steps ?? [],
                attachments: base?.attachments ?? []
            };
            // kit Label/Step normalization keeps kit promise type (usage on steps)
            const normalizeStepField = (raw: any, i: number, usage: 0 | 1): Step => ({
                id: Number(raw?.id ?? i),
                order: Number(raw?.order ?? i + 1),
                usage,
                contentType: raw?.content_type || raw?.type || (usage ? 'bx_files' : 'bx_classes'),
                typeLabel: String(raw?.type ?? ''),
                title: raw?.title ?? '',
                textHtml: raw?.text ?? '',
                image: raw?.image,
                video: raw?.video
                    ? { src: raw.video.src_mp4 || raw.video.src, poster: raw.video.src_poster }
                    : undefined,
                file: raw?.download_link
                    ? { downloadUrl: raw.download_link, name: raw?.title, sizeLabel: raw?.size }
                    : undefined,
                passed: raw?.passed === true || raw?.passed === 1,
                locked: !!raw?.locked,
                options: Array.isArray(raw?.options) ? raw.options.map(String) : undefined
            });
            return {
                nodeId,
                courseId,
                index: Number(payload.index ?? 0),
                title: payload.title ?? '',
                textHtml: payload.text ?? '',
                passing: (payload.passing === 1 || payload.passing === true ? 1 : 0) as 0 | 1,
                progress: payload.progress ?? { percent: 0, status: 'in process' },
                steps: (payload.steps ?? []).map((s: any, i: number) => normalizeStepField(s, i, 0)),
                attachments: (payload.attachments ?? []).map((s: any, i: number) => normalizeStepField(s, i, 1))
            };
        },
        []
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const nodeId = pageNodeId(props.url);
            if (nodeId === null) return;
            const path = props.url || '';

            // content id: lesson pages carry the entry context in their page JSON cover/elements
            let courseId = 0;
            try {
                const page = await coursesApi.getPage(path);
                const coverProfileId = Number(page?.cover_block?.profile?.id ?? 0);
                const elementData = [];
                for (const cell of Object.keys(page?.elements ?? {})) {
                    for (const block of (page?.elements as any)?.[cell] ?? []) elementData.push(block?.content?.[0]?.data);
                }
                const inlineContentId = elementData.find((d: any) => d?.entry_id)?.entry_id ?? 0;
                courseId = Number(inlineContentId ?? 0);
                if (!courseId && coverProfileId) {
                    const info = await coursesApi.contentInfoByProfileId(coverProfileId);
                    courseId = Number(info?.id ?? 0);
                }
                // NOTE: keep the url slug (page passed relative path), not the profile id
                const match = /view-course-profile(-node)?\/([^/?#]+)/.exec(path);
                const lessonSlug = match?.[2] ?? '';
                setSlug(lessonSlug);

                // The lesson page payload has no course id: resolve it via the course profile page.
                if (!courseId && lessonSlug) {
                    const coursePage = await coursesApi.getPage(`view-course-profile/${lessonSlug}`);
                    const courseProfileId = Number(coursePage?.cover_block?.profile?.id ?? 0);
                    if (courseProfileId) {
                        const info = await coursesApi.contentInfoByProfileId(courseProfileId);
                        courseId = Number(info?.id ?? 0);
                    }
                }

                if (cancelled) return;
                const built = await buildLesson(nodeId, props.data, courseId, lessonSlug);
                if (cancelled) return;
                setRouteNodeId(nodeId);
                setLesson(attachNav(built, outlineRef.current));

                if (courseId) {
                    const outline = await coursesApi.fullOutline(courseId, lessonSlug);
                    if (cancelled) return;
                    outlineRef.current = outline;
                    setOutline(outline);
                    setLesson(attachNav(built, outline));
                }
            } catch (e) {
                console.warn('lesson app init failed', e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [props.data, props.url, props.uri]);

    const onPassStep = (dataId: number) => {
        coursesApi.passData(dataId).then(() => {
            const nodeId = routeNodeId ?? pageNodeId(props.url);
            if (nodeId != null && lesson) {
                buildLesson(nodeId, props.data, lesson.courseId, slug).then((built) => setLesson(attachNav(built, outlineRef.current)));
            }
        });
    };

    const onPassOrResetLesson = (nodeId: number) => {
        coursesApi.passNode(nodeId).then(() => {
            if (lesson) buildLesson(nodeId, props.data, lesson.courseId, slug).then((built) => setLesson(attachNav(built, outlineRef.current)));
        });
    };

    /** Load one lesson node and show it without touching the route. */
    const loadLessonNode = useCallback(
        async (targetNodeId: number): Promise<boolean> => {
            const courseId = outlineRef.current?.courseId ?? 0;
            const next = courseId ? await coursesApi.nodeBlock(courseId, targetNodeId, slug) : null;
            if (!next) return false;
            setRouteNodeId(targetNodeId);
            setLesson(attachNav(next, outlineRef.current));
            return true;
        },
        [attachNav, slug]
    );

    // Browser Back/Forward between lessons: pushState changed the URL without a
    // route navigation, so the player restores the lesson from `node_id` here.
    useEffect(() => {
        const onPopState = () => {
            const raw = new URL(window.location.href).searchParams.get('node_id');
            const id = Number(raw ?? 0);
            if (id > 0) void loadLessonNode(id);
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [loadLessonNode]);

    /** Switch lessons in place: fetch the lesson and re-render the player, then
     * update the URL with history.pushState. No route navigation and no document
     * reload — Next never re-fetches the page shell for a sidebar click. */
    const onOpenLessonByNav = async (targetNodeId: number, dir?: 'prev' | 'next') => {
        if (!outline) return;
        const lessonItems = outline.items.filter((i) => i.level === 3) || [];
        const currentIndex = lessonItems.findIndex((i) => i.nodeId === (routeNodeId ?? targetNodeId));
        const target =
            dir === undefined
                ? lessonItems.find((i) => i.nodeId === targetNodeId)
                : lessonItems[dir === 'next' ? Math.min(currentIndex + 1, lessonItems.length - 1) : Math.max(currentIndex - 1, 0)];
        if (!target) return;
        if (await loadLessonNode(target.nodeId)) {
            if (target.url) window.history.pushState(null, '', appPath(target.url));
            return;
        }
        if (target.url) router.push(appPath(target.url));
    };

    if (!lesson) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <LessonPlayer
            lesson={lesson}
            outline={outline ?? undefined}
            onPassStep={onPassStep}
            onPassOrResetLesson={onPassOrResetLesson}
            onSelectLesson={(nodeId) => onOpenLessonByNav(nodeId)}
            onNextLesson={(nodeId) => onOpenLessonByNav(nodeId, 'next')}
            onPrevLesson={(nodeId) => onOpenLessonByNav(nodeId, 'prev')}
            onBackToCourse={() => slug && router.push(`/view-course-profile/${slug}`)}
        />
    );
}
