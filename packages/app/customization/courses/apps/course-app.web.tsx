'use client'

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'app/lib/hooks/router';
import { appPath } from './app-path';
import AccordionItem from '../primitives/Accordion';
import ProgressRing from '../primitives/ProgressRing';
import { RenderIcon } from '../primitives/IconSlot';
import { resolveContext, type CourseAppProps } from './course-app.types';

import type { NodeId, OutlineItem } from '../types';

/**
 * Web curriculum element for the `course_structure` block type.
 * UNA payload (L1 items) + lazy L2/L3 fetches rendered with the kit design:
 * numbered accordion of modules, progress rings, lesson rows with status.
 */
export default function CourseApp(props: CourseAppProps) {
    const router = useRouter();
    const [outline, setOutline] = useState<OutlineItem[] | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [slug, setSlug] = useState('');
    const [selectedModule, setSelectedModule] = useState<NodeId | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const ctx = await resolveContext(props, { full: true });
            if (cancelled) return;
            setOutline(ctx.outline?.items ?? []);
            setIsOwner(ctx.isEditable);
            setSlug(ctx.slug);
            // open the module that owns the URL's parent_id
            const parentId = new URLSearchParams(window.location.search).get('parent_id');
            if (parentId) setSelectedModule(Number(parentId));
        })();
        return () => {
            cancelled = true;
        };
    }, [props.data, props.url, props.uri]);

    const moduleItems = useMemo(() => outline?.filter((i) => i.level === 1) ?? [], [outline]);
    const lessonsByParent = useMemo(() => {
        const byParent = new Map<number, OutlineItem[]>();
        outline?.forEach((item) => {
            if (item.level === 3) {
                const list = byParent.get(item.parentId) || [];
                list.push(item);
                byParent.set(item.parentId, list);
            }
        });
        return byParent;
    }, [outline]);

    if (!outline) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {isOwner && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            // client-side transition into the outline editor
                            if (slug) router.push(`/edit-course-content/${slug}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <RenderIcon name="edit" className="w-3.5 h-3.5" />
                        Edit curriculum
                    </button>
                </div>
            )}

            <div className="space-y-2">
                {moduleItems.map((module, idx) => {
                    const lessons = lessonsByParent.get(module.nodeId) ?? [];
                    return (
                        <AccordionItem
                            key={module.nodeId}
                            id={String(module.nodeId)}
                            title={module.title}
                            subtitle={`${lessons.length} lessons`}
                            defaultOpen={idx === 0 || selectedModule === module.nodeId}
                            leading={
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono text-xs font-bold">
                                    {idx + 1}
                                </div>
                            }
                            trailing={
                                module.progress ? (
                                    <ProgressRing
                                        percent={module.progress.percent}
                                        size={28}
                                        strokeWidth={3}
                                        showText={false}
                                    />
                                ) : undefined
                            }
                        >
                            <div className="space-y-2">
                                {lessons.map((lesson) => {
                                    const isLessonPassed = lesson.progress?.status === 'completed';
                                    return (
                                        <div
                                            key={lesson.nodeId}
                                            onClick={() => lesson.url && router.push(appPath(lesson.url))}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none ${
                                                lesson.locked
                                                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 pr-3">
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                                                        isLessonPassed
                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                                            : lesson.locked
                                                              ? 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                                                              : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                                                    }`}
                                                >
                                                    <RenderIcon
                                                        name={isLessonPassed ? 'check' : lesson.locked ? 'lock' : 'play'}
                                                        className="w-3 h-3"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                        {lesson.title}
                                                    </h5>
                                                    {lesson.locked && (
                                                        <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                                            Locked until previous lesson is passed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {lesson.progress && (
                                                <span className="font-mono tabular-nums text-xs font-semibold text-slate-500">
                                                    {lesson.progress.percent}%
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </AccordionItem>
                    );
                })}
            </div>
        </div>
    );
}
