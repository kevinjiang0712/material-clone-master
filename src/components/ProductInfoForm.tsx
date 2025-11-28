'use client';

import { useState } from 'react';
import { ProductInfo } from '@/types';
import Input from './ui/Input';
import Select from './ui/Select';
import TagSelect from './ui/TagSelect';
import { cn } from '@/lib/utils';

interface ProductInfoFormProps {
  value: ProductInfo;
  onChange: (info: ProductInfo) => void;
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

const BRAND_TONE_OPTIONS = ['简约', '高端', '活力', '温馨', '科技感', '国潮'];

export default function ProductInfoForm({ value, onChange }: ProductInfoFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = <K extends keyof ProductInfo>(field: K, fieldValue: ProductInfo[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-3">
      {/* 商品名称 - 始终显示 */}
      <Input
        label="商品名称"
        placeholder="如：小米无线蓝牙耳机"
        value={value.productName}
        onChange={(v) => updateField('productName', v)}
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
        更多商品信息（可选）
      </button>

      {/* 折叠区域 */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-3 pt-2">
          <Select
            label="商品类目"
            options={CATEGORY_OPTIONS}
            value={value.productCategory || ''}
            onChange={(v) => updateField('productCategory', v)}
            placeholder="选择商品类目"
          />

          <Input
            label="核心卖点"
            placeholder="1-3个主要卖点，每行一个"
            value={value.sellingPoints || ''}
            onChange={(v) => updateField('sellingPoints', v)}
            multiline
            rows={3}
          />

          <Input
            label="目标人群"
            placeholder="如：年轻白领、运动爱好者"
            value={value.targetAudience || ''}
            onChange={(v) => updateField('targetAudience', v)}
          />

          <TagSelect
            label="品牌调性"
            options={BRAND_TONE_OPTIONS}
            selected={value.brandTone || []}
            onChange={(v) => updateField('brandTone', v)}
          />
        </div>
      </div>
    </div>
  );
}
