/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from 'app/ui/atoms/icon';
import type { IconSlotFn } from '../types';

/** kit icon key -> Lucide name accepted by the NEO Icon atom */
const ICON_MAP: Record<string, string> = {
    play: 'Play',
    check: 'Check',
    'check-circle': 'CircleCheck',
    lock: 'Lock',
    book: 'BookOpen',
    'book-open': 'BookOpen',
    user: 'User',
    users: 'Users',
    star: 'Star',
    heart: 'Heart',
    clock: 'Clock',
    search: 'Search',
    grid: 'LayoutGrid',
    list: 'List',
    sparkles: 'Sparkles',
    agent: 'Sparkles',
    ai: 'Sparkles',
    'chevron-right': 'ChevronRight',
    'chevron-left': 'ChevronLeft',
    'chevron-down': 'ChevronDown',
    'chevron-up': 'ChevronUp',
    download: 'Download',
    share: 'Share2',
    bookmark: 'Bookmark',
    favorite: 'Bookmark',
    message: 'MessageSquare',
    comments: 'MessageSquare',
    file: 'FileText',
    document: 'FileText',
    video: 'Video',
    image: 'Image',
    folder: 'Folder',
    module: 'Folder',
    layers: 'Layers',
    theme: 'Layers',
    settings: 'Settings',
    shield: 'Shield',
    admin: 'Shield',
    help: 'CircleQuestionMark',
    question: 'CircleQuestionMark',
    plus: 'Plus',
    add: 'Plus',
    trash: 'Trash',
    delete: 'Trash',
    edit: 'Pencil',
    external: 'ExternalLink',
    more: 'EllipsisVertical',
    menu: 'EllipsisVertical',
    like: 'ThumbsUp',
    alert: 'CircleAlert',
    warning: 'CircleAlert',
    close: 'X',
    'arrow-right': 'ArrowRight',
    rotate: 'RotateCcw',
    reset: 'RotateCcw',
    eye: 'Eye',
    send: 'Send',
    filter: 'SlidersHorizontal',
    info: 'Info'
};

export const defaultIconSlot: IconSlotFn = (name: string, className = 'w-4 h-4') => {
    const lucide = ICON_MAP[(name?.toLowerCase() || '')];
    if (!lucide) return null;
    return <Icon icon={lucide} className={className} aria-hidden />;
};

export function RenderIcon({
    name,
    className,
    iconSlot
}: {
    name?: string;
    className?: string;
    iconSlot?: IconSlotFn;
}) {
    if (!name) return null;
    const renderer = iconSlot || defaultIconSlot;
    return <>{renderer(name, className)}</>;
}
