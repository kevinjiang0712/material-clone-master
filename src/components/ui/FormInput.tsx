'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export default function FormInput({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  rows = 3,
  className,
  disabled = false,
}: FormInputProps) {
  const inputClassName = cn(
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900',
    'placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'transition-all duration-200',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={cn(inputClassName, 'resize-none')}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
        />
      )}
    </div>
  );
}
