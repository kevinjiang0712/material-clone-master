'use client';

import { useState } from 'react';
import { CompetitorInfo } from '@/types';
import Input from './ui/Input';
import Select from './ui/Select';
import { cn } from '@/lib/utils';

interface CompetitorInfoFormProps {
  value: CompetitorInfo;
  onChange: (info: CompetitorInfo) => void;
}

const CATEGORY_OPTIONS = [
  { label: '数码3C', value: '数码3C' },
  { label: '美妆护肤', value: '美妆护肤' },
  { label: '食品饮料', value: '食品饮料' },
  { label: '家居日用', value: '家居日用' },
  { label: '服饰鞋包', value: '服饰鞋包' },
  { label: '母婴用品', value: '母婴用品' },
  { label: '其他', value: '其他' },
];

export default function CompetitorInfoForm({ value, onChange }: CompetitorInfoFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = <K extends keyof CompetitorInfo>(field: K, fieldValue: CompetitorInfo[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-3">
      {/* 竞品名称 - 始终显示 */}
      <Input
        label="竞品名称"
        placeholder="如：竞品A蓝牙耳机"
        value={value.competitorName}
        onChange={(v) => updateField('competitorName', v)}
      />

      {/* 折叠按钮 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
      >
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        更多信息（可选）
      </button>

      {/* 折叠区域 */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-3 pt-2">
          <Select
            label="商品类目"
            options={CATEGORY_OPTIONS}
            value={value.competitorCategory || ''}
            onChange={(v) => updateField('competitorCategory', v)}
            placeholder="选择商品类目"
          />
        </div>
      </div>
    </div>
  );
}
