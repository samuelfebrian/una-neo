/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OutlineEditor: Curriculum hierarchy authoring workbench with TreeView, node inspector, and reordering.
 */

import React, { useState } from 'react';
import type { Outline, OutlineItem, NodeId, TranslateFn, IconSlotFn } from '../types';
import { TreeView } from '../primitives/TreeView';
import { Button } from '../primitives/Button';
import { Modal } from '../primitives/Modal';
import { defaultT } from '../tokens/i18n';

export interface OutlineEditorProps {
  outline: Outline;
  selectedNodeId?: NodeId;
  onSelectNode?: (node: OutlineItem) => void;
  onAddNode?: (parentNodeId: NodeId, kind: 'module' | 'theme' | 'lesson', title: string) => void;
  onEditNode?: (nodeId: NodeId, updates: { title: string; textHtml?: string; passing?: 0 | 1 }) => void;
  onDeleteNode?: (nodeId: NodeId) => void;
  onMoveNode?: (nodeId: NodeId, dir: 'up' | 'down') => void;
  onOpenLessonEditor?: (nodeId: NodeId) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function OutlineEditor({
  outline,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onEditNode,
  onDeleteNode,
  onMoveNode,
  onOpenLessonEditor,
  t = defaultT,
  iconSlot,
  className = ''
}: OutlineEditorProps) {
  const [activeSelectedId, setActiveSelectedId] = useState<NodeId | undefined>(
    selectedNodeId ?? outline.items[0]?.nodeId
  );

  // Inspector form states
  const selectedItem = outline.items.find((i) => i.nodeId === activeSelectedId);
  const [editTitle, setEditTitle] = useState(selectedItem?.title ?? '');
  const [editTextHtml, setEditTextHtml] = useState(selectedItem?.textHtml ?? '');
  const [editPassing, setEditPassing] = useState<0 | 1>(selectedItem?.passing ?? 0);
  const [lastSyncedNodeId, setLastSyncedNodeId] = useState<NodeId | undefined>(selectedItem?.nodeId);

  // Adjust the inspector form to the selected item during render when the selection
  // changes (render-phase state adjustment - the React-approved alternative to
  // setState-in-effect, which the React compiler rejects).
  if (selectedItem && selectedItem.nodeId !== lastSyncedNodeId) {
    setLastSyncedNodeId(selectedItem.nodeId);
    setEditTitle(selectedItem.title);
    setEditTextHtml(selectedItem.textHtml ?? '');
    setEditPassing(selectedItem.passing ?? 0);
  }

  // Add child modal state
  const [addModal, setAddModal] = useState<{
    isOpen: boolean;
    parentNodeId: NodeId;
    kind: 'module' | 'theme' | 'lesson';
    title: string;
  }>({ isOpen: false, parentNodeId: 0, kind: 'module', title: '' });

  const handleSelect = (item: OutlineItem) => {
    setActiveSelectedId(item.nodeId);
    onSelectNode?.(item);
  };

  const handleSaveInspector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedId) return;
    onEditNode?.(activeSelectedId, {
      title: editTitle,
      textHtml: editTextHtml,
      passing: selectedItem?.level === 3 ? editPassing : undefined
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addModal.title.trim()) return;
    onAddNode?.(addModal.parentNodeId, addModal.kind, addModal.title.trim());
    setAddModal({ isOpen: false, parentNodeId: 0, kind: 'module', title: '' });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
            {t('authoring.outline.title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('authoring.outline.reorder_hint')}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon="plus"
          iconSlot={iconSlot}
          onClick={() =>
            setAddModal({
              isOpen: true,
              parentNodeId: 0,
              kind: 'module',
              title: ''
            })
          }
        >
          Add Top Module
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Tree Hierarchy */}
        <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Course Hierarchy</span>
            <span>{outline.items.length} nodes</span>
          </div>

          <TreeView
            items={outline.items}
            selectedNodeId={activeSelectedId}
            onSelectNode={handleSelect}
            onAddChild={(parentId, kind) =>
              setAddModal({ isOpen: true, parentNodeId: parentId, kind, title: '' })
            }
            onDeleteNode={onDeleteNode}
            onMoveNode={onMoveNode}
            isEditable={true}
            iconSlot={iconSlot}
          />
        </div>

        {/* Right column: Node Inspector */}
        <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xs">
          {selectedItem ? (
            <form onSubmit={handleSaveInspector} className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {selectedItem.level === 1
                      ? 'Module Inspector'
                      : selectedItem.level === 2
                      ? 'Theme Inspector'
                      : 'Lesson Inspector'}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID #{selectedItem.nodeId}
                  </span>
                </div>

                {selectedItem.level === 3 && onOpenLessonEditor && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon="edit"
                    iconSlot={iconSlot}
                    onClick={() => onOpenLessonEditor(selectedItem.nodeId)}
                  >
                    Edit Steps
                  </Button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Description / Overview
                </label>
                <textarea
                  rows={4}
                  value={editTextHtml}
                  onChange={(e) => setEditTextHtml(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedItem.level === 3 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPassing === 1}
                      onChange={(e) => setEditPassing(e.target.checked ? 1 : 0)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Sequential prerequisite lock
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <Button type="submit" variant="primary" size="sm">
                  {t('common.save')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Select a node from the outline to inspect and edit its properties.
            </div>
          )}
        </div>
      </div>

      {/* Add Node Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ ...addModal, isOpen: false })}
        title={`Add ${addModal.kind.toUpperCase()}`}
        iconSlot={iconSlot}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              {addModal.kind.charAt(0).toUpperCase() + addModal.kind.slice(1)} Title
            </label>
            <input
              type="text"
              placeholder={`e.g. Introduction to ${addModal.kind}`}
              value={addModal.title}
              onChange={(e) => setAddModal({ ...addModal, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddModal({ ...addModal, isOpen: false })}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default OutlineEditor;
