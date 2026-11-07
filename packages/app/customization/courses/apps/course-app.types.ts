import type { Course, Outline as OutlineType, NodeId } from '../types';

/** Props shared by the platform pair (native base file + web replacement). */
export interface CourseAppProps {
    /** Block payload of the `course_structure` element (items, isEditable, entry_id). */
    data: {
        entry_id?: number;
        isEditable?: boolean;
        items?: Record<string, unknown>[];
    };
    /** Page-level props spread by the block renderer. */
    uri?: string;
    url?: string;
}

/** Page URL helpers shared by the wrappers. */
export function pageSlug(url?: string): string {
    const raw = url || (typeof window !== 'undefined' ? window.location.pathname : '') || '';
    const match = /view-course-profile(?:-node)?\/([^/?#]+)/.exec(raw);
    return match?.[1] ?? '';
}

export async function resolveContext(
    props: { url?: string; uri?: string } | CourseAppProps,
    opts: { full: boolean }
): Promise<{ courseId: number; profileId: number; slug: string; outline: OutlineType | null; course: Course | null; isEditable: boolean }> {
    // imported lazily to avoid cycles in the module graph
    const { coursesApi } = await import('../api');

    const slug = pageSlug((props as any)?.url);
    const page = await coursesApi.getPage((props as any)?.url || '');
    const elements = page?.elements ?? {};
    let courseData: any = null;
    let isEditable = false;
    let contentIdFromOutline = 0;
    for (const cell of Object.keys(elements)) {
        for (const block of elements[cell] ?? []) {
            const content = block?.content?.[0];
            const payload = content?.data;
            if (content?.type === 'course_structure' && payload) {
                contentIdFromOutline = contentIdFromOutline || Number(payload?.entry_id ?? 0);
                isEditable = isEditable || !!payload?.isEditable;
            }
            if (!courseData && payload?.profile_id && payload?.id) courseData = payload;
        }
    }
    const contentId = contentIdFromOutline || courseData?.id || 0;
    const profileId = Number(page?.cover_block?.profile?.id ?? courseData?.profile_id ?? 0);
    const course = courseData ? coursesApi.courseFromContentInfo(courseData, slug) : null;
    if (course) {
        course.slug = slug || course.url.replace('/view-course-profile/', '');
        course.url = slug ? `/view-course-profile/${slug}` : course.url;
        course.isOwnerOrAdmin = isEditable;
        course.canEdit = isEditable;
    }
    let outline: OutlineType | null = null;
    if (opts.full && contentId) {
        outline = await coursesApi.fullOutline(contentId, slug, isEditable);
    }
    return { courseId: contentId, profileId, slug, outline, course, isEditable };
}

export type { Course, OutlineType, NodeId };
