/** Shared props for the course page-layout platform pair + helpers. */

export interface CourseLayoutProps {
    /** Next.js page layout props as passed by Root (see components/page-layout/_map.js). */
    children?: React.ReactNode;
    data?: any;
    layoutName?: string;
    pageClasses?: Record<string, string>;
    [key: string]: unknown;
}

export type ScreenUri =
    | 'courses-home'
    | 'courses-search'
    | 'courses-joined'
    | 'courses-administration'
    | 'create-course-profile'
    | 'edit-course-content'
    | 'course-profile-info'
    | 'course-fans'
    | 'view-course-profile'
    | 'view-course-profile-node';

/** First path segment of the page URL (`view-course-profile/game-dev-hack` -> first part). */
export function pageUriSlug(url?: string): string {
    const raw = url || (typeof window !== 'undefined' ? window.location.pathname : '') || '';
    return raw.replace(/^\//, '').split('/')[0] ?? '';
}
