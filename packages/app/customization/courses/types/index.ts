/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Data and Callbacks contract for Courses UI/UX build
 */

import type { ReactNode } from 'react';

export type CourseContentId = number;  // the course row — used by curriculum/lesson APIs
export type CourseProfileId = number;  // the course's membership identity — used by join/fans/pricing/agent context
export type NodeId = number;           // module | theme | lesson id — outline + lesson APIs
export type DataId = number;           // one step or attachment row
export type PersonProfileId = number;  // a member

export type Progress = {
  percent: number;
  status: 'not started' | 'in process' | 'completed';
};

export type OutlineItem = {
  nodeId: NodeId;
  parentId: NodeId | 0;
  level: 1 | 2 | 3;              // 1 module, 2 theme, 3 lesson
  index: number;
  order: number;
  title: string;
  textHtml?: string;
  passing?: 0 | 1;               // 0 any order, 1 sequential — only on lessons (deepest level)
  counters?: { title: string; passed: number; total: number; text: string }[];
  progress?: Progress;
  url: string;                   // host deep link for this item (may be '' when not navigable)
  selected?: boolean;
  locked?: boolean;              // sequential mode, not yet reachable
};

export type Outline = {
  courseId: CourseContentId;
  isEditable: boolean;
  items: OutlineItem[];
};

export type Step = {
  id: DataId;
  order: number;
  usage: 0 | 1;                  // 0 step, 1 attachment
  contentType: string;           // 'bx_classes' | 'bx_posts' | 'bx_videos' | 'bx_polls' | 'bx_files' | 'bx_photos' | string
  typeLabel: string;
  title: string;
  textHtml: string;
  image?: { src: string; width?: number; height?: number };
  video?: { src: string; poster?: string };
  link?: string;
  file?: { sizeLabel?: string; downloadUrl?: string; name?: string };
  passed: boolean;
  locked: boolean;
  passTitle?: string;            // 'Pass' | 'Continue' | …
  options?: string[];            // real poll choices when the payload carries them
};

export type Lesson = {
  nodeId: NodeId;
  courseId: CourseContentId;
  index: number;
  title: string;
  textHtml: string;
  passing: 0 | 1;
  progress: Progress;
  steps: Step[];                 // usage: 0
  attachments: Step[];           // usage: 1
  // navigation aids
  prev?: { nodeId: NodeId; title: string };
  next?: { nodeId: NodeId; title: string };
  modulePath?: OutlineItem[];    // breadcrumb chain course>module>theme
};

export type PricingPlan = {
  id: number;
  roleId: number;
  roleName: string;
  name: string;
  caption?: string;
  price: string;
  currency?: string;
  period: number;
  periodUnit: 'day' | 'week' | 'month' | 'year' | 'lifetime';
  isDefault: boolean;
  active: boolean;
  action?: 'buy' | 'subscribe' | 'choose';      // which plan CTA
  purchasable: boolean;                          // false → show disabled state
};

export type Course = {
  id: CourseContentId;
  profileId: CourseProfileId;
  slug: string;
  url: string;
  title: string;
  textHtml: string;              // full description
  category?: string;
  labels?: string[];
  location?: string;
  addedTs?: number;
  changedTs?: number;
  cover?: { src: string; width?: number; height: number; focus?: { x: number; y: number } };
  picture?: { src: string };
  author: { id: number; name: string; url?: string; avatarUrl?: string; headline?: string };
  visibility: 'public' | 'private';
  status: 'active' | 'hidden' | 'pending' | 'suspended';   // viewer-dependent
  joinConfirmation?: boolean;
  privacyOptions?: { view: string; post: string };
  membersCount?: number;
  onlineCount?: number;
  rating?: { avg: number; votes: number };
  reactions?: { like?: number; [key: string]: number | undefined };
  views?: number;
  commentsCount?: number;
  favoritesCount?: number;
  featured?: boolean;
  counters?: { level: 1 | 2 | 3; title: string; total: number }[];  // modules/themes/lessons
  progress?: Progress;                  // only when enrolled
  enrolled?: boolean;
  isOwnerOrAdmin?: boolean;
  canEdit?: boolean;
  canModerate?: boolean;
  pricing?: PricingPlan[];              // present when paid join enabled
  studentSummary?: { joined: number; started: number; passed: number; passedPercent: number };
  teachers?: PersonProfileId[];
  socialSharing?: { network: string; url: string }[];
  learningOutcomes?: string[];
};

export type CourseSummary = Pick<
  Course,
  | 'id'
  | 'profileId'
  | 'slug'
  | 'url'
  | 'title'
  | 'category'
  | 'labels'
  | 'cover'
  | 'author'
  | 'visibility'
  | 'status'
  | 'membersCount'
  | 'rating'
  | 'counters'
  | 'progress'
  | 'enrolled'
  | 'pricing'
  | 'changedTs'
  | 'addedTs'
  | 'featured'
  | 'favoritesCount'
> & {
  textHtml?: string;
  pendingApproval?: boolean;
};

export type Member = {
  id: PersonProfileId;
  name: string;
  url?: string;
  avatarUrl?: string;
  role: 'student' | 'instructor' | 'moderator' | 'pending' | 'invited';
  roleAddedTs?: number;
  roleExpiresTs?: number;
  joinedTs?: number;
  progress?: Progress;
};

export type CommentItem = {
  id: number;
  author: { id: number; name: string; url?: string; avatarUrl?: string };
  ts: number;
  textHtml: string;
  votes?: number;
  parentId?: number;
  level: number;
  mine?: boolean;
  canReply: boolean;
  canVote: boolean;
  canDelete: boolean;
  canReport: boolean;
};

export type GridAction = {
  name: string;
  title?: string;
  icon?: string;
  kind: 'link' | 'callback' | 'menu' | 'switch';
  url?: string;
  confirm?: boolean;
  menu?: { key: string; title: string; callbackUrl?: string }[];
};

export type GridCell =
  | { type: 'text'; value: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'profile'; data: { id: number; name: string; url?: string; avatarUrl?: string } }
  | { type: 'time'; value: number }
  | { type: 'switcher'; on: boolean }
  | { type: 'checkbox'; value: number }
  | { type: 'order'; value: number }
  | { type: 'counters'; value: string }
  | { type: 'actions'; actions: GridAction[] };

export type AuthoringGrid = {
  header: { name: string; title: string; width: string }[];
  rows: { id: number; cells: Record<string, GridCell> }[];
  actions: {
    independent?: GridAction[];
    single?: Record<string, GridAction>;
    bulk?: GridAction[];
  };
  query?: Record<string, string | number>;
};

export type FormInput = {
  name: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'switcher'
    | 'checkbox'
    | 'radio'
    | 'hidden'
    | 'files'
    | 'location'
    | 'submit'
    | 'button'
    | 'custom';
  caption?: string;
  info?: string;
  required?: boolean;
  value?: unknown;
  values?: { key: string; value: string }[];         // for select/radio
  error?: string;
  placeholder?: string;
  maxChars?: number;
  multiple?: boolean;
  accept?: string;
  attrs?: Record<string, string | number | boolean>;
};

export type FormPayload = {
  display: string;                                   // e.g. 'course_add' | 'lesson_edit' | …
  title?: string;
  attrs?: { action?: string; method?: string; id?: string };
  inputs: FormInput[];                               // ordered
  csrfToken?: string;
};

export type Attachment = Step;

export type CourseNotification =
  | { kind: 'join_invitation'; course: { title: string; url: string }; from?: string; key?: string; date?: number }
  | { kind: 'join_request'; from: string; course: { title: string; url: string }; date?: number }
  | { kind: 'join_request_accepted' | 'fan_added' | 'fan_removed' | 'role_changed'; course: { title: string; url: string }; date?: number }
  | { kind: 'timeline_post_like' | 'comment_new' | 'reply_new' | 'lesson_new' | 'course_update'; course: { title: string; url: string }; date?: number };

export type CourseCallbacks = {
  // navigation
  onOpenCourse?(url: string): void;
  onOpenModule?(url: string): void;
  onOpenLesson?(url: string): void;
  onNavigateTab?(tab: string): void;
  onSearch?(q: string, filters?: Record<string, string>): void;
  onGoto?(url: string): void;

  // learning
  onPassStep?(dataId: DataId): void;
  onPassOrResetLesson?(nodeId: NodeId): void;
  onBack?(): void;
  onNextLesson?(nodeId: NodeId): void;
  onPrevLesson?(nodeId: NodeId): void;

  // enrollment
  onJoin?(): void;
  onLeave?(): void;
  onJoinPlan?(planId: number): void;
  onConfirmJoinRequest?(): void;
  onAcceptInvitation?(key: string): void;
  onDeclineInvitation?(key: string): void;

  // authoring (owner/admin only)
  onCreateCourse?(): void;
  onAddNode?(parentNodeId: NodeId, kind: 'module' | 'theme' | 'lesson'): void;
  onEditNode?(nodeId: NodeId): void;
  onDeleteNode?(nodeId: NodeId): void;
  onReorderNodes?(parentNodeId: NodeId, idsInOrder: NodeId[]): void;
  onAddContent?(lessonNodeId: NodeId, usage: 0 | 1, contentTypeKey: string): void;
  onEditContent?(dataId: DataId, contentType: string): void;
  onDeleteContent?(dataId: DataId): void;
  onReorderContent?(lessonNodeId: NodeId, idsInOrder: DataId[]): void;
  onCourseSettings?(course: Course): void;
  onPublishCourse?(course: Course): void;
  onUnpublishCourse?(course: Course): void;
  onDeleteCourse?(course: Course, withContent: boolean): void;
  onSubmitForm?(form: FormPayload, values: Record<string, unknown>): Promise<{ ok: boolean; errors?: Record<string, string>; redirectTo?: string }>;

  // members & moderation
  onSetRole?(member: Member, role: Member['role']): void;
  onRemoveMember?(member: Member): void;
  onInvite?(toEmails?: string[]): void;
  onClearReports?(): void;
  onAudit?(course: Pick<Course, 'id'>, kind?: 'content' | 'context'): void;

  // social
  onFavorite?(course: Course): void;
  onShare?(course: Course, network?: string): void;
  onReport?(course: Course): void;
  onPostComment?(text: string, replyTo?: CommentItem['id']): void;
  onEditComment?(id: CommentItem['id'], text: string): void;
  onDeleteComment?(id: CommentItem['id']): void;
  onVoteComment?(id: CommentItem['id'], dir: 1 | -1): void;
  onReaction?(course: Course, key: string): void;
  onRate?(course: Course, value: number): void;
  onSubscribe?(course: Course): void;

  // agent
  onAskAgent?(ctx: { course: Pick<Course, 'id' | 'profileId'>; nodeId?: NodeId; hint?: string; prompt?: string }): void;

  // media & misc
  onPickImage?(target: 'cover' | 'picture'): void;
  onPlayVideo?(src: string): void;
  onDownload?(a: Attachment): void;
  onNotificationAction?(n: CourseNotification): void;
};

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;
export type IconSlotFn = (name: string, className?: string) => ReactNode;

export type BaseComponentProps = {
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  formatTs?: (ts: number) => string;
  formatSize?: (bytes: number) => string;
  formatPrice?: (price: string, currency?: string, periodUnit?: string) => string;
  className?: string;
};
