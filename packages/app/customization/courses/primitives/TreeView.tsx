/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { OutlineItem, NodeId, IconSlotFn } from '../types';
import { RenderIcon } from './IconSlot';
import { ProgressRing } from './ProgressRing';

export interface TreeViewProps {
  items: OutlineItem[];
  selectedNodeId?: NodeId;
  onSelectNode?: (node: OutlineItem) => void;
  onEditNode?: (nodeId: NodeId) => void;
  onDeleteNode?: (nodeId: NodeId) => void;
  onAddChild?: (parentNodeId: NodeId, kind: 'module' | 'theme' | 'lesson') => void;
  onMoveNode?: (nodeId: NodeId, dir: 'up' | 'down') => void;
  isEditable?: boolean;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function TreeView({
  items,
  selectedNodeId,
  onSelectNode,
  onEditNode,
  onDeleteNode,
  onAddChild,
  onMoveNode,
  isEditable = false,
  iconSlot,
  className = ''
}: TreeViewProps) {
  const [collapsedMap, setCollapsedMap] = useState<Record<number, boolean>>({});

  const toggleCollapse = (nodeId: NodeId, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedMap((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Group items by parentId
  const itemsByParent = new Map<number, OutlineItem[]>();
  items.forEach((item) => {
    const list = itemsByParent.get(item.parentId) || [];
    list.push(item);
    itemsByParent.set(item.parentId, list);
  });

  const renderNode = (item: OutlineItem, depth = 0) => {
    const children = itemsByParent.get(item.nodeId) || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedMap[item.nodeId] ?? false;
    const isSelected = item.nodeId === selectedNodeId;

    const getLevelIcon = () => {
      if (item.level === 1) return 'folder';
      if (item.level === 2) return 'layers';
      return item.locked ? 'lock' : 'book';
    };

    return (
      <div key={item.nodeId} className="flex flex-col">
        <div
          onClick={() => !item.locked && onSelectNode?.(item)}
          className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none group border ${
            isSelected
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
              : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
          } ${item.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ paddingLeft: `${Math.max(10, depth * 20 + 10)}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(item.nodeId, e)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <RenderIcon
                  name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                  className="w-3.5 h-3.5"
                  iconSlot={iconSlot}
                />
              </button>
            ) : (
              <span className="w-5" />
            )}

            <div className="text-slate-500 dark:text-slate-400 shrink-0">
              <RenderIcon name={getLevelIcon()} className="w-4 h-4" iconSlot={iconSlot} />
            </div>

            <span className="text-xs font-medium truncate">{item.title}</span>

            {item.locked && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                locked
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.progress && item.level === 3 && (
              <ProgressRing
                percent={item.progress.percent}
                size={22}
                strokeWidth={2.5}
                showText={false}
              />
            )}

            {isEditable && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onMoveNode && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveNode(item.nodeId, 'up');
                      }}
                      className="p-1 hover:text-blue-600 text-slate-400"
                      title="Move up"
                    >
                      <RenderIcon name="chevron-up" className="w-3 h-3" iconSlot={iconSlot} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveNode(item.nodeId, 'down');
                      }}
                      className="p-1 hover:text-blue-600 text-slate-400"
                      title="Move down"
                    >
                      <RenderIcon name="chevron-down" className="w-3 h-3" iconSlot={iconSlot} />
                    </button>
                  </div>
                )}

                {item.level < 3 && onAddChild && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChild(item.nodeId, item.level === 1 ? 'theme' : 'lesson');
                    }}
                    className="p-1 hover:text-blue-600 text-slate-400"
                    title={item.level === 1 ? 'Add Theme' : 'Add Lesson'}
                  >
                    <RenderIcon name="plus" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                  </button>
                )}

                {onEditNode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditNode(item.nodeId);
                    }}
                    className="p-1 hover:text-blue-600 text-slate-400"
                    title="Edit Node"
                  >
                    <RenderIcon name="edit" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                  </button>
                )}

                {onDeleteNode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(item.nodeId);
                    }}
                    className="p-1 hover:text-rose-600 text-slate-400"
                    title="Delete Node"
                  >
                    <RenderIcon name="trash" className="w-3.5 h-3.5" iconSlot={iconSlot} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Children subnodes */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootItems = itemsByParent.get(0) || [];

  return (
    <div className={`space-y-1 ${className}`}>
      {rootItems.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          No outline nodes available.
        </div>
      ) : (
        rootItems.map((item) => renderNode(item, 0))
      )}
    </div>
  );
}

export default TreeView;
