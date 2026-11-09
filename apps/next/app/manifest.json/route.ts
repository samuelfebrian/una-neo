import { UNA_URL, UNA_API_KEY } from 'app/config';
import { headers } from "next/headers";
import { resolveRequestTenant } from '../../lib/request-tenant';

/**
 * UNA site manifest passthrough (`manifest.json.php`).
 *
 * UNA builds the PWA manifest from Studio's Designer → Icon settings
 * (sys_site_icon_apple, sys_site_icon_android) and the site name, so the apps
 * pick up Studio changes without new bundles.
 */
async function manifestResponse(request: Request): Promise<Response> {
    const search = new URL(request.url).search;
    const hdrs = await headers();
    const cookie = hdrs.get('cookie') || '';
    const tenant = await resolveRequestTenant(hdrs.get('host'));

    const base = (tenant?.unaUrl ?? UNA_URL).replace(/\/+$/, '');
    const target = `${base}/manifest.json.php${search}`;

    try {
        const res = await fetch(target, {
            headers: {
                cookie,
                authorization: 'Bearer ' + (tenant?.unaApiKey ?? UNA_API_KEY),
                'x-neo-platform': 'web',
            },
            cache: 'no-store',
        });

        if (!res.ok)
            return new Response(null, { status: res.status });

        return new Response(res.body, {
            status: res.status,
            headers: {
                'content-type': res.headers.get('content-type') || 'application/manifest+json',
                'cache-control': 'no-store',
            },
        });
    } catch {
        return new Response(null, { status: 502 });
    }
}

export async function GET(request: Request): Promise<Response> {
    return manifestResponse(request);
}

export async function HEAD(request: Request): Promise<Response> {
    const res = await manifestResponse(request);
    return new Response(null, { status: res.status, headers: res.headers });
}
