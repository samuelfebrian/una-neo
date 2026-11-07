import type { NodeId } from '../types';

/** Props shared by the lesson element platform pair (native base + .web kit player). */
export interface LessonAppProps {
    /** Block payload of the `lesson_structure` element: one node's steps/attachments. */
    data: {
        index?: number;
        sample?: string;
        title?: string;
        text?: string;
        passing?: 0 | 1;
        steps?: Record<string, unknown>[];
        attachments?: Record<string, unknown>[];
    };
    /** Page-level props spread by the block renderer. */
    uri?: string;
    url?: string;
}

/** node_id from the page URL (?node_id=...), shared by native and web wrappers. */
export function pageNodeId(url?: string): NodeId | null {
    const raw = url || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '');
    const match = /[?&]node_id=(\d+)/.exec(raw);
    return match ? Number(match[1]) : null;
}
