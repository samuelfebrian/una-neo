import { UNA_URL, UNA_API_KEY } from 'app/config';
import { headers } from "next/headers";
import { resolveRequestTenant } from '../../../lib/request-tenant';

type RouteProps = {
    params: Promise<{ path?: string[] }>;
};

/**
 * UNA storage file passthrough (`/s/...`).
 *
 * UNA computes public storage URLs against its own site URL, and pages link
 * them directly; on this fork the browser reaches UNA's storage same-origin.
 * The service data stays UNA's, and a Studio icon change goes live without
 * touching the bundle.
 */
export async function GET(request: Request, props: RouteProps): Promise<Response> {
    const params = await props.params;
    const rest = (params.path ?? []).join('/');
    const search = new URL(request.url).search;

    const hdrs = await headers();
    const cookie = hdrs.get('cookie') || '';
    const tenant = await resolveRequestTenant(hdrs.get('host'));

    const base = (tenant?.unaUrl ?? UNA_URL).replace(/\/+$/, '');
    const target = `${base}/s/${rest}${search}`;

    try {
        const res = await fetch(target, {
            headers: {
                cookie,
                authorization: 'Bearer ' + (tenant?.unaApiKey ?? UNA_API_KEY),
                'x-neo-platform': 'web',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            // UNA returned 404/403 etc: mirror the status without the body.
            return new Response(null, { status: res.status });
        }

        // Not viewer-specific content; UNA serves the file back to anyone
        // who has the bare URL, so browser caching is safe here too.
        const outHeaders: Record<string, string> = {
            'content-type': res.headers.get('content-type') || 'application/octet-stream',
            'cache-control': 'public, max-age=604800',
        };
        const disposition = res.headers.get('content-disposition');
        if (disposition) outHeaders['content-disposition'] = disposition;

        return new Response(res.body, { status: res.status, headers: outHeaders });
    } catch {
        return new Response(null, { status: 502 });
    }
}

export async function HEAD(request: Request, props: RouteProps): Promise<Response> {
    const res = await GET(request, props);
    return new Response(null, { status: res.status, headers: res.headers });
}
