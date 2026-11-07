'use client'

/**
 * Full-page curriculum & lesson authoring (`edit-course-content/<slug>`).
 * kit OutlineEditor + lesson step editor wired to the real UNA authoring
 * services (bx_courses_cnt_structure_manage / bx_courses_cnt_data_manage grids).
 * UNA page blocks (timing, tools) stay embedded below the editor.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockByData } from 'app/components/block';
import OutlineEditor from '../screens/OutlineEditor';
import LessonEditor from '../screens/LessonEditor';
import { coursesApi } from '../api';

import type { Lesson, NodeId, Outline, OutlineItem, Step } from '../types';

type Block = Record<string, unknown>;

function unaBlocks(data: any): Block[] {
    const out: Block[] = [];
    for (const cell of Object.keys(data?.elements ?? {})) {
        out.push(...(((data?.elements as any)?.[cell] ?? []) as Block[]));
    }
    return out;
}

export default function OutlineEditorPageApp({ data }: { data: any }) {
    const [outline, setOutline] = useState<Outline | null>(null);
    const [slug, setSlug] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [blockList, setBlockList] = useState<Block[]>([]);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');

    const refreshOutline = useCallback(async (courseId: number) => {
        setOutline(await coursesApi.fullOutline(courseId, slug, true));
    }, [slug]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setBlockList(unaBlocks(data));
            const url: string = data?.url ?? '';
            const match = /edit-course-content\/([^/?#]+)/.exec(url);
            const s = match?.[1] ?? '';
            setSlug(s);
            const coverProfileId = Number(data?.cover_block?.profile?.id ?? 0);
            const info = coverProfileId ? await coursesApi.contentInfoByProfileId(coverProfileId) : null;
            const contentId = Number(info?.id ?? 0);
            const l1 = contentId ? await coursesApi.structureL1(contentId) : { items: [], isEditable: false, entryId: contentId };
            if (cancelled) return;
            setIsOwner(l1.isEditable);
            if (contentId) {
                setOutline(await coursesApi.fullOutline(contentId, s, l1.isEditable));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [data]);

    const backUrl = useMemo(() => (slug ? `/view-course-profile/${slug}` : '/courses-home'), [slug]);

    // parent chain: module/theme -> parents for grid ops
    const parentsOf = (nodeId: NodeId, o: Outline): { parentId: number; isLesson: boolean } => {
        const item = o.items.find((i) => i.nodeId === nodeId);
        if (!item) return { parentId: 0, isLesson: false };
        const parent = o.items.find((i) => i.nodeId === item.parentId);
        const level = item.level;
        return { parentId: item.parentId, isLesson: level === 3 && (!!parent || false) };
    };

    if (!outline) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Curriculum Studio</h1>
                    <p className="text-xs text-slate-500">Modules, themes and lessons - order, titles and pass rules.</p>
                </div>
                <a
                    href={backUrl}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                >
                    Back to course
                </a>
            </div>

            {notice && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
                    {notice} Sign in as the course author to open the editing forms.
                </div>
            )}

            {lesson ? (
                <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            Editing lesson: {lesson.title}
                        </span>
                        <button
                            type="button"
                            onClick={() => setLesson(null)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                        >
                            Back to outline
                        </button>
                    </div>
                    <LessonEditor
                        lesson={lesson}
                        onAddStep={async (usage, _contentType, title) => {
                            // UNA flow: the step form is UNA's add modal on the data grid.
                            setBusy(true);
                            try {
                                const grid = await coursesApi.dataManageDisplay(lesson.courseId, lesson.nodeId);
                                const denied =
                                    (grid as any)?.msg?.includes?.('Access denied') ?? false;
                                if (denied) setNotice('Access denied - check your author rights for this course.');
                                else console.warn('UNA add step form payload (wire to form UI next milestone):', grid, usage, title);
                            } finally {
                                setBusy(false);
                            }
                        }}
                        onDeleteStep={async (stepId) => {
                            await coursesApi.dataManageDelete(lesson.courseId, lesson.nodeId, stepId);
                            setLesson(await coursesApi.nodeBlock(lesson.courseId, lesson.nodeId, slug));
                        }}
                        onReorderSteps={async (usage, idsInOrder) => {
                            await coursesApi.dataManageReorder(lesson.courseId, lesson.nodeId, idsInOrder);
                            setLesson(await coursesApi.nodeBlock(lesson.courseId, lesson.nodeId, slug));
                        }}
                    />
                </>
            ) : (
                <OutlineEditor
                    outline={outline}
                    onAddNode={async (parentNodeId, kind, title) => {
                        // UNA authoring: open the grid add form (context: parent)
                        setBusy(true);
                        try {
                            const formPayload = await coursesApi.structureAdd(outline.courseId, parentNodeId);
                            const denied =
                                typeof formPayload === 'string'
                                    ? formPayload.includes('Access denied')
                                    : formPayload?.msg?.includes?.('Access denied') ?? false;
                            if (denied) setNotice('Access denied - check your author rights for this course.');
                            else console.warn('UNA add-node form payload (wire to form UI next milestone):', formPayload, kind, title);
                        } finally {
                            setBusy(false);
                        }
                    }}
                    onEditNode={async (nodeId, updates) => {
                        const { parentId } = parentsOf(nodeId, outline);
                        await coursesApi.structureEdit(outline.courseId, parentId, nodeId);
                        // field updates flow through the same grid form in UNA; local state preview:
                        setOutline((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      items: prev.items.map((i) => (i.nodeId === nodeId ? { ...i, ...updates } : i))
                                  }
                                : prev
                        );
                    }}
                    onDeleteNode={async (nodeId) => {
                        const { parentId } = parentsOf(nodeId, outline);
                        await coursesApi.structureDelete(outline.courseId, parentId, nodeId);
                        await refreshOutline(outline.courseId);
                    }}
                    onMoveNode={async (nodeId, dir) => {
                        const parentItem = outline.items.find((i) => i.nodeId === nodeId);
                        const parentId = parentItem?.parentId ?? 0;
                        const ids = outline.items
                            .filter((i) => i.parentId === parentId && i.level === parentItem?.level)
                            .sort((a, b) => a.order - b.order)
                            .map((i) => i.nodeId);
                        const idx = ids.indexOf(nodeId);
        const swapped = ids[dir === 'up' ? Math.max(0, idx - 1) : Math.min(ids.length - 1, idx + 1)];
                        const nextOrder = ids.map((id) => (id === nodeId ? swapped : id === swapped ? nodeId : id));
                        await coursesApi.structureReorder(outline.courseId, parentId, nextOrder);
                        await refreshOutline(outline.courseId);
                    }}
                    onOpenLessonEditor={async (nodeId) => {
                        const l = await coursesApi.nodeBlock(outline.courseId, nodeId, slug);
                        if (l) setLesson(l);
                    }}
                />
            )}

            {!isOwner && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
                    Showing the full outline. Editing unlocks once you have author rights for this course.
                </div>
            )}

            {/* UNA page blocks (manage tools etc.) remain embedded for full feature parity */}
            {blockList.filter((b) => !String(b?.source ?? '').includes('structure')).length > 0 && (
                <div className="space-y-3">
                    {blockList
                        .filter((b) => !String(b?.source ?? '').includes('structure'))
                        .map((block) => (
                            <OutlineBlockEmbed key={String(block.id)} block={block} />
                        ))}
                </div>
            )}
        </div>
    );
}

function OutlineBlockEmbed({ block }: { block: Block }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <BlockByData data={block} contentOnly />
        </div>
    );
}
