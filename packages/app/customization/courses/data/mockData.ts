/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Realistic Seed Data for the Courses SaaS platform
 */

import type {
  Course,
  CourseSummary,
  Outline,
  Lesson,
  Member,
  CommentItem,
  CourseNotification
} from '../types';

export const mockCourses: Course[] = [
  {
    id: 101,
    profileId: 1001,
    slug: 'distributed-systems-architecture',
    url: '/view-course-profile/distributed-systems-architecture',
    title: 'Distributed Systems & High-Scale Cloud Architecture',
    textHtml: `
      <p>Master the design, fault tolerance, and consensus protocols of global distributed systems. Through hands-on benchmarks and architectural teardowns, you'll learn how to architect resilient microservices handling millions of concurrent events.</p>
      <h3>Course Modules</h3>
      <p>Covers consensus protocols (Raft, Paxos), distributed event streaming with Kafka, partitioning strategies, dynamic leader election, and observability in multi-region deployments.</p>
    `,
    category: 'Software Engineering',
    labels: ['Architecture', 'Kubernetes', 'Go', 'Distributed Systems'],
    location: 'Online / Global Remote',
    addedTs: Date.now() - 30 * 86400 * 1000,
    changedTs: Date.now() - 2 * 86400 * 1000,
    cover: {
      src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      width: 1200,
      height: 525,
      focus: { x: 0.5, y: 0.5 }
    },
    author: {
      id: 501,
      name: 'Dr. Elena Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      headline: 'Principal Distributed Systems Engineer & Ex-Cloud Architect'
    },
    visibility: 'public',
    status: 'active',
    membersCount: 1420,
    onlineCount: 88,
    rating: { avg: 4.9, votes: 312 },
    reactions: { like: 245, heart: 180, sparkles: 92 },
    views: 18400,
    commentsCount: 42,
    favoritesCount: 380,
    featured: true,
    enrolled: true,
    isOwnerOrAdmin: false,
    counters: [
      { level: 1, title: 'Modules', total: 4 },
      { level: 2, title: 'Themes', total: 8 },
      { level: 3, title: 'Lessons', total: 16 }
    ],
    progress: { percent: 65, status: 'in process' },
    studentSummary: {
      joined: 1420,
      started: 1180,
      passed: 740,
      passedPercent: 62
    },
    learningOutcomes: [
      'Design fault-tolerant state machine replication using Raft consensus',
      'Implement zero-data-loss event streaming pipelines using Apache Kafka',
      'Deploy self-healing geo-replicated services across multiple cloud zones',
      'Debug concurrency races, network partitions, and split-brain failures'
    ],
    socialSharing: [
      { network: 'Twitter', url: 'https://twitter.com' },
      { network: 'LinkedIn', url: 'https://linkedin.com' },
      { network: 'GitHub', url: 'https://github.com' }
    ],
    pricing: [
      {
        id: 1,
        roleId: 1,
        roleName: 'Student Access',
        name: 'Monthly Cohort',
        caption: 'Full access to all modules, labs, and interactive step grading.',
        price: '49',
        currency: '$',
        period: 1,
        periodUnit: 'month',
        isDefault: true,
        active: true,
        action: 'subscribe',
        purchasable: true
      },
      {
        id: 2,
        roleId: 2,
        roleName: 'Pro Learner',
        name: 'Annual Pass',
        caption: '12 months access including 1-on-1 code reviews with mentors.',
        price: '399',
        currency: '$',
        period: 1,
        periodUnit: 'year',
        isDefault: false,
        active: true,
        action: 'buy',
        purchasable: true
      }
    ]
  },
  {
    id: 102,
    profileId: 1002,
    slug: 'deep-learning-transformers',
    url: '/view-course-profile/deep-learning-transformers',
    title: 'Transformer Models & Multi-Modal Generative AI from Scratch',
    textHtml: `
      <p>An exhaustive, code-first immersion into attention mechanisms, RoPE embeddings, KV-caching, fine-tuning with LoRA/QLoRA, and multi-modal vision-language architectures.</p>
    `,
    category: 'Machine Learning & AI',
    labels: ['PyTorch', 'Transformers', 'LLM', 'AI Engineering'],
    location: 'Online / Global Remote',
    addedTs: Date.now() - 14 * 86400 * 1000,
    changedTs: Date.now() - 1 * 86400 * 1000,
    cover: {
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      width: 1200,
      height: 525,
      focus: { x: 0.5, y: 0.5 }
    },
    author: {
      id: 502,
      name: 'Marcus Thorne',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      headline: 'Research Scientist & ML Infrastructure Lead'
    },
    visibility: 'public',
    status: 'active',
    membersCount: 2310,
    onlineCount: 145,
    rating: { avg: 4.95, votes: 480 },
    reactions: { like: 410, heart: 320, sparkles: 210 },
    views: 31200,
    commentsCount: 88,
    favoritesCount: 650,
    featured: true,
    enrolled: false,
    counters: [
      { level: 1, title: 'Modules', total: 6 },
      { level: 2, title: 'Themes', total: 12 },
      { level: 3, title: 'Lessons', total: 24 }
    ],
    studentSummary: {
      joined: 2310,
      started: 1950,
      passed: 1280,
      passedPercent: 65
    },
    learningOutcomes: [
      'Write scaled dot-product attention and multi-head attention in raw PyTorch',
      'Optimize autoregressive inference throughput using continuous batching & PagedAttention',
      'Fine-tune open-weights models with PEFT/LoRA on custom evaluation sets'
    ],
    pricing: [
      {
        id: 3,
        roleId: 1,
        roleName: 'Student Access',
        name: 'Cohort Admission',
        caption: 'Includes GPU notebook clusters for hands-on fine-tuning labs.',
        price: '79',
        currency: '$',
        period: 1,
        periodUnit: 'month',
        isDefault: true,
        active: true,
        action: 'subscribe',
        purchasable: true
      }
    ]
  },
  {
    id: 103,
    profileId: 1003,
    slug: 'modern-design-systems-engineering',
    url: '/view-course-profile/modern-design-systems-engineering',
    title: 'Enterprise Design Systems & Advanced Frontend Craft',
    textHtml: `
      <p>Build scalable design systems that power enterprise web applications. Discover token pipeline architecture, zero-pill anti-slop guidelines, accessible primitives, and micro-interactions.</p>
    `,
    category: 'Product Design & UX',
    labels: ['React', 'Design Systems', 'Tailwind', 'Accessibility'],
    location: 'San Francisco, CA / Remote',
    addedTs: Date.now() - 45 * 86400 * 1000,
    changedTs: Date.now() - 5 * 86400 * 1000,
    cover: {
      src: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      width: 1200,
      height: 525,
      focus: { x: 0.5, y: 0.5 }
    },
    author: {
      id: 503,
      name: 'Claire Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
      headline: 'Design Systems Architect & Staff UX Engineer'
    },
    visibility: 'public',
    status: 'active',
    membersCount: 890,
    rating: { avg: 4.88, votes: 195 },
    counters: [
      { level: 1, title: 'Modules', total: 3 },
      { level: 2, title: 'Themes', total: 6 },
      { level: 3, title: 'Lessons', total: 12 }
    ],
    enrolled: true,
    progress: { percent: 100, status: 'completed' },
    learningOutcomes: [
      'Architect robust semantic token hierarchies supporting light/dark dual themes',
      'Create WCAG AAA compliant headless components with keyboard focus traps',
      'Automate visual regression tests and Storybook publishing workflows'
    ]
  },
  {
    id: 104,
    profileId: 1004,
    slug: 'cloud-native-devops-kubernetes',
    url: '/view-course-profile/cloud-native-devops-kubernetes',
    title: 'Production Kubernetes & Multi-Cloud Infrastructure as Code',
    textHtml: `
      <p>A rigorous, practical course on orchestrating containerized microservices at scale with Kubernetes, Terraform, Helm, and GitOps pipelines.</p>
    `,
    category: 'Cloud Architecture',
    labels: ['DevOps', 'Kubernetes', 'Terraform', 'CI/CD'],
    location: 'Online',
    addedTs: Date.now() - 60 * 86400 * 1000,
    changedTs: Date.now() - 10 * 86400 * 1000,
    cover: {
      src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      width: 1200,
      height: 525,
      focus: { x: 0.5, y: 0.5 }
    },
    author: {
      id: 504,
      name: 'James O’Connor',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
      headline: 'Senior SRE & Infrastructure Architect'
    },
    visibility: 'public',
    status: 'active',
    membersCount: 1650,
    rating: { avg: 4.85, votes: 270 },
    counters: [
      { level: 1, title: 'Modules', total: 5 },
      { level: 2, title: 'Themes', total: 10 },
      { level: 3, title: 'Lessons', total: 18 }
    ],
    enrolled: false
  },
  {
    id: 105,
    profileId: 1005,
    slug: 'private-enterprise-security-protocols',
    url: '/view-course-profile/private-enterprise-security-protocols',
    title: 'Zero-Trust Architecture & Threat Surface Defense',
    textHtml: `
      <p>Confidential internal security engineering course covering mTLS enforcement, identity-aware proxies, and automated posture remediation.</p>
    `,
    category: 'Software Engineering',
    labels: ['Security', 'Zero-Trust', 'Cryptography'],
    location: 'Private Cohort',
    addedTs: Date.now() - 5 * 86400 * 1000,
    cover: {
      src: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      width: 1200,
      height: 525
    },
    author: {
      id: 505,
      name: 'Sarah Connor',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
      headline: 'CISO & Security Research Fellow'
    },
    visibility: 'private',
    status: 'active',
    membersCount: 84,
    rating: { avg: 4.98, votes: 45 },
    counters: [
      { level: 1, title: 'Modules', total: 3 },
      { level: 2, title: 'Themes', total: 6 },
      { level: 3, title: 'Lessons', total: 9 }
    ],
    enrolled: false
  }
];

export const mockOutline: Outline = {
  courseId: 101,
  isEditable: true,
  items: [
    {
      nodeId: 201,
      parentId: 0,
      level: 1,
      index: 1,
      order: 1,
      title: 'Module 1: Foundations of Fault-Tolerant Distributed State',
      textHtml: 'Core principles of distributed systems, network partitions, and state replication.',
      url: '/view-course-profile/distributed-systems-architecture?parent_id=201',
      progress: { percent: 100, status: 'completed' }
    },
    {
      nodeId: 301,
      parentId: 201,
      level: 2,
      index: 1,
      order: 1,
      title: 'Theme 1.1: Physical vs Logical Clocks & Ordering',
      url: ''
    },
    {
      nodeId: 401,
      parentId: 301,
      level: 3,
      index: 1,
      order: 1,
      title: 'Lesson 1.1.1: Lamport Timestamps & Vector Clocks',
      textHtml: 'Understand total vs partial ordering in distributed events.',
      passing: 1,
      url: '/view-course-profile-node/distributed-systems-architecture?node_id=401',
      progress: { percent: 100, status: 'completed' },
      locked: false
    },
    {
      nodeId: 402,
      parentId: 301,
      level: 3,
      index: 2,
      order: 2,
      title: 'Lesson 1.1.2: Hybrid Logical Clocks in CockroachDB & Spanner',
      textHtml: 'TrueTime vs HLCs in modern cloud-native databases.',
      passing: 1,
      url: '/view-course-profile-node/distributed-systems-architecture?node_id=402',
      progress: { percent: 100, status: 'completed' },
      locked: false
    },
    {
      nodeId: 202,
      parentId: 0,
      level: 1,
      index: 2,
      order: 2,
      title: 'Module 2: Consensus Protocols: Raft, Multi-Paxos & Zab',
      textHtml: 'Leader election, log replication, and safety invariants.',
      url: '/view-course-profile/distributed-systems-architecture?parent_id=202',
      progress: { percent: 50, status: 'in process' }
    },
    {
      nodeId: 302,
      parentId: 202,
      level: 2,
      index: 1,
      order: 1,
      title: 'Theme 2.1: The Raft Consensus Algorithm',
      url: ''
    },
    {
      nodeId: 403,
      parentId: 302,
      level: 3,
      index: 1,
      order: 1,
      title: 'Lesson 2.1.1: Leader Election & Heartbeat Mechanisms',
      textHtml: 'Simulating split votes and election timeouts in Go.',
      passing: 1,
      url: '/view-course-profile-node/distributed-systems-architecture?node_id=403',
      progress: { percent: 100, status: 'completed' },
      locked: false
    },
    {
      nodeId: 404,
      parentId: 302,
      level: 3,
      index: 2,
      order: 2,
      title: 'Lesson 2.1.2: Log Matching Invariant & Joint Consensus',
      textHtml: 'Ensuring consistency across dynamic membership changes.',
      passing: 1,
      url: '/view-course-profile-node/distributed-systems-architecture?node_id=404',
      progress: { percent: 0, status: 'not started' },
      locked: false
    },
    {
      nodeId: 203,
      parentId: 0,
      level: 1,
      index: 3,
      order: 3,
      title: 'Module 3: Distributed Storage & Partitioning Strategies',
      textHtml: 'Consistent hashing, quorum reads/writes, and anti-entropy.',
      url: '/view-course-profile/distributed-systems-architecture?parent_id=203',
      progress: { percent: 0, status: 'not started' }
    },
    {
      nodeId: 303,
      parentId: 203,
      level: 2,
      index: 1,
      order: 1,
      title: 'Theme 3.1: Dynamo-Style Storage Engines',
      url: ''
    },
    {
      nodeId: 405,
      parentId: 303,
      level: 3,
      index: 1,
      order: 1,
      title: 'Lesson 3.1.1: Virtual Nodes & Consistent Hash Rings',
      textHtml: 'Minimizing data movement when nodes join or leave.',
      passing: 1,
      url: '/view-course-profile-node/distributed-systems-architecture?node_id=405',
      progress: { percent: 0, status: 'not started' },
      locked: true // Sequential prerequisite lock demo
    }
  ]
};

export const mockLessonDetail: Lesson = {
  nodeId: 403,
  courseId: 101,
  index: 1,
  title: 'Lesson 2.1.1: Leader Election & Heartbeat Mechanisms',
  textHtml: `
    <p>In this lesson, we break down how the Raft consensus algorithm handles leader election when the existing cluster leader suffers network partitions or node failure.</p>
    <p>Follow the steps below to verify the election safety invariants and observe randomized election timeouts in action.</p>
  `,
  passing: 1,
  progress: { percent: 50, status: 'in process' },
  prev: { nodeId: 402, title: 'Lesson 1.1.2: Hybrid Logical Clocks' },
  next: { nodeId: 404, title: 'Lesson 2.1.2: Log Matching Invariant' },
  modulePath: [
    { nodeId: 202, parentId: 0, level: 1, index: 2, order: 2, title: 'Module 2: Consensus Protocols', url: '' },
    { nodeId: 302, parentId: 202, level: 2, index: 1, order: 1, title: 'Theme 2.1: The Raft Algorithm', url: '' }
  ],
  steps: [
    {
      id: 5001,
      order: 1,
      usage: 0,
      contentType: 'bx_videos',
      typeLabel: 'Video Lecture',
      title: 'Deep Dive: Randomized Election Timeouts in Raft',
      textHtml: `
        <p>Watch this visual explanation showing 5 cluster nodes negotiating term transitions, election timeouts between 150ms and 300ms, and majority voting.</p>
      `,
      video: {
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
      },
      passed: true,
      locked: false,
      passTitle: 'Continue to Step 2'
    },
    {
      id: 5002,
      order: 2,
      usage: 0,
      contentType: 'bx_polls',
      typeLabel: 'Knowledge Check',
      title: 'Knowledge Check: Split Vote Prevention',
      textHtml: `
        <p>What ensures that two candidates do not perpetually split votes equally in Raft?</p>
      `,
      passed: false,
      locked: false,
      passTitle: 'Submit & Pass'
    },
    {
      id: 5003,
      order: 3,
      usage: 0,
      contentType: 'bx_classes',
      typeLabel: 'Interactive Lab',
      title: 'Hands-on Exercise: Implement Candidate Term Increment',
      textHtml: `
        <div class="space-y-3">
          <p>Open the starter code file in the resources tab and inspect <code>raft.go</code>. Implement the state transition logic from Follower to Candidate:</p>
          <pre class="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
func (rf *Raft) startElection() {
    rf.currentTerm++
    rf.votedFor = rf.me
    rf.state = Candidate
    // Broadcast RequestVote RPCs to all peers...
}</pre>
          <p>Ensure you acquire the cluster mutex lock prior to reading term state.</p>
        </div>
      `,
      passed: false,
      locked: true,
      passTitle: 'Mark Complete'
    }
  ],
  attachments: [
    {
      id: 6001,
      order: 1,
      usage: 1,
      contentType: 'bx_files',
      typeLabel: 'Code Starter',
      title: 'raft_election_starter.zip',
      textHtml: '',
      file: {
        name: 'raft_election_starter.zip',
        sizeLabel: '1.8 MB',
        downloadUrl: '#'
      },
      passed: true,
      locked: false
    },
    {
      id: 6002,
      order: 2,
      usage: 1,
      contentType: 'bx_files',
      typeLabel: 'Cheat Sheet',
      title: 'raft_invariants_diagram.pdf',
      textHtml: '',
      file: {
        name: 'raft_invariants_diagram.pdf',
        sizeLabel: '3.4 MB',
        downloadUrl: '#'
      },
      passed: true,
      locked: false
    }
  ]
};

export const mockMembers: Member[] = [
  {
    id: 1,
    name: 'Alex Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'student',
    joinedTs: Date.now() - 15 * 86400 * 1000,
    progress: { percent: 75, status: 'in process' }
  },
  {
    id: 2,
    name: 'Samantha Wu',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    role: 'student',
    joinedTs: Date.now() - 20 * 86400 * 1000,
    progress: { percent: 100, status: 'completed' }
  },
  {
    id: 3,
    name: 'Liam Gallagher',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    role: 'instructor',
    joinedTs: Date.now() - 60 * 86400 * 1000
  },
  {
    id: 4,
    name: 'Devin Brooks',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
    role: 'pending',
    joinedTs: Date.now() - 1 * 86400 * 1000
  },
  {
    id: 5,
    name: 'Rachel Green',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    role: 'moderator',
    joinedTs: Date.now() - 40 * 86400 * 1000
  }
];

export const mockComments: CommentItem[] = [
  {
    id: 1,
    author: {
      id: 1,
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    },
    ts: Date.now() - 2 * 86400 * 1000,
    textHtml: '<p>The distinction between leader election heartbeats and AppendEntries RPC payload replication was explained so well in Lesson 2.1. Are we also going to cover Pre-Vote protocols in the next module?</p>',
    votes: 18,
    level: 1,
    mine: false,
    canReply: true,
    canVote: true,
    canDelete: false,
    canReport: true
  },
  {
    id: 2,
    parentId: 1,
    author: {
      id: 501,
      name: 'Dr. Elena Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
    },
    ts: Date.now() - 1 * 86400 * 1000,
    textHtml: '<p>Yes, Alex! In Module 2 Theme 2.2 we will implement Pre-Vote extension to prevent disconnected partitioned nodes from disrupting stable leaders upon reconnecting.</p>',
    votes: 24,
    level: 2,
    mine: false,
    canReply: true,
    canVote: true,
    canDelete: false,
    canReport: false
  }
];

export const mockNotifications: CourseNotification[] = [
  {
    kind: 'join_invitation',
    from: 'Dr. Elena Vance',
    course: {
      title: 'Distributed Systems & High-Scale Cloud Architecture',
      url: '/view-course-profile/distributed-systems-architecture'
    },
    key: 'invite_token_123',
    date: Date.now() - 2 * 3600 * 1000
  },
  {
    kind: 'lesson_new',
    course: {
      title: 'Transformer Models & Multi-Modal Generative AI from Scratch',
      url: '/view-course-profile/deep-learning-transformers'
    },
    date: Date.now() - 8 * 3600 * 1000
  },
  {
    kind: 'join_request_accepted',
    course: {
      title: 'Enterprise Design Systems & Advanced Frontend Craft',
      url: '/view-course-profile/modern-design-systems-engineering'
    },
    date: Date.now() - 24 * 3600 * 1000
  }
];
