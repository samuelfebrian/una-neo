import { componentsMapDefault } from 'app/components/page-layout/_map';
// example how to add custom components
//import PageCustomHome from 'app/components/page-layout/home';
//componentsMapDefault['custom_home'] = PageCustomHome;

// Courses full-page takeover: courses-module pages all render page menus, so
// getLayoutName() returns 'navigator' for them - route the 'navigator' key (and
// the layouts used by the pages without menus) through the takeover, which
// delegates back to the stock layout for every non-course page.
import CoursePageLayout from 'app/customization/courses/apps/course-page-layout';

componentsMapDefault['navigator'] = CoursePageLayout;
componentsMapDefault['profile'] = CoursePageLayout;
componentsMapDefault['layout_1_column'] = CoursePageLayout;
componentsMapDefault['layout_topbottom_area_bar_right'] = CoursePageLayout;
componentsMapDefault['layout_top_area_bar_right'] = CoursePageLayout;
// UNA's root entry page (uri 'home') resolves layout 'home'; the takeover routes
// it to the designed hub and keeps UNA's login/create blocks embedded.
componentsMapDefault['home'] = CoursePageLayout;

export const componentsMap = componentsMapDefault
