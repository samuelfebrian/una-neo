# Courses UI/UX Build (`final-ui`)

Complete, modular, production-grade Courses UI/UX system built with React, TypeScript, and Tailwind CSS v4.

## 1. Directory Structure

- **`types/index.ts`**: Pure TypeScript contracts (§3 Data model & §4 Callbacks contract).
- **`tokens/`**:
  - `tailwind-recipes.md`: Class recipes and semantic tokens.
  - `copy.en.md`: English copy catalog covering 100% of visible UI strings.
  - `i18n.ts`: Copy resolver provider `t('key', params?)`.
- **`primitives/`**:
  - `Badge.tsx`, `ProgressRing.tsx`, `ProgressBar.tsx`, `Avatar.tsx`, `Chip.tsx`
  - `Button.tsx`, `IconButton.tsx`, `Tabs.tsx`, `Accordion.tsx`, `Modal.tsx`
  - `Tooltip.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ErrorRetry.tsx`, `Locked.tsx`
  - `Breadcrumbs.tsx`, `RichText.tsx`, `Ratings.tsx`, `Reactions.tsx`, `CommentThread.tsx`
  - `ImageWithFallback.tsx`, `VideoPlayer.tsx`, `FileRow.tsx`, `DateAgo.tsx`, `TreeView.tsx`
  - `DragList.tsx`, `FormRenderer.tsx`, `GridRenderer.tsx`, `IconSlot.tsx`
- **`units/`**:
  - `CourseCard.tsx`: Primary atom (grid, list, compact rail layouts).
  - `CourseList.tsx`: Responsive list/grid orchestrator with loading and empty states.
- **`screens/`**:
  - `CoursesHub.tsx` (`/courses-home`)
  - `BrowseCourses.tsx` (`/courses-top`, `/courses-search`)
  - `CoursePage.tsx` (`/view-course-profile/<slug>`)
  - `LessonPlayer.tsx` (`/view-course-profile-node/<slug>?node_id=<id>`)
  - `JoinFlow.tsx` (Free join / Paid plans / Pending / Invitations)
  - `PricingPanel.tsx` (Learner pricing plans)
  - `StudentsPanel.tsx` (Members directory & roles)
  - `DiscussionsPanel.tsx` (Course & lesson discussions)
  - `AboutPanel.tsx` (Detailed course specs)
  - `ManagePanel.tsx` (Owner dashboard & publish verification checklist)
  - `CreateCourseWizard.tsx` (6-step creation flow)
  - `CourseSettingsForm.tsx` (Settings & artwork)
  - `OutlineEditor.tsx` (Curriculum hierarchy authoring)
  - `LessonEditor.tsx` (Lesson steps & attachments authoring)
  - `MyCourses.tsx` (Attended & created tracks)
  - `AdminCourses.tsx` (Platform moderation grid)
  - `NotificationsFeed.tsx` (Course activity stream)
  - `AgentEntry.tsx` (Contextual AI assistant touchpoint)

## 2. Integration Notes for Host
- **Zero Routing Dependency**: All transitions occur via callbacks (`onOpenCourse`, `onOpenLesson`, `onNavigateTab`, `onSearch`).
- **Zero Data Fetching**: Data is passed as props; all mutations emit callbacks.
- **Icon Slot**: Host can inject custom SVG icon renderers via `iconSlot?: (name: string, className?: string) => React.ReactNode`.
- **Theme Support**: Fully dark/light responsive using Tailwind v4 `@custom-variant dark`.
