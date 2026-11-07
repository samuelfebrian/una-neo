import type { OutlineItem } from '../types';

/** Props shared by the module element platform pair (native base + .web kit view). */
export interface ModuleAppProps {
    data: {
        entry_id?: number;
        parent_id?: number;
        isEditable?: boolean;
        items?: Record<string, unknown>[];
    };
    uri?: string;
    url?: string;
}

/** kit outline items for a module/theme payload (reuses the api normalizer). */
export function moduleItems(payload: unknown, courseId: number, parentId: number, slug: string): OutlineItem[] {
    // lazy import to avoid cycles
    const { normalizeL2 } = require('../api') as { normalizeL2: Function };
    return normalizeL2(courseId, parentId, payload, slug) as OutlineItem[];
}
