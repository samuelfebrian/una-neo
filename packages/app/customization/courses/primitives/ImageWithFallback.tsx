/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Icon } from "app/ui/atoms/icon";

export interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  aspectRatio?: '16:9' | '16:7' | '4:3' | '1:1' | 'auto';
  focus?: { x: number; y: number };
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function ImageWithFallback({
  src,
  alt,
  aspectRatio = '16:9',
  focus,
  className = '',
  fallbackIcon
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(!src);

  const aspectClasses = {
    '16:9': 'aspect-[16/9]',
    '16:7': 'aspect-[16/7]',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    'auto': ''
  };

  const objectPosition = focus
    ? `${focus.x * 100}% ${focus.y * 100}%`
    : 'center';

  if (!src || hasError) {
    return (
      <div
        className={`w-full ${aspectClasses[aspectRatio]} bg-gradient-to-br from-slate-800 to-blue-950 flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden relative ${className}`}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 mb-2 backdrop-blur-xs">
          {fallbackIcon || <Icon icon="BookOpen" className="w-5 h-5" />}
        </div>
        <span className="text-xs font-medium text-slate-300 line-clamp-1 max-w-[80%]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${aspectClasses[aspectRatio]} overflow-hidden bg-slate-100 dark:bg-slate-800 relative ${className}`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300"
        style={{ objectPosition }}
      />
    </div>
  );
}

export default ImageWithFallback;
