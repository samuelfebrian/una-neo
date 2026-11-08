'use client'

/**
 * Course takeover router (web).
 *
 * Every UNA page of the courses module renders the designed app for its URI.
 * Nothing is removed: the UNA cover/conductor chrome (rendered outside this
 * layout by Root/Headers) stays, and the page's own UNA blocks are embedded in
 * the design where the kit has no direct equivalent (students tables, search
 * filters, create/info forms, grids).
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter, Link } from 'app/lib/hooks/router';
import { appPath } from './app-path';
import Page from 'app/ui/molecules/page/page';
import PageFooter from 'app/components/nav/menu-footer';
import { BlockByData } from 'app/components/block';
import { Modal } from '../primitives/Modal';
import CoursesHub from '../screens/CoursesHub';
import BrowseCourses from '../screens/BrowseCourses';
import CoursePage from '../screens/CoursePage';
import AboutPanel from '../screens/AboutPanel';
import MyCourses from '../screens/MyCourses';
import AdminCourses from '../screens/AdminCourses';
import LessonApp from './lesson-app.web';
import OutlineEditorPageApp from './outline-editor-page.web';
import { coursesApi, itemsFromListBlock, summaryFromBrowseItem } from '../api';

import type { Attachment, Course, CourseSummary, Member, OutlineItem, Outline } from '../types';
import type { CourseLayoutProps } from './course-page.types';
import PageUniversal from 'app/components/page-layout/universal';
import PageLayoutDefault from 'app/components/page-layout/default';
import FallbackNavigator from 'app/components/page-layout/navigator';
import FallbackProfile from 'app/components/page-layout/profile';
import FallbackHome from 'app/components/page-layout/home';

const COURSE_URIS = new Set<string>([
    'view-course-profile',
    'view-course-profile-closed',
    'view-course-profile-node',
    'edit-course-content',
    'edit-course-profile',
    'edit-course-pricing',
    'invite-to-course',
    'delete-course-profile',
    'course-profile-info',
    'course-profile-comments',
    'course-fans',
    'courses-home',
    'home',
    'courses-search',
    'courses-joined',
    'courses-administration',
    'create-course-profile',
    'join-course-profile'
]);

type Block = Record<string, unknown>;

/* ---------- UNA block embedding helpers ---------- */

function unaBlocksBySource(data: any, match: (source: string) => boolean): Block[] {
    const out: Block[] = [];
    for (const cell of Object.keys(data?.elements ?? {})) {
        for (const block of (data?.elements as any)?.[cell] ?? []) {
            if (match(String(block?.source ?? ''))) out.push(block);
        }
    }
    return out;
}

/** Renders UNA blocks exactly as UNA would (keeps 100% of their features) inside our design. */
function UnaBlocks({ blocks, contentOnly = true }: { blocks: Block[]; contentOnly?: boolean }) {
    if (!blocks.length) return null;
    return (
        <div className="grid gap-4">
            {blocks.map((block) => (
                <div key={String(block.id)}>
                    <BlockByData data={block} contentOnly={contentOnly} />
                </div>
            ))}
        </div>
    );
}

function Frame({ children, onNavigate }: { children: React.ReactNode; onNavigate?: () => void }) {
    return <div className="w-full">{children}</div>;
}

/**
 * UNA's own entry forms (edit/settings, delete) rendered in a kit modal:
 * submit/confirm actions post to UNA under the member session, so every
 * server-side check, redirect and cascade stays 100% UNA.
 */
function UnaEntryFormModal({
    state,
    blocks,
    onClose
}: {
    state: { title: string; description?: string } | null;
    /** null = fetching, [] = nothing returned, [...] = UNA form blocks */
    blocks: Block[] | null;
    onClose: () => void;
}) {
    return (
        <Modal
            isOpen={Boolean(state)}
            onClose={onClose}
            title={state?.title}
            description={state?.description}
            size="lg"
        >
            {blocks === null && (
                <div className="flex items-center justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
            )}
            {blocks !== null && blocks.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-500">
                    Nothing to show here — this action needs a signed-in account with the right role.
                </p>
            )}
            {blocks !== null && blocks.length > 0 && <UnaBlocks blocks={blocks} contentOnly={false} />}
        </Modal>
    );
}

/** Panel with a designed header, holding UNA-owned feature blocks. */
function KitPanel({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
    return (
        <div className="rounded-slate-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
            <div className="mb-3 flex flex-col gap-1">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
                {subtitle && <p className="text-xs font-medium text-slate-500">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

/* ---------- shared data plumbing ---------- */

/* ---------- Hub (courses-home) ---------- */

function HubApp({ data }: { data: any }) {
    const router = useRouter();
    const [recent, setRecent] = useState<CourseSummary[]>([]);
    const [featured, setFeatured] = useState<CourseSummary[]>([]);
    const [top, setTop] = useState<CourseSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            // Prefer this page's own UNA course rails, fall back to direct browse calls
            // (only bx_courses rails — person/group/timeline rails are not course data).
            const pageRail = unaBlocksBySource(data, (s) => s.includes('browse_') && s.includes('bx_courses'))[0];
            let items: CourseSummary[] = [];
            try {
                const payload = (pageRail?.content as any)?.[0]?.data;
                items = itemsFromListBlock(payload).map(summaryFromBrowseItem);
            } catch {}
            const [recentRes, featuredRes, topRes] = await Promise.all([
                items.length ? Promise.resolve(items) : coursesApi.browse('recent'),
                coursesApi.browse('featured', 0, 6),
                coursesApi.browse('top', 0, 6)
            ]);
            if (cancelled) return;
            setRecent(recentRes);
            setFeatured(featuredRes);
            setTop(topRes);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [data]);

    const onOpen = (arg: CourseSummary | string) => {
        const url = typeof arg === 'string' ? arg : arg.url;
        if (url) router.push(appPath(url));
    };

    // UNA's entry-page auth blocks (login/create account) stay embedded for guests.
    const authBlocks = unaBlocksBySource(data, (s) => /login|create_account|forgot/.test(s));

    return (
        <Frame>
            {loading && !recent.length ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
            ) : (
                <CoursesHub
                    featuredCourses={featured}
                    recentCourses={recent}
                    topCourses={top}
                    categories={[
                        ...new Set(
                            [...featured, ...recent, ...top]
                                .map((c) => c.category)
                                .filter((category): category is string => Boolean(category))
                        )
                    ]}
                    inProgressCourses={[]}
                    isManager={false}
                    onSearch={() => router.push('/courses-search')}
                    onSelectCategory={() => router.push('/courses-search')}
                    onOpenCourse={(url: string) => url && router.push(appPath(url))}
                    onContinueCourse={(c: CourseSummary) => onOpen(c.url)}
                    onJoinCourse={(c: CourseSummary) => onOpen(c.url)}
                    onCreateCourse={() => router.push('/create-course-profile')}
                    onBrowseAll={() => router.push('/courses-search')}
                    onFavorite={async (c: CourseSummary) => coursesApi.favorite(c.profileId)}
                    favoritedSlugs={[]}
                />
            )}
            <div className="mt-6">
                <KitPanel title="New on GenLabs" subtitle="Fresh tracks from the faculty - updated live">
                    <UnaBlocks blocks={unaBlocksBySource(data, (s) => s.includes('browse_'))} contentOnly={false} />
                </KitPanel>
                {authBlocks.length > 0 && (
                    <KitPanel title="Sign in or create an account" subtitle="Access your GenLabs member area">
                        <UnaBlocks blocks={authBlocks} contentOnly={false} />
                    </KitPanel>
                )}
            </div>
        </Frame>
    );
}

/* ---------- Catalog (courses-search) ---------- */

function CatalogApp({ data }: { data: any }) {
    const router = useRouter();
    const [courses, setCourses] = useState<CourseSummary[]>([]);
    const [favoritedSlugs, setFavorites] = useState<string[]>([]);
    const [searchRail, setSearchRail] = useState<Block[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setSearchRail(unaBlocksBySource(data, (s) => s.includes('search') || s.includes('extended')));
            const rail = unaBlocksBySource(data, (s) => s.includes('browse_') && s.includes('bx_courses'))[0];
            let items: CourseSummary[] = [];
            try {
                const payload = (rail?.content as any)?.[0]?.data;
                items = itemsFromListBlock(payload).map(summaryFromBrowseItem);
            } catch {}
            const browseRes = items.length ? items : await coursesApi.browse('recent', 0, 50);
            if (cancelled) return;
            setCourses(browseRes);
        })();
        return () => {
            cancelled = true;
        };
    }, [data]);

    return <Frame>
        {searchRail.length > 0 && (
            <div className="mb-4">
                <KitPanel title="Search & Filters" subtitle="Search across every GenLabs track">
                    <UnaBlocks blocks={searchRail} />
                </KitPanel>
            </div>
        )}
        <BrowseCourses
            courses={courses}
            categories={[...new Set(courses.map((c: CourseSummary) => c.category).filter((category): category is string => Boolean(category)))]}
            tags={[...new Set(courses.flatMap((c: CourseSummary) => c.labels ?? []))].filter((label): label is string => Boolean(label))}
            onOpenCourse={(url: string) => url && router.push(appPath(url))}
            onContinueCourse={(c: CourseSummary) => c.url && router.push(appPath(c.url))}
            onJoinCourse={(c: CourseSummary) => c.url && router.push(appPath(c.url))}
            onFavorite={(c: CourseSummary) => {
                coursesApi.favorite(c.profileId);
                setFavorites((prev) => (prev.includes(c.slug) ? prev.filter((s) => s !== c.slug) : [...prev, c.slug]));
            }}
            favoritedSlugs={favoritedSlugs}
        />
        <div className="mt-6">
            <KitPanel title="Complete catalog" subtitle="Every GenLabs track with paging and sorting">
                <UnaBlocks blocks={unaBlocksBySource(data, (s) => !s.includes('search'))} contentOnly={false} />
            </KitPanel>
        </div>
    </Frame>;
}

/* ---------- My Courses (courses-joined) ---------- */

function MyCoursesApp({ data }: { data: any }) {
    const router = useRouter();
    const [attended, setAttended] = useState<CourseSummary[]>([]);
    const [created, setCreated] = useState<CourseSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [joinedRes, createdRes] = await Promise.all([
                coursesApi.browse('joined', 0, 50),
                coursesApi.browse('created', 0, 50)
            ]);
            if (cancelled) return;
            setAttended(joinedRes);
            setCreated(createdRes.filter((c) => !joinedRes.some((j) => j.id === c.id)));
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const blocks = unaBlocksBySource(data, () => true);
    return (
        <Frame>
            <div className="space-y-4">
                <MyCourses
                    attendedCourses={attended}
                    createdCourses={created}
                    onOpenCourse={(url: string) => url && router.push(appPath(url))}
                    onContinueCourse={(c: CourseSummary) => c.url && router.push(appPath(c.url))}
                    onEditCourse={(c: CourseSummary) =>
                        c.url
                            ? router.push(
                                  `/edit-course-content/${c.slug}`
                              )
                            : undefined
                    }
                    onCreateCourse={() => router.push('/create-course-profile')}
                />
                {!loading && !attended.length && (
                    <KitPanel title="No learning yet">Join a track from the catalog to see it here.</KitPanel>
                )}
                <div className="mt-2">
                    <KitPanel title="Learning tools" subtitle="Member listing and account tools for your tracks">
                        <UnaBlocks blocks={blocks} />
                    </KitPanel>
                </div>
            </div>
        </Frame>
    );
}

/* ---------- Admin grid (courses-administration) ---------- */

function AdminApp({ data }: { data: any }) {
    const router = useRouter();
    const [created, setCreated] = useState<CourseSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [unaFormState, setUnaFormState] = useState<{ title: string; description?: string } | null>(null);
    const [unaFormBlocks, setUnaFormBlocks] = useState<Block[] | null>(null);

    /** Fetch and show UNA's own edit/settings or delete form for an owned course. */
    const openEntryForm = async (kind: 'edit' | 'delete', entryId: number, title: string) => {
        setUnaFormState({
            title: kind === 'delete' ? `Delete "${title}"` : `Settings — ${title}`,
            description: kind === 'delete' ? 'UNA confirms and applies the deletion with its own cascade rules.' : undefined
        });
        setUnaFormBlocks(null);
        const block =
            kind === 'delete'
                ? await coursesApi.entityDeleteForm(entryId)
                : await coursesApi.entityEditForm(entryId);
        setUnaFormBlocks(block ? [block] : []);
        if (!block) setUnaFormState(null);
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const createdRes = await coursesApi.browse('created', 0, 50);
            if (cancelled) return;
            setCreated(createdRes);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const blocks = unaBlocksBySource(data, () => true);
    // UNA governance is author-scoped: the member's own courses drive the kit table.
    const courses: Course[] = created.map((summary) => ({
        ...(summary as unknown as Course),
        counters: []
    }));
    return (
        <Frame>
            <div className="space-y-4">
                {!loading && (
                    <AdminCourses
                        courses={courses}
                        onCourseAction={(action, courseId) => {
                            const course = created.find((c) => c.id === courseId);
                            if (!course) return;
                            if (action === 'audit_content' || action === 'edit' || action === 'manage') {
                                router.push(`/edit-course-content/${course.slug}`);
                            } else if (action === 'settings') {
                                openEntryForm('edit', course.id, course.title);
                            } else if (action === 'delete') {
                                openEntryForm('delete', course.id, course.title);
                            } else if (action === 'add' || action === 'create') {
                                router.push('/create-course-profile');
                            }
                        }}
                    />
                )}
                {!loading && !created.length && (
                    <KitPanel title="Nothing to govern yet">
                        Governance tools appear for tracks you author or administer.
                    </KitPanel>
                )}
                <div className="mt-2">
                    <KitPanel title="Governance tools" subtitle="Administrative listings for every track">
                        <UnaBlocks blocks={blocks} />
                    </KitPanel>
                </div>
                <UnaEntryFormModal
                    state={unaFormState}
                    blocks={unaFormBlocks}
                    onClose={() => {
                        setUnaFormState(null);
                        // A finished UNA delete changes the ownership list — reload it.
                        if (unaFormState && unaFormState.title.startsWith('Delete')) window.location.reload();
                    }}
                />
            </div>
        </Frame>
    );
}

/* ---------- Join / create wizard (create-course-profile) ---------- */

function CreateApp({ data }: { data: any }) {
    const blocks = unaBlocksBySource(data, () => true);
    return (
        <Frame>
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-4 sm:p-5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Create a Course</h1>
                    <p className="mt-1 text-sm text-slate-500">Draft first, publish when your curriculum is ready.</p>
                </div>
                <KitPanel title="Course details" subtitle="Required fields go to your draft. Publishing follows.">
                    <UnaBlocks blocks={blocks} />
                </KitPanel>
                {!blocks.length && <KitPanel title="Sign in required">Creating a course needs an instructor account.</KitPanel>}
            </div>
        </Frame>
    );
}

/* ---------- Join flow (join-course-profile): UNA's own join page (free/paid/questionnaire/invite) ---------- */

function JoinApp({ data }: { data: any }) {
    const blocks = unaBlocksBySource(data, () => true);
    return (
        <Frame>
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-4 sm:p-5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Join this Course</h1>
                    <p className="mt-1 text-sm text-slate-500">UNA handles the join runbook here: free enrollment, paid plans, invitations and the joining questionnaire.</p>
                </div>
                <KitPanel title="Enrollment" subtitle="UNA join & pricing forms run their own actions under your session">
                    <UnaBlocks blocks={blocks} />
                </KitPanel>
                {!blocks.length && <KitPanel title="Sign in required">Joining a course needs a member account.</KitPanel>}
                <div className="text-center">
                    <Link href="/courses-search" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Back to catalog</Link>
                </div>
            </div>
        </Frame>
    );
}

/* ---------- Generic UNA page takeover (edit profile/pricing, invite, delete, comments) ---------- */

function EntryApp({ data, title, desc }: { data: any; title: string; desc: string }) {
    const blocks = unaBlocksBySource(data, () => true);
    return (
        <Frame>
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-4 sm:p-5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{desc}</p>
                </div>
                <KitPanel title={title} subtitle="UNA runs its own action under your session">
                    <UnaBlocks blocks={blocks} />
                </KitPanel>
                {!blocks.length && <KitPanel title="Nothing to show">This page needs a signed-in account with the right role.</KitPanel>}
            </div>
        </Frame>
    );
}

/* ---------- About (course-profile-info) ---------- */

function AboutApp({ data }: { data: any }) {
    const blocks = unaBlocksBySource(data, () => true);
    return (
        <Frame>
            <div className="mx-auto max-w-4xl space-y-4">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">About this course</h1>
                    <p className="mt-1 text-sm text-slate-500">Everything the faculty published about the track.</p>
                </div>
                <UnaBlocks blocks={blocks} />
                {!blocks.length && <AboutPanel course={{} as Course} iconSlot={undefined} />}
            </div>
        </Frame>
    );
}

/* ---------- Students (course-fans) ---------- */

function StudentsApp({ data }: { data: any }) {
    const blocks = unaBlocksBySource(data, () => true);
    return (
        <Frame>
            <div className="space-y-4">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Students & Roles</h1>
                            <p className="text-sm text-slate-500">Manage members, invites and instructor roles.</p>
                        </div>
                        <Link
                            href={`/invite-to-course/${((data?.url ?? '').match(/view-course-profile\/([^/?#]+)/) || [])[1] ?? ''}`}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Invite Members →
                        </Link>
                    </div>
                </div>
                <UnaBlocks blocks={blocks} />
                {!blocks.length && <KitPanel title="No members visible">Sign in to see this course roster.</KitPanel>}
            </div>
        </Frame>
    );
}

/* ---------- Course view (view-course-profile) ---------- */

function buildMembers(block: any): Member[] {
    return (block?.members_list ?? []).map((m: any) => ({
        id: m.id,
        name: m.fullname || m.title,
        url: m.url,
        avatarUrl: m.url_avatar || m.image?.src,
        role: 'student' as const,
        joinedTs: m.added
    }));
}

function CourseViewPage({ data }: { data: any }) {
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [outline, setOutline] = useState<Outline | null>(null);
    const [related, setRelated] = useState<CourseSummary[]>([]);
    const [attachments, setAttachments] = useState<Attachment[] | null>(null);
    const [commentsBlock, setCommentsBlock] = useState<Block | null>(null);
    const [slug, setSlug] = useState('');
    const [isEditable, setEditable] = useState(false);
    const [unaFormState, setUnaFormState] = useState<{ title: string; description?: string } | null>(null);
    const [unaFormBlocks, setUnaFormBlocks] = useState<Block[] | null>(null);

    /** Fetch and show UNA's own edit/settings, invite or delete form for this course. */
    const openEntryForm = async (kind: 'edit' | 'delete' | 'invite' | 'share') => {
        if (!course) return;
        const titles: Record<string, { title: string; description?: string }> = {
            edit: { title: `Settings — ${course.title}` },
            delete: {
                title: `Delete "${course.title}"`,
                description: 'UNA confirms and applies the deletion with its own cascade rules.'
            },
            invite: { title: `Invite Members — ${course.title}` },
            share: { title: `Share — ${course.title}` }
        };
        setUnaFormState(titles[kind] ?? null);
        setUnaFormBlocks(null);
        const block =
            kind === 'share'
                ? await coursesApi.socialSharingBlock(course.id)
                : kind === 'delete'
                ? await coursesApi.entityDeleteForm(course.id)
                : kind === 'invite'
                ? await coursesApi.entityInviteForm(course.id)
                : await coursesApi.entityEditForm(course.id);
        const entryBlocks: Block[] = [];
        if (block) entryBlocks.push(block);
        // UNA's own cover block carries the owner-only Change Cover / crop uploader.
        if (kind === 'edit' && data?.cover_block) entryBlocks.push(data.cover_block);
        setUnaFormBlocks(entryBlocks);
        if (!block) {
            // Form refused (no rights / already gone): fall back to the UNA entry page.
            setUnaFormState(null);
            if (course.url) router.push(appPath(course.url));
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const url: string = data?.url ?? '';
            const match = /view-course-profile\/([^/?#]+)/.exec(url);
            const lessonSlug = match?.[1] ?? '';
            setSlug(lessonSlug);
            const coverProfileId = Number(data?.cover_block?.profile?.id ?? 0);
            const info = coverProfileId ? await coursesApi.contentInfoByProfileId(coverProfileId) : null;
            const contentId = Number(info?.id ?? 0);
            const l1 = contentId ? await coursesApi.structureL1(contentId) : { items: [] as OutlineItem[], isEditable: false, entryId: contentId };
            if (cancelled) return;
            setEditable(l1.isEditable);

            const fullCourse: Course | null = info
                ? ({
                      ...coursesApi.courseFromContentInfo(info, lessonSlug, data?.cover_block?.cover),
                      isOwnerOrAdmin: l1.isEditable,
                      canEdit: l1.isEditable,
                      membersCount: info?.members,
                      counters: l1.items.map((item) => ({
                          level: 1 as const,
                          title: item.title,
                          total: (item.counters ?? []).reduce((acc, c) => acc + (Number(c.total) || 0), 0)
                      }))
                  } as Course)
                : null;
            setCourse(fullCourse);

            const [nextOutline, nextRelated, joinedIds] = await Promise.all([
                contentId ? coursesApi.fullOutline(contentId, lessonSlug, l1.isEditable) : Promise.resolve(null),
                coursesApi.browse('top', 0, 6),
                // Force refresh: UNA membership right now — the course hero CTA must never flip.
                coursesApi.getJoinedContentIds(true)
            ]);
            if (cancelled) return;
            setOutline(nextOutline);
            setRelated(nextRelated.filter((item) => item.id !== contentId).slice(0, 4));
            // UNA membership is the hero contract's source of truth (undefined = still resolving).
            setCourse((prev) => (prev ? { ...prev, enrolled: joinedIds.has(Number(contentId)) } : prev));
            if (contentId) setCommentsBlock(await coursesApi.entityCommentsBlock(contentId));

            // Member progress (mockup hero contract): aggregate the outline's real
            // per-lesson pass states (fetched under the member's own session).
            if (nextOutline) {
                const lessons = nextOutline.items.filter((i) => i.level === 3);
                const withProgress = lessons.filter((i) => i.progress);
                if (withProgress.length) {
                    const percent = Math.round(
                        withProgress.reduce((acc, i) => acc + (i.progress?.percent ?? 0), 0) / lessons.length
                    );
                    const completed = withProgress.filter((i) => i.progress?.status === 'completed').length;
                    const status =
                        completed === lessons.length && lessons.length > 0
                            ? 'completed'
                            : percent > 0
                            ? 'in process'
                            : 'not started';
                    setCourse(
                        (prev) => (prev ? { ...prev, progress: { percent, status } } : prev)
                    );
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [data]);

    const members: Member[] = useMemo(() => buildMembers(data?.cover_block?.profile ?? {}), [data]);
    const leftovers = useMemo(
        () => unaBlocksBySource(data, (s) => !s.includes('structure') && !s.includes('browse')),
        [data]
    );
    // UNA discussions sources (timeline/comments) surface inside the kit Discussions tab;
    // every other leftover block surfaces inside the kit About tab. Nothing is removed.
    const discussionBlocks = useMemo(
        () => leftovers.filter((b) => /timeline|comment|post/i.test(String(b.source ?? ''))),
        [leftovers]
    );
    const aboutBlocks = useMemo(
        () => leftovers.filter((b) => !/timeline|comment|post/i.test(String(b.source ?? ''))),
        [leftovers]
    );
    const onOpenLesson = (nodeId: number) => {
        const lesson = outline?.items?.find((i) => i.nodeId === nodeId);
        // client-side transition into the lesson player — no document reload
        if (lesson?.url) router.push(appPath(lesson.url));
        else if (slug) router.push(`/view-course-profile/${slug}`);
    };

    // Resources tab: aggregate real UNA lesson attachments once, on first open.
    const onResourcesFirstOpen = async () => {
        const courseId = outline?.courseId ?? 0;
        const lessons = (outline?.items ?? []).filter((i) => i.level === 3 && !i.locked);
        setAttachments([]);
        if (!courseId || !lessons.length) return;
        const blocks = await Promise.all(
            lessons.map((lesson) => coursesApi.nodeBlock(courseId, lesson.nodeId, slug))
        );
        const collected: Attachment[] = [];
        blocks.forEach((lesson) => {
            (lesson?.attachments ?? []).forEach((att) => {
                collected.push(att);
            });
        });
        setAttachments(collected);
    };

    const onTabChange = async (tab: string) => {
        // The kit owns tab state: every tab switches in place, deep links always land on Overview.
        if (tab === 'resources' && !attachments) await onResourcesFirstOpen();
    };

    if (!course) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <CoursePage
                course={course}
                outline={outline ?? undefined}
                members={members}
                comments={[]}
                relatedCourses={related}
                attachments={attachments ?? undefined}
                attachmentsLoading={attachments === null}
                onTabChange={onTabChange}
                onOpenLesson={onOpenLesson}
                onManageNavigate={(section) => {
                    if (section === 'content') {
                        router.push(`/edit-course-content/${course.slug}`);
                    } else if (section === 'students') {
                        router.push(`/course-fans/${course.slug}`);
                    } else if (section === 'settings') {
                        openEntryForm('edit');
                    } else if (section === 'invite') {
                        openEntryForm('invite');
                    } else if (section === 'pricing') {
                        // UNA's own pricing page (page.php?i=edit-course-pricing)
                        const slugForPricing = course.slug || infoSlugFromData(data);
                        if (slugForPricing) router.push(`/edit-course-pricing/${slugForPricing}`);
                    }
                }}
                onDeleteCourse={() => {
                    openEntryForm('delete');
                }}
                onJoinFree={async () => {
                    // UNA's join flow keeps its own page (join course -> confirm/pricing);
                    // the takeover renders it too (`join-course-profile` in COURSE_URIS).
                    const slugForJoin = course.slug || infoSlugFromData(data);
                    if (slugForJoin) router.push(`/join-course-profile/${slugForJoin}`);
                    else window.location.reload();
                }}
                onFavorite={async () => coursesApi.favorite(course.profileId)}
                onShare={async () => {
                    await openEntryForm('share');
                }}
                onPublishCourse={async (c) => {
                    if (await coursesApi.publish(c.id)) window.location.reload();
                }}
                onUnpublishCourse={async (c) => {
                    if (await coursesApi.hide(c.id)) window.location.reload();
                }}
                onAddModuleOrLesson={undefined}
                isFavorited={false}
                aboutSlot={aboutBlocks.length > 0 ? <UnaBlocks blocks={aboutBlocks} /> : undefined}
                discussionsSlot={
                    discussionBlocks.length > 0 || commentsBlock ? (
                        <UnaBlocks blocks={[...(commentsBlock ? [commentsBlock] : []), ...discussionBlocks]} />
                    ) : undefined
                }
            />
            <UnaEntryFormModal
                state={unaFormState}
                blocks={unaFormBlocks}
                onClose={() => {
                    setUnaFormState(null);
                    if (unaFormState && unaFormState.title.startsWith('Delete')) window.location.reload();
                }}
            />
        </div>
    );
}

function infoSlugFromData(data?: any): string {
    return /view-course-profile\/([^/?#]+)/.exec(String(data?.url ?? ''))?.[1] ?? '';
}

/* ---------- Lesson view (view-course-profile-node) ---------- */

function LessonViewPage({ data }: { data: any }) {
    const nodeBlock = useMemo(
        () => unaBlocksBySource(data, (s) => s.includes('entity_node'))[0],
        [data]
    );
    if (!nodeBlock) return null;
    const payload = (nodeBlock.content as any)?.[0]?.data;
    return <LessonApp data={payload ?? {}} uri={data?.uri} url={data?.url} />;
}

/* ---------- Router ---------- */

export default function CoursePageLayout(props: CourseLayoutProps) {
    const uri = props.data?.uri as string | undefined;
    const layoutName = props.layoutName ?? '';
    // Courses-module pages reach this fork via the 'navigator' key (they render page
    // menus); pass the original through for every page that is not in the takeover.
    if (uri && COURSE_URIS.has(uri)) {
        return <CourseTakeoverView uri={uri} data={props.data} />;
    }
    if (layoutName === 'navigator') return <FallbackNavigator {...props} />;
    if (layoutName === 'profile') return <FallbackProfile {...(props as any)} />;
    if (layoutName === 'home') return <FallbackHome {...(props as any)} />;
    if (layoutName.includes('area_bar')) return <PageUniversal {...(props as any)} />;
    return <PageLayoutDefault {...(props as any)} />;
}

function CourseTakeoverView({ uri, data }: { uri: string; data: any }) {
    return (
        <Page data={data}>
            <main className="max-w-7xl w-full mx-auto p-4 sm:p-8">
            <div className="w-full space-y-4">
                        {/* courses-home is the UNA homepage copy for the kit hub; 'home' is UNA's own entry page */}
                        {(uri === 'courses-home' || uri === 'home') && <HubApp data={data} />}
                {uri === 'courses-search' && <CatalogApp data={data} />}
                {uri === 'courses-joined' && <MyCoursesApp data={data} />}
                {uri === 'courses-administration' && <AdminApp data={data} />}
                {uri === 'create-course-profile' && <CreateApp data={data} />}
                {uri === 'join-course-profile' && <JoinApp data={data} />}
                {uri === 'edit-course-profile' && (
                    <EntryApp data={data} title="Edit Course" desc="UNA's own entry edit form — every field, every check." />
                )}
                {uri === 'edit-course-pricing' && (
                    <EntryApp data={data} title="Course Pricing" desc="UNA's pricing grid: plans, billing and access terms." />
                )}
                {uri === 'invite-to-course' && (
                    <EntryApp data={data} title="Invite Members" desc="UNA's invite form: members, roles and welcome notes." />
                )}
                {uri === 'delete-course-profile' && (
                    <EntryApp data={data} title="Delete Course" desc="UNA's delete form with its own confirm and cascade rules." />
                )}
                {uri === 'course-profile-comments' && (
                    <EntryApp data={data} title="Course Comments" desc="UNA's comment views for this course." />
                )}
                {uri === 'view-course-profile-closed' && <CourseViewPage data={data} />}
                {uri === 'course-profile-info' && <AboutApp data={data} />}
                {uri === 'course-fans' && <StudentsApp data={data} />}
                {uri === 'view-course-profile' && <CourseViewPage data={data} />}
                {uri === 'view-course-profile-node' && <LessonViewPage data={data} />}
                {uri === 'edit-course-content' && <OutlineEditorPageApp data={data} />}
            </div>
            </main>
            <PageFooter />
        </Page>
    );
}
