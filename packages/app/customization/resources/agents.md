# Agent notes for this project

This file belongs to the fork. Agents read it together with the NEO root [`AGENTS.md`](../../../../AGENTS.md), which covers NEO itself, the rules for forks and every customization seam. Claude Code loads it automatically through the root `CLAUDE.md`; other agents must be told to read it.

Upstream NEO keeps this file as an empty template so that syncing a fork never conflicts. In a fork, write the project's notes under "Per-project additions": the client's UNA URL and modules, deployment, branding, team rules.

---

## Per-project additions

_Add content below this line. Examples: customer UNA URL patterns, feature flags, module-specific API notes, or conventions that do not belong in the shared root doc._
### Courses UI project (2026-11)

- Redesigned course screens live in `customization/courses/`: kit (`primitives/`, `screens/`, `units/`, `types/`), UNA adapter `api.ts`, block element wrappers in `apps/` (web kit + native fallback, platform pairs with `course-app.types.ts` / `lesson-app.types.ts`).
- Registered keys in `customization/elements/_map.js`: `course_structure` -> `courses/apps/course-app`, `lesson_structure` -> `courses/apps/lesson-app` (upstream had no `lesson_structure`, lesson pages rendered blank). `module_structure` and `edit_course_content` intentionally still use upstream core for now.
- Verified UNA endpoints (labs.genply.com, content id 1 / profile id 4 sample course): `system/get_page_by_request/TemplServicePages&params[]=<path without slashes>`; `bx_courses/get_content_info_by_profile_id/&params[]=<profileId>` resolves the content row; `bx_courses/entity_structure_l1_block|entity_structure_l2_block|entity_node_block`; `bx_courses/pass_data` / `pass_node`; authoring grids `system/perfom_action_api/TemplServiceGrid` with `o=bx_courses_cnt_structure_manage|bx_courses_cnt_data_manage`.
- L2 payload quirk (level-max=3): the payload is an inputs OBJECT keyed `node_<id>` (`attrs.id` + `caption`, sometimes `subnodes`); `api.ts normalizeL2()` handles both shapes. Do not rely on page-level lesson blocks for course context; resolve content id from the page JSON (`cover_block.profile.id` + `get_content_info_by_profile_id`).
- Icons must go through `app/ui/atoms/icon` (`Icon icon="LucideName"`) - never import `lucide-react` (not installed). `IconSlot.tsx` maps the kit's icon keys to Lucide names for that.
- Temporary design mockup lives at repo-root `mockup/` (gitignored); remove it once all screens are ported.
- Gates used for this phase: `node scripts/typecheck.js` (passed web+native) and eslint over `customization/courses/**` (0 errors).

### Full page takeover (2026-11, user decision)

- `customization/page-layout/_map.js` routes `layout_1_column`, `layout_topbottom_area_bar_right`, `layout_top_area_bar_right` through `customization/courses/apps/course-page-layout` (platform pair: native stays stock). The router switches on the page `uri` and renders the kit screen; any other URI falls back to the stock layout component.
- Takeover URIs: `view-course-profile`, `view-course-profile-node`, `edit-course-content`, `course-profile-info`, `course-fans`, `courses-home`, `courses-search`, `courses-joined`, `courses-administration`, `create-course-profile`, `join-course-profile` (all verified live on UNA as `params[]=<uri-no-slash>`, page JSON `data.uri`).
- NEVER delete UNA blocks: UNA blocks are embedded into the kit design via `BlockByData` (`app/components/block`) inside KitPanels (search filters, fans grids, create/info forms, admin/joined grids, leftover blocks on the course view). The cover + conductor chrome is outside the layout seam and untouched.
- Course join = UNA page takeover (`/join-course-profile/<slug>`), not a direct service POST.
- Browse payload shape: `bx_courses/browse/&params[]={"type":"recent","start":0,"per_page":24}` (JSON in first params[]); items map via `summaryFromBrowseItem`. Page rail blocks carry the same payload (`data.data` array + `request_url`).

### Mockup→UNA mapping round 2 (2026-11-07)

- Rule set (locked by user): UNA header/menus/footer are UNA's own, never replaced; content of courses URIs is the mockup kit 100%; UNA features are kept and re-dressed (nothing removed); a kit element with no UNA source renders nothing (no mock data anywhere).
- Browse types verified live: `recent`, `top`, `joined` (member's enrolled), `created` (member's authored) via `bx_courses/browse`.
- Content data grid (steps/attachments per lesson) verified live: `system/perfom_action_api/TemplServiceGrid&o=bx_courses_cnt_data_manage&a=display&entry_id=<contentId>&parent_id=<lessonNodeId>` (`entity_content_data_block` returns empty, grid works).
- Course page: cover mapped from page `cover_block.cover` (+ `cover_data` x/y percent → focus 0..1); `visibility` from `allow_view_to` (3 = public); Resources tab aggregates real lesson attachments lazily (fetches `nodeBlock` per unlocked lesson on first open; kit EmptyState when none — live course currently has none, NOT fake files); enrolled progress aggregates level-3 `progress` from the outline fetched under the member's own session.
- Course tabs switch in kit state (no full reload); deep links land on Overview.
- UNA leftover blocks on the course view are embedded in-kit: timeline/comment sources → Discussions tab slot; everything else → About tab slot (`aboutSlot`/`discussionsSlot` props on CoursePage) — nothing removed.
- Catalog/MyCourses/Administration are kit screens (BrowseCourses/MyCourses/AdminCourses) fed by real UNA browse data; leftover UNA blocks stay embedded in kit panels below; fake default categories/tags removed (derived from real courses).
- AboutPanel never invents rows anymore: no fake headline/spec fallbacks; serialized location (`a:N:{...}`) is omitted; instructor card renders only with real author data.
- Authoring (T13) is still stubbed pending author-session verification: UNA `TemplServiceGrid&a=add` returns "Access denied" for the API-key account; kit shows a notice instead of silently logging. Verify with a real author login before wiring the form UI.
- Deferred: kit `CourseCard` for `bx_courses` rails outside courses URIs (would require editing upstream `components/elements/browse*` — forbidden seam) — needs a customization-side unit override or upstream approval.
- Evidence screenshots: `docs/courses/proof/` (t0-*, t1-*, t6-*, t7-catalog, t8-joined, t12-admin=UNA 403 gate for anonymous, f-about, f2-about, f2-lesson).

### Join flow fix (2026-11-07, user-verified requirement)

- UNA retires the `join-course-profile` page (page_status 404, empty elements) once the member has joined, so re-opening that URL 404s — the server `apps/next/app/[...path]/page.tsx` calls `notFound()` before any layout.
- Fix 1 (kit): `CourseViewPage` resolves the member's UNA `browse/joined` every load and sets `course.enrolled`; the hero then renders the enrolled variant (Continue Learning / Start Course) instead of Join Flow, so a joined member is never sent back to the join page.
- Fix 2 (404 landing): `apps/next/app/not-found-client.js` renders a join-complete landing for any `join-course-profile/*` 404: a `custom` element block (arbitrary HTML holder) inside a synthetic `layout_1_column` page payload passed to `Root` — UNA chrome stays intact. Note: `Root` forces `page_status=404` when `code==404`, and `Layouts` renders its static ErrorPage for it, so the synthetic payload must carry `code/page_status 200` (client-only view; listing/SEO unaffected).
- Files touched outside `customization/**` for this: `apps/next/app/not-found-client.js` only (additive join branch + links, no logic changes).

### Membership consistency + speed (2026-11-07, follow-up)

- UNA membership is the single source of truth for Join vs Continue on every kit surface: `api.ts getJoinedContentIds()` (UNA `browse/joined`, 30s TTL cache) stamps `enrolled` into every `browse()` summary; `CourseViewPage` force-refreshes it so a page load can show no stale Continue/Join state.
- The course hero CTA is tri-state: `enrolled === undefined` renders a skeleton (no Join→Continue flicker); values true/false render the enrolled/not-enrolled variants (`Course.enrolled` is the contract, `CoursePage` hero).
- `fullOutline` fetches all module/theme/lesson lists in parallel (was sequential per level — the course sidebar wait went from seconds to ~0.6s).
- Hub categories now derive from real UNA course categories (mockup-default category lists removed from hub/catalog paths; `CreateCourseWizard`/`CourseSettingsForm` are unused/awaiting UNA form wiring).
- The 4-5s join "Confirmation page then course" flash is UNA's native join confirmation step (the takeover routes Join to UNA's own join action page; no kit bypass was added).

### Discussions + home takeover + nav (2026-11-07, user dir)

- Discussions wired to UNA's native comments widget: `bx_courses/entity_comments/&params[]=<CONTENT id>` (NOT profile id — content id drives it) returns a UNA block `{url, type:'comments', browse}`; the kit embeds it via BlockByData (`custom`-style content item) inside the Discussions tab slot; the widget posts/replies/votes through UNA's own endpoints under the member session. Kit's CommentThread is hidden (`guidelinesOnly`) while the UNA widget is present — no duplicate empty states.
- Site root is the designed hub: UNA `sys_home` page object now carries the course-home service blocks + `bx_courses_submenu` (Studio-equivalent DB copy); `page-layout/_map.js` also routes layout key `home` through the takeover; `COURSE_URIS` includes `home`. Guests additionally see UNA's own login/create-account blocks embedded in a hub panel.
- Header nav is UNA-driven (`sys_site`): Courses/Catalog/My Learning rows required `active_api=1` to appear (UNA hides menu items with `active_api=0` from the served menu); Studio's "Available via API" toggle is the same field. About/Posts/Videos are inactive per user choice.
- Pricing skipped by user decision: gate courses with UNA ACL levels (Studio) instead of buying/joining via payment; `entity_pricing` service exists and returns "no payment module" until a payment module is installed — kit renders nothing rather than fake plans.
- Market module is NOT used for the catalog: it is a product-shop module without course membership semantics; catalog stays on `bx_courses/browse`.
