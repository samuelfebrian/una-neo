/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The kit's own outline/lesson authoring surfaces were removed from this page:
 * UNA's own `edit-course-content/<entry-slug>-<page>` page is the authoring UI
 * (its structure grid and per-lesson step grid are UNA's native tools with the
 * working drag handles and context dialogs). This component renders exactly the
 * page's own UNA blocks.
 *
 * The kit-built plain-slug route (`edit-course-content/<course-slug>`) renders no
 * UNA blocks, so the page canonicalizes once to the URL UNA itself returns.
 */

import { useEffect, useState } from 'react';
import { BlockByData } from 'app/components/block';
import { coursesApi } from '../api';

type Block = any;

function unaBlocks(data: any): Block[] {
    const out: Block[] = [];
    for (const cell of Object.keys(data?.elements ?? {})) {
        out.push(...(((data?.elements as any)?.[cell] ?? []) as Block[]));
    }
    return out;
}

export default function OutlineEditorPageApp({ data }: { data: any }) {
    const [blockList, setBlockList] = useState<Block[]>([]);
    const [notice, setNotice] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setBlockList(unaBlocks(data));

            // The kit-built plain-slug route renders no UNA blocks (UNA's turquoise
            // 404), so canonicalize from the author's own course list — UNA's own
            // page (slug + page suffix) is the single authoring page.
            const currentPath = window.location.pathname;
            const match = /edit-course-content\/([^/?#]+)/.exec(currentPath);
            const slug = match?.[1] ?? '';
            let canonical: string | null = null;
            try {
                const joined = await coursesApi.browse('joined', 0, 50, false);
                if (slug) {
                    const course = joined.find((c) => (c.url || '').includes(`/${slug}`));
                    if (course?.id) canonical = await coursesApi.courseEditUrl(course.id);
                }
                // entry slug might differ from the requested one; fall back to the
                // author's single course when only one entry exists.
                if (!canonical && !slug && joined.length === 1 && joined[0]?.id)
                    canonical = await coursesApi.courseEditUrl(joined[0].id);
            } catch (e) {
                console.warn('canonical edit url lookup failed', e);
            }
            const canonicalPath = canonical?.startsWith('/') ? canonical : canonical ? `/${canonical}` : '';
            if (canonicalPath && canonicalPath !== currentPath && !currentPath.startsWith(canonicalPath)) {
                window.location.replace(canonicalPath);
                return;
            }
         })();
        return () => {
            cancelled = true;
        };
    }, [data]);

    return (
        <div className="space-y-4">
            {notice && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
                    {notice} Sign in as the course author to open the editing forms.
                </div>
            )}

            {blockList.map((block) => (
                <OutlineBlockEmbed key={String(block.id)} block={block} />
            ))}
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
