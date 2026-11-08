/**
 * Courses UI - UNA API adapter (client side).
 *
 * Real endpoints (verified live on the site's UNA instance):
 * - system/get_page_by_request/TemplServicePages&params[]=<path>   page JSON for a URL
 * - bx_courses/get_content_info_by_profile_id/&params[]=<profile>  content row for a profile id
 * - bx_courses/entity_structure_l1_block/&params[]=<content>       L1 modules (items + isEditable + entry_id)
 * - bx_courses/entity_structure_l2_block/&params[]=<content>&params[]=<parent>
 *     parent = module -> themes, parent = theme -> lessons.
 *     The payload is either `items` (rich) or an inputs object whose keys are
 *     `node_<id>` block headers (`attrs.id`, `caption`, optional `subnodes`).
 * - bx_courses/entity_node_block/&params[]=<content>&params[]=<node>  lesson steps/attachments
 * - bx_courses/pass_data/&params[]=<dataId>     mark one step
 * - bx_courses/pass_node/&params[]=<nodeId>     pass or reset a lesson (toggle)
 * - system/perfom_action_api/TemplServiceGrid&...bx_courses_cnt_structure_manage / bx_courses_cnt_data_manage
 *     add / edit / delete / reorder authoring ops.
 */

import { fetcher } from 'app/lib/fetcher';

import type {
    Course,
    CourseContentId,
    CourseSummary,
    Outline,
    OutlineItem,
    Lesson,
    Step,
    Progress
} from './types';

type Envelope = { data?: any; status?: number };

const ID_RE = /^node_(\d+)$/;

/** UNA membership cache shared by every surface (Join vs Continue must never disagree). */
const JOINED_TTL = 30_000;
let joinedCache: { ids: Set<number>; ts: number } | null = null;

/** fetcher returns UNA's envelope; module entity services wrap the payload as data[0].data. */
function unwrap(res: Envelope): any {
    const data = res?.data;
    if (Array.isArray(data) && data.length) return data[0]?.data ?? data[0];
    return data;
}

function asStatus(status: unknown): Progress | undefined {
    if (!status || typeof status !== 'object') return undefined;
    const raw = status as { percent?: unknown; status?: unknown };
    if (raw.percent === undefined) return undefined;
    return {
        percent: Number(raw.percent) || 0,
        status: (raw.status as Progress['status']) || 'not started'
    };
}

/** kit url: L1 links exist on items; for synthesized themes/lessons build a permalink. */
function lessonUrl(slug: string, nodeId: number): string {
    return slug ? `/view-course-profile-node/${slug}?node_id=${nodeId}` : `?node_id=${nodeId}`;
}

/**
 * Normalize an L2 block payload.
 * UNA's real shape (module_structure form):
 *   inputs: { node_<themeId>: block_header(caption = theme title),
 *             node_<themeId>_subnodes: { content: [ lesson rows with node_id / parent_id(theme) / title / link / pass_* ] },
 *             ... cs field pairs ... }
 * `headerLevel` says what a bare node_<id> header is: 2 = theme under a module,
 * 3 = lesson under a theme (the theme-level fallback response has no .content).
 * Legacy rich `items` / `.subnodes` shapes are still honored.
 */
export function normalizeL2(
    courseId: number,
    parentNodeId: number,
    payload: any,
    slug: string = '',
    headerLevel: 2 | 3 = 3
): OutlineItem[] {
    if (Array.isArray(payload?.items) && payload.items.length)
        return payload.items.map((raw: any) => ({
            nodeId: raw.node_id !== undefined ? raw.node_id : raw.id,
            parentId: raw.parent_id ?? parentNodeId,
            level: (raw.level ?? 3) as 1 | 2 | 3,
            index: raw.index ?? raw.order ?? 0,
            order: raw.order ?? raw.index ?? 0,
            title: raw.title ?? '',
            textHtml: raw.text,
            passing: raw.passing,
            progress: asStatus(
                raw.pass_status
                    ? { percent: raw.pass_percent, status: raw.pass_status }
                    : raw.progress
            ),
            url: raw.link ?? lessonUrl(slug, raw.node_id !== undefined ? raw.node_id : raw.id),
            selected: !!raw.selected,
            locked: false
        }));

    const items: OutlineItem[] = [];
    const inputs = payload?.inputs;
    if (inputs && typeof inputs === 'object' && !Array.isArray(inputs)) {
        type NodeItem = { nodeId: number; title: string; parentId: number; level: 2 | 3; order: number; locked: boolean; progress?: Progress };
        const headersById = new Map<number, NodeItem>();
        const subnodesById = new Map<number, any[]>();
        let headerIdx = 0;

        for (const key of Object.keys(inputs)) {
            const byId = /^node_(\d+)$/.exec(key);
            const bySub = /^node_(\d+)_subnodes$/.exec(key);
            const input = inputs[key];
            if (byId) {
                // theme header on a module, lesson header on a theme
                const headerNode = Number(byId[1]);
                if (!headersById.has(headerNode)) {
                    headersById.set(headerNode, {
                        nodeId: headerNode,
                        title: input?.caption || String(input?.value ?? ''),
                        parentId: parentNodeId,
                        level: headerLevel,
                        order: ++headerIdx,
                        locked: false
                    });
                }
                if (input?.subnodes && Array.isArray(input.subnodes)) {
                    subnodesById.set(headerNode, input.subnodes);
                }
            } else if (bySub) {
                const themeNode = Number(bySub[1]);
                // lesson rows live on the sibling custom input, in .content
                const rows = Array.isArray(input?.content)
                    ? input.content
                    : Array.isArray(input?.subnodes)
                    ? input.subnodes
                    : [];
                subnodesById.set(themeNode, rows);
            }
        }

        headersById.forEach((header, nodeId) => {
            const rows = subnodesById.get(nodeId);
            if (header.level === 2) items.push(header as unknown as OutlineItem);
            if (Array.isArray(rows) && rows.length) {
                rows.forEach((row: any, index: number) => {
                    const rowNodeId = Number(row.node_id !== undefined ? row.node_id : row.id);
                    items.push({
                        nodeId: rowNodeId,
                        parentId: row.parent_id ?? nodeId,
                        level: 3,
                        index: Number(row.index ?? row.order ?? index + 1),
                        order: Number(row.order ?? row.index ?? index + 1),
                        title: row.title ?? '',
                        textHtml: row.text,
                        passing: row.passing,
                        progress: asStatus(
                            row.pass_status && row.pass_status !== 'undefined'
                                ? { percent: row.pass_percent, status: row.pass_status }
                                : row.progress
                        ),
                        url: row.link ?? lessonUrl(slug, rowNodeId),
                        selected: !!row.selected,
                        locked: false
                    });
                });
            } else if (header.level === 3) {
                // theme-level fallback: the header itself is the lesson
                items.push({
                    nodeId: header.nodeId,
                    parentId: parentNodeId,
                    level: 3,
                    index: 0,
                    order: 0,
                    title: header.title,
                    passing: undefined,
                    progress: undefined,
                    locked: false,
                    url: lessonUrl(slug, header.nodeId)
                });
            }
        });
    }
    return items;
}

const CONTENT_TYPE_BY_SAMPLE: Record<string, string> = {
    class: 'bx_classes',
    post: 'bx_posts',
    video: 'bx_videos',
    poll: 'bx_polls',
    file: 'bx_files',
    photo: 'bx_photos',
    chart: 'bx_charts'
};

function normalizeStep(raw: any, index: number, usage: 0 | 1): Step {
    const contentType = CONTENT_TYPE_BY_SAMPLE[raw?.type] || raw?.type || (usage ? 'bx_files' : 'bx_classes');
    return {
        id: Number(raw?.id ?? index),
        order: Number(raw?.order ?? index + 1),
        usage,
        contentType,
        typeLabel: raw?.type ?? '',
        title: raw?.title ?? '',
        textHtml: raw?.text ?? '',
        image: raw?.image,
        video: raw?.video ? { src: raw.video.src_mp4 || raw.video.src, poster: raw.video.src_poster } : undefined,
        link: raw?.link,
        file: raw?.download_link
            ? { downloadUrl: raw.download_link, name: raw?.title, sizeLabel: raw?.size }
            : undefined,
        passed: isTrue(raw?.passed),
        locked: isLockedStep(raw),
        passTitle: raw?.pass_title,
        options: Array.isArray(raw?.options) ? raw.options.map(String) : undefined
    };
}

function isTrue(v: unknown): boolean {
    return v === true || v === 1 || v === '1';
}

function isLockedStep(raw: any): boolean {
    if (raw?.locked !== undefined) return isTrue(raw.locked);
    return false;
}

function normalizeNodeBlock(raw: any, courseId: number, nodeId: number, slug: string = ''): Lesson {
    const steps = (raw?.steps ?? []).map((s: any, i: number) => normalizeStep(s, i, 0));
    const attachments = (raw?.attachments ?? []).map((s: any, i: number) => normalizeStep(s, i, 1));
    return {
        nodeId,
        courseId,
        index: Number(raw?.index ?? 0),
        title: raw?.title ?? '',
        textHtml: raw?.text ?? '',
        passing: (isTrue(raw?.passing) ? 1 : 0) as 0 | 1,
        progress: { percent: 0, status: 'in process' },
        steps,
        attachments,
        modulePath: slug
            ? ([
                  {
                      nodeId: 0,
                      parentId: 0,
                      level: 1,
                      index: 0,
                      order: 0,
                      title: '',
                      url: slug ? `/view-course-profile/${slug}` : ''
                  }
              ] as OutlineItem[])
            : []
    };
}

/** Client course-api surface used by the wrapper components. */
export const coursesApi = {
    /** Page JSON for a relative path (leading slash optional, must NOT end with a slash). */
    async getPage(path: string): Promise<any | null> {
        const clean = path.replace(/^\//, '').replace(/\/$/, '');
        if (!clean) return null;
        try {
            const res = await fetcher(
                `/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${clean}`
            );
            return res?.data ?? null;
        } catch (e) {
            console.warn('courses api: getPage failed', e);
            return null;
        }
    },

    /** Content row (id, name, ...) for a course profile id. */
    async contentInfoByProfileId(profileId: number): Promise<any | null> {
        try {
            const res = await fetcher(
                `/api.php?r=bx_courses/get_content_info_by_profile_id/&params[]=${profileId}`
            );
            const data = res?.data;
            return data && !Array.isArray(data) ? data : null;
        } catch (e) {
            console.warn('courses api: contentInfoByProfileId failed', e);
            return null;
        }
    },

    async structureL1(courseId: number): Promise<{ items: OutlineItem[]; isEditable: boolean; entryId: number }> {
        const payload = unwrap(
            await fetcher(
                `/api.php?r=bx_courses/entity_structure_l1_block/&params[]=${courseId}`
            )
        );
        const items = ((payload?.items ?? []) as any[]).map((raw) => ({
            nodeId: Number(raw?.node_id ?? raw?.id ?? 0),
            parentId: Number(raw?.parent_id ?? 0),
            level: (raw?.level ?? 1) as 1 | 2 | 3,
            index: Number(raw?.index ?? raw?.order ?? 0),
            order: Number(raw?.order ?? raw?.index ?? 0),
            title: String(raw?.title ?? ''),
            textHtml: raw?.text,
            counters: Array.isArray(raw?.counters)
                ? raw.counters.map((c: any) => ({
                      title: String(c?.cn_title ?? c?.title ?? ''),
                      passed: Number(c?.cn_passed ?? c?.passed ?? 0),
                      total: Number(c?.cn_total ?? c?.total ?? 0),
                      text: String(c?.cn_progress ?? c?.text ?? '')
                  }))
                : undefined,
            progress: asStatus(
                raw?.pass_status
                    ? { percent: raw?.pass_percent, status: raw?.pass_status }
                    : raw?.pass_percent !== undefined
                    ? { percent: raw?.pass_percent, status: raw?.pass_status }
                    : { percent: raw?.percent, status: raw?.status }
            ),
            url: String(raw?.link ?? ''),
            selected: !!raw?.selected,
            locked: false
        })) as OutlineItem[];
        return {
            items,
            isEditable: !!payload?.isEditable,
            entryId: Number(payload?.entry_id ?? payload?.entryId ?? courseId)
        };
    },

    /** L2 items for a parent module (themes + lesson rows) or parent theme (lesson rows). */
    async structureL2(courseId: number, parentId: number, slug = '', headerLevel: 2 | 3 = 2): Promise<OutlineItem[]> {
        try {
            const payload = unwrap(
                await fetcher(
                    `/api.php?r=bx_courses/entity_structure_l2_block/&params[]=${courseId}&params[]=${parentId}`
                )
            );
            return normalizeL2(courseId, parentId, payload, slug, headerLevel);
        } catch (e) {
            console.warn('courses api: structureL2 failed', e);
            return [];
        }
    },

    /** Full outline: L1 modules + each module's themes + each theme's lessons (level-max=3). */
    async fullOutline(courseId: number, slug = '', isEditable = false): Promise<Outline> {
        const l1 = await coursesApi.structureL1(courseId);
        const items: OutlineItem[] = [...l1.items];

        // Module-level L2 already carries every theme AND every lesson row in UNA's
        // module_structure form, so one call per module is the full curriculum.
        // A theme-level call is only the fallback for rows UNA collapsed away.
        const themesByModule = await Promise.all(
            l1.items.map((moduleItem) => coursesApi.structureL2(courseId, moduleItem.nodeId, slug, 2))
        );
        themesByModule.forEach((moduleItems, moduleIdx) => items.push(...moduleItems));

        // Fallback: only themes that came back with NO embedded lesson rows.
        const bareThemeIds = new Set<number>();
        themesByModule.forEach((moduleItems) => {
            const themeNodeIds = moduleItems.filter((item) => item.level === 2).map((item) => item.nodeId);
            const embedded = new Set(
                moduleItems.filter((item) => item.level === 3).map((item) => item.parentId)
            );
            themeNodeIds.forEach((themeNodeId) => {
                if (!embedded.has(themeNodeId)) bareThemeIds.add(themeNodeId);
            });
        });
        const themeNodeIds = [...bareThemeIds];
        const themeLessons = themeNodeIds.length
            ? await Promise.all(
                  themeNodeIds.map((themeNodeId) =>
                      coursesApi.structureL2(courseId, themeNodeId, slug, 3)
                  )
              )
            : [];
        const seenNodeIds = new Set(items.map((item) => item.nodeId));
        themeLessons.forEach((lessonItems) => {
            lessonItems.forEach((lesson) => {
                if (seenNodeIds.has(lesson.nodeId)) return;
                seenNodeIds.add(lesson.nodeId);
                items.push(lesson);
            });
        });

        return {
            courseId,
            isEditable,
            items
        };
    },

    async nodeBlock(courseId: number, nodeId: number, slug = ''): Promise<Lesson | null> {
        try {
            const payload = unwrap(
                await fetcher(
                    `/api.php?r=bx_courses/entity_node_block/&params[]=${courseId}&params[]=${nodeId}`
                )
            );
            if (!payload) return null;
            return normalizeNodeBlock(payload, courseId, nodeId, slug);
        } catch (e) {
            console.warn('courses api: nodeBlock failed', e);
            return null;
        }
    },

    async passData(dataId: number): Promise<void> {
        try {
            await fetcher(`/api.php?r=bx_courses/pass_data/&params[]=${dataId}`);
        } catch (e) {
            console.warn('courses api: passData failed', e);
        }
    },

    async passNode(nodeId: number): Promise<void> {
        try {
            await fetcher(`/api.php?r=bx_courses/pass_node/&params[]=${nodeId}`);
        } catch (e) {
            console.warn('courses api: passNode failed', e);
        }
    },

    /** Authoring: structure (modules/themes/lessons) and data (steps/attachments) grids. */
    async structureAdd(courseId: number, parentId = 0): Promise<any | null> {
        const res = await fetcher(
            `/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_structure_manage&a=add&parent_id=${parentId}&entry_id=${courseId}`
        );
        return res?.data ?? null;
    },
    async structureEdit(courseId: number, parentId: number, nodeId: number): Promise<any | null> {
        const res = await fetcher(
            `/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_structure_manage&a=edit&parent_id=${parentId}&entry_id=${courseId}&id=${nodeId}`
        );
        return res?.data ?? null;
    },
    async structureDelete(courseId: number, parentId: number, nodeId: number): Promise<void> {
        await fetcher(
            `/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_structure_manage&a=delete&parent_id=${parentId}&entry_id=${courseId}&ids[]=${nodeId}`
        );
    },
    async structureReorder(courseId: number, parentId: number, ids: number[]): Promise<void> {
        const rows = ids.map((id) => `bx_courses_cnt_structure_manage_row[]=${id}`).join('&');
        await fetcher(
            `/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_structure_manage&a=reorder&parent_id=${parentId}&entry_id=${courseId}&${rows}`
        );
    },

    /** Steps/attachments authoring grid (bx_courses_cnt_data_manage). */
    async dataManageDisplay(courseId: number, lessonNodeId: number): Promise<any | null> {
        try {
            const res = await fetcher(
                `/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_data_manage&a=display&parent_id=${lessonNodeId}&entry_id=${courseId}`
            );
            return res?.data ?? null;
        } catch (e) {
            console.warn('courses api: dataManageDisplay failed', e);
            return null;
        }
    },
    async dataManageDelete(courseId: number, lessonNodeId: number, dataId: number): Promise<void> {
        await fetcher(
            `/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_data_manage&a=delete&parent_id=${lessonNodeId}&entry_id=${courseId}&ids[]=${dataId}`
        );
    },
    async dataManageReorder(courseId: number, lessonNodeId: number, ids: number[]): Promise<void> {
        const rows = ids.map((id) => `bx_courses_cnt_data_manage_row[]=${id}`).join('&');
        await fetcher(
            `/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=bx_courses_cnt_data_manage&a=reorder&parent_id=${lessonNodeId}&entry_id=${courseId}&${rows}`
        );
    },

    /** Build a kit Course from a UNA content info row. */
    courseFromContentInfo(info: any, slug: string = '', cover?: any): Course {
        const id = Number(info?.id ?? 0);
        const authorData = info?.author_data ?? {};
        const author: Course['author'] = {
            id: Number(info?.author ?? authorData?.id ?? 0),
            name: String(authorData?.display_name ?? ''),
            url: authorData?.url,
            avatarUrl: authorData?.url_avatar
        };
        const coverFocus = (() => {
            try {
                const parsed =
                    typeof info?.cover_data === 'string'
                        ? JSON.parse(info.cover_data)
                        : info?.cover_data;
                const x = Number(parsed?.x);
                const y = Number(parsed?.y);
                if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
                return { x: x / 100, y: y / 100 };
            } catch {
                return undefined;
            }
        })();
        const coverData = cover
            ? {
                  src: String(cover.src ?? ''),
                  width: Number(cover.width) || undefined,
                  height: Number(cover.height) || 0,
                  focus: coverFocus
              }
            : undefined;
        const src: string =
            slug || (info?.uri ? String(info.uri) : '');
        return {
            id,
            profileId: Number(info?.profile_id ?? info?.id ?? 0),
            slug: src,
            url: src ? `/view-course-profile/${src}` : '',
            title: info?.name ?? info?.entry_title ?? '',
            textHtml: info?.entry_text ?? info?.desc ?? '',
            cover: coverData?.src ? coverData : undefined,
            location: info?.location,
            addedTs: info?.added,
            changedTs: info?.changed,
            visibility: Number(info?.allow_view_to) === 3 ? 'public' : 'private',
            status: info?.status ?? 'active',
            membersCount: info?.members,
            views: info?.views,
            rating: { avg: info?.rate ?? 0, votes: info?.votes ?? 0 },
            reactions: { like: undefined },
            commentsCount: info?.comments,
            featured: isTrue(info?.featured),
            author,
            isOwnerOrAdmin: false,
            canEdit: false
        } as Course;
    },

    /** Browse rails: type recent/featured/top/recommended + paging (JSON params form). */
    async browse(type: string = 'recent', start = 0, perPage = 24, withMembership = true): Promise<CourseSummary[]> {
        try {
            const json = JSON.stringify({ type, start, per_page: perPage });
            const res = await fetcher(
                `/api.php?r=bx_courses/browse/&params[]=${encodeURIComponent(json)}`
            );
            const payload = unwrap(res);
            const items = itemsFromListBlock(payload);
            const summaries = items.map(summaryFromBrowseItem);
            if (type === 'joined') return summaries.map((summary) => ({ ...summary, enrolled: true }));
            if (!withMembership) return summaries;
            // UNA membership is the single source of truth for Join/Continue on every surface.
            const ids = await coursesApi.getJoinedContentIds();
            return summaries.map((summary) => ({ ...summary, enrolled: ids.has(summary.id) }));
        } catch (e) {
            console.warn('courses api: browse failed', e);
            return [];
        }
    },

    /**
     * UNA membership set (content ids the signed-in member has joined), cached briefly so
     * hub, catalog, related rails and the course page agree on Join/Continue state.
     */
    async getJoinedContentIds(refresh = false): Promise<Set<CourseContentId>> {
        const now = Date.now();
        if (!refresh && joinedCache && now - joinedCache.ts < JOINED_TTL) return joinedCache.ids;
        try {
            const json = JSON.stringify({ type: 'joined', start: 0, per_page: 50 });
            const res = await fetcher(`/api.php?r=bx_courses/browse/&params[]=${encodeURIComponent(json)}`);
            const payload = unwrap(res);
            joinedCache = { ids: new Set(itemsFromListBlock(payload).map((item) => Number(item.id))), ts: now };
        } catch {
            joinedCache = { ids: new Set(joinedCache?.ids ?? []), ts: now };
        }
        return joinedCache.ids;
    },

    /** Invalidate UNA membership cache after a state change (join, favorite toggle). */
    invalidateJoined(): void {
        joinedCache = null;
    },

    /**
     * UNA's own comments widget for the course content (bx_courses:entity_comments).
     * Returns a UNA block consumable by BlockByData — the widget posts/replies/votes
     * through UNA's own endpoints under the member's session.
     */
    async entityCommentsBlock(profileId: number): Promise<Record<string, unknown> | null> {
        try {
            const res = await fetcher(`/api.php?r=bx_courses/entity_comments/&params[]=${profileId}`);
            const payload = unwrap(res);
            if (!payload || typeof payload !== 'object' || !payload.browse) return null;
            return {
                id: 0,
                source: 'bx_courses:entity_comments',
                content: [payload]
            };
        } catch (e) {
            console.warn('courses api: entity_comments failed', e);
            return null;
        }
    },

    /** Joined summary for the signed-in member (tolerant). */
    async joinedEntriesSummary(): Promise<{ count: number; inProgress: number }> {
        try {
            const res = await fetcher(`/api.php?r=bx_courses/joined_entries_summary/&params[]=`);
            const data = res?.data;
            return {
                count: Number(data?.count ?? 0),
                inProgress: Number(data?.inProgress?.length ?? data?.in_progress ?? 0)
            };
        } catch (e) {
            console.warn('courses api: joinedEntriesSummary failed', e);
            return { count: 0, inProgress: 0 };
        }
    },

    /** UNA's entry edit form block (title/desc/categories/visibility) — the real Course Settings. */
    async entityEditForm(entryId: number, display?: string): Promise<Record<string, unknown> | null> {
        try {
            const extra = display ? `&params[]=${display}` : '';
            const res = await fetcher(`/api.php?r=bx_courses/entity_edit/&params[]=${entryId}${extra}`);
            return entityFormBlock(res, 'entity_edit');
        } catch (e) {
            console.warn('courses api: entityEditForm failed', e);
            return null;
        }
    },

    /** UNA's entry delete form block (UNA-side confirm + cascade rules). */
    async entityDeleteForm(entryId: number): Promise<Record<string, unknown> | null> {
        try {
            const res = await fetcher(`/api.php?r=bx_courses/entity_delete/&params[]=${entryId}`);
            return entityFormBlock(res, 'entity_delete');
        } catch (e) {
            console.warn('courses api: entityDeleteForm failed', e);
            return null;
        }
    },

    /** UNA's members invite form block (owner/admins only, UNA checks roles). */
    async entityInviteForm(entryId: number): Promise<Record<string, unknown> | null> {
        try {
            const res = await fetcher(`/api.php?r=bx_courses/entity_invite/&params[]=${entryId}`);
            return entityFormBlock(res, 'entity_invite');
        } catch (e) {
            console.warn('courses api: entityInviteForm failed', e);
            return null;
        }
    },

    /** Favorites toggle (offline-tolerant). */
    async favorite(courseProfileId: number): Promise<void> {
        try {
            await fetcher(`/api.php?r=bx_courses/set_fav/&params[]=${courseProfileId}`);
        } catch (e) {
            console.warn('courses api: favorite failed', e);
        }
    },

    /** Unpublish to draft: UNA's own servicePublish-equivalent hide (admin action). */
    async hide(entryId: number): Promise<boolean> {
        try {
            await fetcher(`/api.php?r=bx_courses/hide/&params[]=${entryId}`);
            this.invalidateJoined();
            return true;
        } catch (e) {
            console.warn('courses api: hide failed', e);
            return false;
        }
    },

    /** Publish a hidden draft (UNA servicePublish under the hood). */
    async publish(entryId: number): Promise<boolean> {
        try {
            await fetcher(`/api.php?r=bx_courses/publish/&params[]=${entryId}`);
            this.invalidateJoined();
            return true;
        } catch (e) {
            console.warn('courses api: publish failed', e);
            return false;
        }
    },

    /**
     * Join / leave: UNA's shared connections object (bx_courses_fans) exposes no
     * REST services — join/leave are its page actions with the UNA checks for
     * free/paid/questionnaire/invite flows. The kit therefore routes both CTAs to
     * UNA's own join flow page (/join-course-profile) and the original members
     * grid (/course-fans) instead of bypassing those checks.
     */
};

/**
 * Unwrap a UNA API form block response (`entity_edit`, `entity_delete`, ...)
 * into the `{id, type, content}` dict BlockByData renders through the
 * `element:form` registry (submit posts to UNA with the member session).
 */
export function entityFormBlock(res: any, source: string): Record<string, unknown> | null {
    const envelope = res?.data;
    const formEnvelope = Array.isArray(envelope) ? envelope[0] : envelope;
    if (!formEnvelope || !formEnvelope.data) return null;
    // 'msg' = UNA refused (Access denied, already deleted, ...) — surface as failure.
    if (formEnvelope.type === 'msg') return null;
    return {
        id: formEnvelope.id ?? 0,
        type: formEnvelope.type ?? 'form',
        source: `bx_courses:${source}`,
        name: formEnvelope.name,
        form_type: formEnvelope.form_type,
        request: formEnvelope.request,
        content: formEnvelope.data
    };
}

/** Map a UNA browse/search item to the kit CourseSummary. */
export function summaryFromBrowseItem(raw: any): CourseSummary {
    const url: string = raw?.url ?? '';
    return {
        id: Number(raw?.id ?? 0),
        profileId: Number(raw?.author_data?.id ?? 0),
        slug: url.replace(/^\/view-course-profile\//, ''),
        url,
        title: raw?.title ?? raw?.name ?? '',
        category: raw?.cat_title ?? undefined,
        labels: raw?.labels && typeof raw.labels === 'string' ? [raw.labels] : undefined,
        cover: raw?.cover?.src
            ? { src: raw.cover.src, width: raw.cover.width, height: raw.cover.height }
            : undefined,
        author: {
            id: raw?.author ?? 0,
            name: raw?.author_data?.display_name ?? '',
            url: raw?.author_data?.url,
            avatarUrl: raw?.author_data?.url_avatar
        },
        visibility: 'public',
        status: raw?.status ?? 'active',
        membersCount: raw?.members,
        rating: { avg: raw?.rate ?? 0, votes: raw?.votes ?? 0 },
        addedTs: raw?.added,
        changedTs: raw?.changed,
        featured: raw?.featured === 1,
        textHtml: raw?.entry_text ?? raw?.desc
    } as CourseSummary;
}

/**
 * List block aerial wrapper: any UNA list block payload
 * ({ module, unit, request_url, data: [item...] }) groups the item list.
 */
export function itemsFromListBlock(payload: any): any[] {
    const data = payload?.data;
    let items: any[] = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(payload?.items)) items = payload.items;
    // Only course-module items may become course cards — rails for persons/groups/etc. are not ours.
    return items.filter((item) => !item?.module || item.module === 'bx_courses');
}

/** Map a UNA browse/search item to the kit CourseSummary. */

