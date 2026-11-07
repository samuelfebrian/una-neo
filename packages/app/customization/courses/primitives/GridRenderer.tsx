/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { AuthoringGrid, GridCell, GridAction, TranslateFn, IconSlotFn } from '../types';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Modal } from './Modal';
import { RenderIcon } from './IconSlot';
import { defaultT } from '../tokens/i18n';

export interface GridRendererProps {
  grid: AuthoringGrid;
  onActionClick?: (actionName: string, rowId?: number, action?: GridAction) => void;
  onCellToggle?: (rowId: number, columnKey: string, newValue: boolean) => void;
  onBulkAction?: (actionName: string, selectedRowIds: number[]) => void;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function GridRenderer({
  grid,
  onActionClick,
  onCellToggle,
  onBulkAction,
  t = defaultT,
  iconSlot,
  className = ''
}: GridRendererProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionName: string;
    rowId?: number;
    action?: GridAction;
  }>({ isOpen: false, actionName: '' });

  const toggleSelectAll = () => {
    if (selectedIds.length === grid.rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(grid.rows.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleActionTrigger = (actionName: string, rowId?: number, action?: GridAction) => {
    if (action?.confirm) {
      setConfirmModal({
        isOpen: true,
        actionName,
        rowId,
        action
      });
    } else {
      onActionClick?.(actionName, rowId, action);
    }
  };

  const executeConfirmedAction = () => {
    if (confirmModal.actionName) {
      onActionClick?.(confirmModal.actionName, confirmModal.rowId, confirmModal.action);
    }
    setConfirmModal({ isOpen: false, actionName: '' });
  };

  const renderCellContent = (cell: GridCell, rowId: number, colKey: string) => {
    switch (cell.type) {
      case 'text':
        return <span className="text-xs text-slate-800 dark:text-slate-200">{cell.value}</span>;
      case 'link':
        return (
          <a
            href={cell.url}
            onClick={(e) => {
              e.preventDefault();
              handleActionTrigger('open_link', rowId, { name: 'open_link', url: cell.url, kind: 'link' });
            }}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {cell.text}
          </a>
        );
      case 'profile':
        return (
          <div className="flex items-center gap-2">
            <Avatar src={cell.data.avatarUrl} name={cell.data.name} size="xs" />
            <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
              {cell.data.name}
            </span>
          </div>
        );
      case 'time':
        return (
          <span className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
            {new Date(cell.value < 1e11 ? cell.value * 1000 : cell.value).toLocaleDateString()}
          </span>
        );
      case 'switcher':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={cell.on}
              onChange={(e) => onCellToggle?.(rowId, colKey, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:bg-slate-700 peer-checked:bg-blue-600 relative" />
          </label>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(rowId)}
            onChange={() => toggleSelectRow(rowId)}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
        );
      case 'order':
        return (
          <span className="font-mono tabular-nums text-xs text-slate-400 font-medium">
            #{cell.value}
          </span>
        );
      case 'counters':
        return (
          <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {cell.value}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-1 justify-end">
            {cell.actions.map((act) => (
              <button
                key={act.name}
                type="button"
                onClick={() => handleActionTrigger(act.name, rowId, act)}
                className="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={act.title || act.name}
              >
                {act.title || act.name}
              </button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bulk actions strip if items selected */}
      {selectedIds.length > 0 && grid.actions.bulk && grid.actions.bulk.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
          <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
            {selectedIds.length} row(s) selected
          </span>
          <div className="flex items-center gap-2">
            {grid.actions.bulk.map((bAct) => (
              <Button
                key={bAct.name}
                variant={bAct.name.includes('delete') ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => {
                  if (bAct.confirm) {
                    setConfirmModal({
                      isOpen: true,
                      actionName: bAct.name,
                      action: bAct
                    });
                  } else {
                    onBulkAction?.(bAct.name, selectedIds);
                  }
                }}
              >
                {bAct.title || bAct.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={grid.rows.length > 0 && selectedIds.length === grid.rows.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                {grid.header.map((col) => (
                  <th
                    key={col.name}
                    style={{ width: col.width || 'auto' }}
                    className="p-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {grid.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={grid.header.length + 1}
                    className="text-center py-8 text-xs text-slate-400"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                grid.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      selectedIds.includes(row.id) ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        aria-label={`Select row ${row.id}`}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    {grid.header.map((col) => (
                      <td key={col.name} className="p-3.5 text-xs align-middle">
                        {row.cells[col.name]
                          ? renderCellContent(row.cells[col.name] as GridCell, row.id, col.name)
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, actionName: '' })}
        title={t('common.confirm')}
        description={`Are you sure you want to proceed with "${confirmModal.action?.title || confirmModal.actionName}"?`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmModal({ isOpen: false, actionName: '' })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={executeConfirmedAction}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
        iconSlot={iconSlot}
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          This operation will be performed immediately and may modify or remove relevant data records.
        </p>
      </Modal>
    </div>
  );
}

export default GridRenderer;
