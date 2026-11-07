'use client'

/**
 * Web L2 element for the `module_structure` block (themes/lessons of a parent).
 * Kit-styled lesson rows; deep-links to the designed lesson page (no modal),
 * matching the full-page takeover experience.
 */
import { useEffect, useState } from 'react';
import { normalizeL2 } from '../api';
import type { OutlineItem } from '../types';
import type { ModuleAppProps } from './module-app.types';

export default function ModuleApp(props: ModuleAppProps) {
    const direct = props.data?.items;
    const [items, setItems] = useState<OutlineItem[]>(
        Array.isArray(direct) ? (direct as unknown as OutlineItem[]) : []
    );

    useEffect(() => {
        if (Array.isArray(props.data?.items) && (props.data?.items as unknown[]).length) return;
        let cancelled = false;
        (async () => {
            const slug = pageSlugOf(props);
            const computed = normalizeL2(
                Number(props.data?.entry_id ?? 0),
                Number(props.data?.parent_id ?? 0),
                props.data,
                slug
            );
            if (cancelled) return;
            setItems(computed);
        })();
        return () => {
            cancelled = true;
        };
    }, [props.data, props.url, props.uri]);

    if (!items.length) return null;
    return <LessonRows items={withLessonLinks(items, pageSlugOf(props))} />;
}

function pageSlugOf(props: ModuleAppProps): string {
    const raw = props?.url ?? (typeof window !== 'undefined' ? window.location.pathname : '') ?? '';
    const match = /view-course-profile\/([^/?#]+)/.exec(raw);
    return match?.[1] ?? '';
}

function withLessonLinks(items: OutlineItem[], slug: string): OutlineItem[] {
    return items.map((item) => ({
        ...item,
        url: item.url || (slug ? `/view-course-profile-node/${slug}?node_id=${item.nodeId}` : '')
    }));
}

function LessonRows({ items }: { items: OutlineItem[] }) {
    return (
        <div className="space-y-2">
            {items.map((item) => (
                <div
                    key={item.nodeId}
                    onClick={() => item.url && window.location.assign(item.url)}
                    className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/40 cursor-pointer select-none transition-all"
                >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-medium">
                            {item.order || '•'}
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</span>
                    </div>
                    {item.progress && (
                        <span className="font-mono tabular-nums text-xs text-slate-500">{item.progress.percent}%</span>
                    )}
                </div>
            ))}
        </div>
    );
}
