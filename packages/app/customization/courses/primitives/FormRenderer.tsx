/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FormPayload, FormInput, TranslateFn, IconSlotFn } from '../types';
import { Button } from './Button';
import { defaultT } from '../tokens/i18n';

export interface FormRendererProps {
  form: FormPayload;
  onSubmit: (values: Record<string, unknown>) => Promise<{ ok: boolean; errors?: Record<string, string> } | void>;
  onCancel?: () => void;
  hideSubmit?: boolean;
  t?: TranslateFn;
  iconSlot?: IconSlotFn;
  className?: string;
}

export function FormRenderer({
  form,
  onSubmit,
  onCancel,
  hideSubmit = false,
  t = defaultT,
  className = ''
}: FormRendererProps) {
  const initialValues: Record<string, unknown> = {};
  form.inputs.forEach((input) => {
    initialValues[input.name] = input.value ?? (input.type === 'switcher' || input.type === 'checkbox' ? false : '');
  });

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const newErrors: Record<string, string> = {};
    form.inputs.forEach((input) => {
      if (input.required && (!values[input.name] || values[input.name] === '')) {
        newErrors[input.name] = `${input.caption || input.name} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit(values);
      if (res && !res.ok && res.errors) {
        setErrors(res.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (input: FormInput) => {
    const errorMsg = errors[input.name] || input.error;

    if (input.type === 'hidden') {
      return (
        <input
          key={input.name}
          type="hidden"
          name={input.name}
          value={String(values[input.name] ?? '')}
        />
      );
    }

    return (
      <div key={input.name} className="space-y-1.5">
        {input.type !== 'checkbox' && input.type !== 'switcher' && (
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            {input.caption || input.name}
            {input.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        {input.type === 'text' && (
          <input
            type="text"
            name={input.name}
            placeholder={input.placeholder}
            value={String(values[input.name] ?? '')}
            onChange={(e) => handleChange(input.name, e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        )}

        {input.type === 'textarea' && (
          <textarea
            name={input.name}
            rows={input.attrs?.rows ? Number(input.attrs.rows) : 4}
            placeholder={input.placeholder}
            value={String(values[input.name] ?? '')}
            onChange={(e) => handleChange(input.name, e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        )}

        {input.type === 'select' && (
          <select
            name={input.name}
            value={String(values[input.name] ?? '')}
            onChange={(e) => handleChange(input.name, e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {input.placeholder && <option value="">{input.placeholder}</option>}
            {input.values?.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.value}
              </option>
            ))}
          </select>
        )}

        {input.type === 'switcher' && (
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={Boolean(values[input.name])}
              onChange={(e) => handleChange(input.name, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-slate-700 peer-checked:bg-blue-600 relative" />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 select-none">
              {input.caption}
            </span>
          </label>
        )}

        {input.type === 'checkbox' && (
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={Boolean(values[input.name])}
              onChange={(e) => handleChange(input.name, e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 select-none">
              {input.caption}
            </span>
          </label>
        )}

        {input.type === 'files' && (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center bg-slate-50/50 dark:bg-slate-800/30">
            <input
              type="file"
              id={input.name}
              multiple={input.multiple}
              accept={input.accept}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleChange(input.name, Array.from(files).map((f) => f.name).join(', '));
                }
              }}
              className="hidden"
            />
            <label
              htmlFor={input.name}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium cursor-pointer"
            >
              Choose file(s) or drag & drop here
            </label>
            {Boolean(values[input.name]) && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-mono">
                Selected: {String(values[input.name])}
              </p>
            )}
          </div>
        )}

        {input.info && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {input.info}
          </p>
        )}

        {errorMsg && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {form.title && (
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display pb-2 border-b border-slate-100 dark:border-slate-800">
          {form.title}
        </h4>
      )}

      <div className="space-y-3.5">
        {form.inputs.map((input) => renderInput(input))}
      </div>

      {!hideSubmit && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSubmitting}
          >
            {t('common.save')}
          </Button>
        </div>
      )}
    </form>
  );
}

export default FormRenderer;
