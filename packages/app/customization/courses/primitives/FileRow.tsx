/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from "app/ui/atoms/icon";
import type { Attachment } from '../types';

export interface FileRowProps {
  attachment: Attachment;
  onDownload?: (a: Attachment) => void;
  className?: string;
}

export function FileRow({
  attachment,
  onDownload,
  className = ''
}: FileRowProps) {
  const getFileIcon = (contentType?: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase() || '';
    if (['zip', 'tar', 'gz', 'rar'].includes(ext)) return <Icon icon="Archive" className="w-5 h-5 text-amber-500" />;
    if (['csv', 'xlsx', 'xls'].includes(ext)) return <Icon icon="Table" className="w-5 h-5 text-emerald-500" />;
    if (['ts', 'js', 'py', 'json', 'html', 'css'].includes(ext)) return <Icon icon="FileCode" className="w-5 h-5 text-blue-500" />;
    return <Icon icon="FileText" className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
  };

  const fileName = attachment.file?.name || attachment.title;
  const size = attachment.file?.sizeLabel;

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
          {getFileIcon(attachment.contentType, fileName)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {fileName}
          </div>
          {size && (
            <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
              {size}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDownload?.(attachment)}
        className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        title="Download Resource"
        aria-label={`Download ${fileName}`}
      >
        <Icon icon="Download" className="w-4 h-4" />
      </button>
    </div>
  );
}

export default FileRow;
