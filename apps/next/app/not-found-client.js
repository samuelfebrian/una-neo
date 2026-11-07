'use client'

import Root from 'app/root-client'
import { Loading } from 'app/customization/loading'
import { appSetting } from 'app/config'
import { useFetch } from 'app/lib/hooks/use-fetch'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'

const SITE_TITLE = appSetting('config', 'title')
const HOME_PAGE_URL = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home'

// Guest-safe 404 payload for when the backend is unreachable.
const FALLBACK_DATA = {
    title: SITE_TITLE,
    description: SITE_TITLE,
    uri: 'home',
    url: '/',
    page_name: 'home',
    page_type: 'home',
    logged: 0,
    blocks: {},
    page_status: 404,
}

/**
 * UNA retires the join page (page_status 404) once the member has joined, so
 * that URL 404s on re-open. Design a real landing state for it instead of the
 * bare not-found: the member is already in the course. The card renders as a
 * UNA block (`custom` element) inside the real page chrome (header/footer),
 * via a synthetic `layout_1_column` page payload.
 */
function joinCompleteBlockHtml(pathname) {
    const slug = /join-course-profile\/([^/?#]+)/.exec(pathname || '')?.[1] ?? ''
    const courseHref = slug ? `/view-course-profile/${encodeURIComponent(slug)}` : '/courses-search'
    return `
<div class="max-w-2xl mx-auto px-4 py-20">
  <div class="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-8 text-center shadow-xs space-y-4">
    <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100" style="color:#0f172a">Access granted</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400" style="color:#64748b">This join page is retired once you are in the course. Continue learning instead.</p>
    <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
      <a class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors" style="color:#fff" href="${courseHref}">Continue Course</a>
      <a class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" style="color:#334155" href="/courses-search">Browse Tracks</a>
    </div>
  </div>
</div>`
}

function JoinCourseNotFoundData(pathname, homeData) {
    const base = homeData ?? FALLBACK_DATA
    return {
        ...base,
        title: 'Access granted',
        description: 'UNA join-complete landing',
        uri: 'join-course-complete',
        url: pathname,
        page_name: 'Access granted',
        page_type: '',
        logged: 1,
        // Layouts renders its static ErrorPage for any page_status 404/403; this
        // client-only landing wants the real layout, not the error shell.
        page_status: 200,
        cover_block: '',
        menu: undefined,
        elements: {
            cell_center: [
                {
                    id: 0,
                    source: 'system:join_complete',
                    designbox_id: 1,
                    content: [
                        {
                            type: 'custom',
                            data: { content: joinCompleteBlockHtml(pathname) }
                        }
                    ]
                }
            ]
        }
    }
}

/**
 * 404 page with the home page chrome (header, menus). The home data is loaded
 * here, on the client, only when a 404 is actually shown: Next puts the root
 * `not-found` into the RSC payload of every page, so a server-side fetch in
 * not-found.js ran against UNA on every request and doubled the page payload.
 */
export default function NotFoundClient() {
    const { data: response, isLoading } = useFetch(HOME_PAGE_URL)
    const { t } = useTranslation()
    const pathname = usePathname()

    if (isLoading) {
        return <Loading />
    }

    if (pathname?.includes('join-course-profile')) {
        const data = JoinCourseNotFoundData(pathname, response?.data)
        return <Root path={'join-course-complete'} data={data} uri={data.uri} url={data.url} code={200} />
    }

    // The home page's chrome, but not its title: the layout writes `title` into the tab.
    const data = { ...(response?.data ?? FALLBACK_DATA), page_status: 404, title: t('Page not found') }

    return <Root path={'home'} data={data} uri={data.uri} url={data.url} code={404} />
}
