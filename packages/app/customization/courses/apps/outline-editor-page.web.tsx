'use client'

/**
 * Full-page curriculum & lesson authoring (`edit-course-content/<slug>`).
 * kit OutlineEditor + lesson step editor wired to the real UNA authoring
 * services (bx_courses_cnt_structure_manage / bx_courses_cnt_data_manage grids).
 * UNA page blocks (timing, tools) stay embedded below the editor.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockByData } from 'app/components/block';
import { Modal } from '../primitives/Modal';
import OutlineEditor from '../screens/OutlineEditor';
import LessonEditor from '../screens/LessonEditor';
import { contentEditPath } from './step-edit-link';
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
    const [addNodeBlock, setAddNodeBlock] = useState<Block | null>(null);
    const [addNodeTitle, setAddNodeTitle] = useState('');
    /** The course's PROFILE id (context_pid for UNA step creation — NOT the content id). */
    const [courseProfileId, setCourseProfileId] = useState(0);

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
             if (coverProfileId) setCourseProfileId(coverProfileId);

            // UNA's own post-publish/edit redirect lands on this page carrying the
            // lesson node in `parent_id` — that landing IS the edit-step state, so
            // open the lesson editor for it (no time window: the URL's meaning is
            // unconditional). The "Back to outline" button returns to the list.
            const landing = data?.url ? new URLSearchParams(data.url.split('?')[1] ?? '') : null;
            const landingNode = Number(landing?.get('parent_id') ?? 0);
            if (landingNode > 0 && contentId) {
                const landingItem = (await coursesApi.fullOutline(contentId, s, l1.isEditable)).items.find((i) => i.nodeId === landingNode);
                if (!cancelled && landingItem?.level === 3) {
                    const landed = await coursesApi.nodeBlock(contentId, landingNode, s);
                    if (!cancelled && landed) {
                        setLesson(landed);
                    }
                }
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
                        onAddStep={async (usage, contentType, _title) => {
                            // UNA flow: create the content in its module and let UNA's
                            // entry form attach it to this node (context_* params).
                            // UNA's form response carries the redirect back to this
                            // lesson node (serviceOnContentAddedRedirect in the courses
                            // module), so no local bookkeeping is needed.
                            const uriByModule: Record<string, string> = {
                                bx_videos: 'create-video',
                                bx_classes: 'create-class',
                                bx_posts: 'create-post',
                                bx_polls: 'create-poll',
                                bx_files: 'create-file'
                            };
                            const uri = uriByModule[contentType] ?? '';
                            // context_pid must be the course's PROFILE id — UNA resolves
                            // BxDolProfile::getInstance(abs(allow_view_to)) after publish.
                            window.location.assign(
                                `/${uri}?context_pid=${courseProfileId || lesson.courseId}&context_nid=${lesson.nodeId}&context_usage=${usage}`
                            );
                        }}
                        onEditStep={async (step: Step) => {
                            // UNA's own edit page for the step's content. The step's
                            // content link comes from UNA's authoring grid row (the same
                            // URLs UNA's per-row menu shows); view→edit mapping turns
                            // view-video / view-class / view-poll into the edit pages.
                            // UNA's edit form response carries the redirect back to this
                            // lesson node, so no local bookkeeping is needed.
                            let contentLink = (step.link || step?.video?.src || '');
                            try {
                                const links = await coursesApi.stepContentLinks(lesson.courseId, lesson.nodeId);
                                contentLink = links[String(step.id)] || contentLink;
                            } catch {
                                // fallback to the step link below
                            }
                            const editPath = contentEditPath(contentLink);
                            if (editPath) window.location.assign(editPath);
                            else setNotice('UNA has no edit page for this content type: ' + (step.contentType || 'unknown') + ' (content link: ' + (contentLink || 'none') + ')');
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
                        // UNA authoring: show UNA's own add form for this parent.
                        setBusy(true);
                        try {
                            const formPayload = await coursesApi.structureAdd(outline.courseId, parentNodeId);
                            const d = Array.isArray(formPayload) ? formPayload[0] : formPayload;
                            if (d?.type === 'form') {
                                setAddNodeBlock({ id: d.id, type: d.type, content: d.data });
                                setAddNodeTitle(title || '');
                            } else if (typeof d === 'string' && d.includes('Access denied')) {
                                setNotice('Access denied - check your author rights for this course.');
                            }
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

            {/* UNA's own "add module/theme/lesson" form, refreshed on close */}
            <Modal
                isOpen={addNodeBlock !== null}
                onClose={() => {
                    setAddNodeBlock(null);
                    refreshOutline(outline.courseId);
                }}
                title={`Add to outline${addNodeTitle ? ` — ${addNodeTitle}` : ''}`}
                description="UNA's add form: submit here and the node joins the course."
                size="lg"
            >
                {addNodeBlock && <BlockByData data={addNodeBlock} contentOnly={false} />}
            </Modal>

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
