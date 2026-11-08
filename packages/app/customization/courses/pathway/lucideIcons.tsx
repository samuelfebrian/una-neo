/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from 'app/ui/atoms/icon';

type LucideProps = { className?: string; style?: React.CSSProperties };

function lucide(name: string) {
  return function LucideIcon(props: LucideProps) {
    return <Icon icon={name} {...props} />;
  };
}

export const Lock = lucide('Lock');
export const CheckCircle2 = lucide('CheckCircle2');
export const Sparkles = lucide('Sparkles');
export const BookOpen = lucide('BookOpen');
export const Award = lucide('Award');
export const Briefcase = lucide('Briefcase');
export const Compass = lucide('Compass');
export const Plus = lucide('Plus');
export const Minus = lucide('Minus');
export const RotateCcw = lucide('RotateCcw');
export const Users = lucide('Users');
export const Navigation = lucide('Navigation');
export const Settings2 = lucide('Settings2');
export const X = lucide('X');
export const Unlock = lucide('Unlock');
export const Clock = lucide('Clock');
export const FolderGit2 = lucide('FolderGit2');
export const AlertCircle = lucide('AlertCircle');
export const MapPin = lucide('MapPin');
export const Check = lucide('Check');
