import PageLayoutDefault from 'app/components/page-layout/default';
import PageUniversal from 'app/components/page-layout/universal';
import FallbackNavigator from 'app/components/page-layout/navigator';
import FallbackProfile from 'app/components/page-layout/profile';

import type { CourseLayoutProps } from './course-page.types';

/**
 * Native fallback: web does the course takeover; native keeps the stock layouts
 * (the course/lesson/module elements still render inside the stock layout).
 */
export default function CoursePageLayout(props: CourseLayoutProps) {
    const p = props as any;
    if (p.layoutName === 'navigator') return <FallbackNavigator {...p} />;
    if (p.layoutName === 'profile') return <FallbackProfile {...p} />;
    if (p.layoutName === 'layout_topbottom_area_bar_right' || p.layoutName === 'layout_top_area_bar_right') {
        return <PageUniversal {...p} />;
    }
    return <PageLayoutDefault {...p} />;
}
