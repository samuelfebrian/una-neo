'use client'

import { useCallback, useEffect, useState } from 'react';
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

    const buildLesson = useCallback(
        async (nodeId: number, base: LessonAppProps['data'], courseId: number, lessonSlug: string) => {
            // prefer a proper service fetch (carries pass state for the member) - fall back to the block payload
            const fetched = courseId ? await coursesApi.nodeBlock(courseId, nodeId, lessonSlug) : null;
            const payload: any = fetched ?? {
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
                locked: !!raw?.locked
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
                setLesson(built);

                if (courseId) {
                    const outline = await coursesApi.fullOutline(courseId, lessonSlug);
                    if (cancelled) return;
                    setOutline(outline);
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
            const nodeId = pageNodeId(props.url);
            if (nodeId != null && lesson) {
                buildLesson(nodeId, props.data, lesson.courseId, slug).then(setLesson);
            }
        });
    };

    const onPassOrResetLesson = (nodeId: number) => {
        coursesApi.passNode(nodeId).then(() => {
            if (lesson) buildLesson(nodeId, props.data, lesson.courseId, slug).then(setLesson);
        });
    };

    const onOpenLessonByNav = (nodeId: number, dir?: 'prev' | 'next') => {
        if (!outline) return;
        const lessonItems = outline.items.filter((i) => i.level === 3) || [];
        const currentIndex = lessonItems.findIndex((i) => i.nodeId === nodeId);
        const target =
            dir === undefined
                ? lessonItems.find((i) => i.nodeId === nodeId)
                : lessonItems[dir === 'next' ? Math.min(currentIndex + 1, lessonItems.length - 1) : Math.max(currentIndex - 1, 0)];
        if (target?.url) window.location.assign(target.url);
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
            onBackToCourse={() => slug && window.location.assign(`/view-course-profile/${slug}`)}
        />
    );
}
