import { componentsMapDefault } from 'app/components/elements/_map';

// Courses UI (customization/courses): redesigned block renderers.
// - `course_structure`: kit-designed curriculum over the real L1/L2/L3 services.
// - `lesson_structure`: full designed lesson player (unregistered upstream, which is
//   why direct lesson URLs rendered blank).
// - `module_structure`: kit-styled theme/lesson rows instead of the old modal flow.
// Platform pairs: native base files render fallbacks; the .web files carry the kit.
import CourseApp from 'app/customization/courses/apps/course-app';
import LessonApp from 'app/customization/courses/apps/lesson-app';
import ModuleApp from 'app/customization/courses/apps/module-app';

componentsMapDefault['course_structure'] = CourseApp;
componentsMapDefault['lesson_structure'] = LessonApp;
componentsMapDefault['module_structure'] = ModuleApp;

export const componentsMap = componentsMapDefault
