'use client';

import { useState } from 'react';
import Image from 'next/image';
import ModelSelector from '../ModelSelector';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TagSelect from '../ui/TagSelect';
import type { ProductInfo, GenerationMode } from '@/types';

interface Step3InfoProps {
  // 已选内容预览
  generationMode: GenerationMode;
  productImagePath: string;
  competitorImagePath?: string | null;
  selectedTemplateName?: string | null;
  // 商品信息
  productInfo: ProductInfo;
  onProductInfoChange: (info: ProductInfo) => void;
  // 模型选择
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  // 即梦分辨率
  jimenResolution: string;
  onJimenResolutionChange: (resolution: string) => void;
  // 导航
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const PET_CATEGORY_OPTIONS = [
  { label: '猫主粮', value: '猫主粮' },
  { label: '猫零食', value: '猫零食' },
  { label: '猫用品', value: '猫用品' },
  { label: '猫洗护', value: '猫洗护' },
  { label: '狗主粮', value: '狗主粮' },
  { label: '狗零食', value: '狗零食' },
  { label: '狗用品', value: '狗用品' },
  { label: '狗洗护', value: '狗洗护' },
  { label: '小宠用品', value: '小宠用品' },
  { label: '其他', value: '其他' },
];

const BRAND_TONE_OPTIONS = ['专业', '亲和', '高端', '活力', '自然', '温馨'];

export default function Step3Info({
  generationMode,
  productImagePath,
  competitorImagePath,
  selectedTemplateName,
  productInfo,
  onProductInfoChange,
  selectedModels,
  onModelsChange,
  jimenResolution,
  onJimenResolutionChange,
  onPrev,
  onSubmit,
  isSubmitting,
}: Step3InfoProps) {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const updateField = <K extends keyof ProductInfo>(field: K, value: ProductInfo[K]) => {
    onProductInfoChange({ ...productInfo, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* 已选内容预览 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          已选内容
        </h2>
        <div className="flex gap-4">
          {/* 实拍图预览 */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">产品实拍图</p>
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
              <Image
                src={productImagePath}
                alt="产品实拍图"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />
            </div>
          </div>

          {/* 风格预览 */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">
              {generationMode === 'competitor' ? '竞品参考图' : '风格模板'}
            </p>
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
              {generationMode === 'competitor' && competitorImagePath ? (
                <Image
                  src={competitorImagePath}
                  alt="竞品参考图"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-50">
                  <svg className="w-12 h-12 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <p className="text-sm font-medium text-purple-600">{selectedTemplateName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 商品信息（选填） */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              商品信息
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              选填，可直接跳过开始生成
            </p>
          </div>
          <button
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            {isInfoExpanded ? '收起' : '展开'}
            <svg
              className={`w-4 h-4 transition-transform ${isInfoExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 商品名称 - 始终显示 */}
        <Input
          label="商品名称"
          placeholder="如：皇家猫粮成猫通用型"
          value={productInfo.productName}
          onChange={(v) => updateField('productName', v)}
        />

        {/* 折叠区域 */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isInfoExpanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="商品类目"
                options={PET_CATEGORY_OPTIONS}
                value={productInfo.productCategory || ''}
                onChange={(v) => updateField('productCategory', v)}
                placeholder="选择商品类目"
              />
              <Input
                label="目标人群"
                placeholder="如：年轻养猫人群"
                value={productInfo.targetAudience || ''}
                onChange={(v) => updateField('targetAudience', v)}
              />
            </div>

            <Input
              label="核心卖点"
              placeholder="1-3个主要卖点"
              value={productInfo.sellingPoints || ''}
              onChange={(v) => updateField('sellingPoints', v)}
              multiline
              rows={2}
            />

            <TagSelect
              label="品牌调性"
              options={BRAND_TONE_OPTIONS}
              selected={productInfo.brandTone || []}
              onChange={(v) => updateField('brandTone', v)}
            />
          </div>
        </div>
      </div>

      {/* 模型选择 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          选择生成模型
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          可多选，将并行生成多张图片进行对比
        </p>
        <ModelSelectorInline
          selectedModels={selectedModels}
          onChange={onModelsChange}
          jimenResolution={jimenResolution}
          onResolutionChange={onJimenResolutionChange}
        />
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一步
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`
            px-8 py-3 rounded-xl font-medium transition-all
            flex items-center gap-2
            ${isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-200'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              生成中...
            </>
          ) : (
            <>
              开始生成
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// 内联版模型选择器（不带外框）
import { AVAILABLE_IMAGE_MODELS, MAX_SELECTED_MODELS, JIMEN_RESOLUTION_OPTIONS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';

interface ModelSelectorInlineProps {
  selectedModels: string[];
  onChange: (models: string[]) => void;
  jimenResolution?: string;
  onResolutionChange?: (resolution: string) => void;
}

function ModelSelectorInline({
  selectedModels,
  onChange,
  jimenResolution = DEFAULT_JIMEN_RESOLUTION,
  onResolutionChange,
}: ModelSelectorInlineProps) {
  const handleToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      if (selectedModels.length > 1) {
        onChange(selectedModels.filter(id => id !== modelId));
      }
    } else {
      if (selectedModels.length < MAX_SELECTED_MODELS) {
        onChange([...selectedModels, modelId]);
      }
    }
  };

  const jimenModels = AVAILABLE_IMAGE_MODELS.filter(m => m.provider === 'jimen');
  const openrouterModels = AVAILABLE_IMAGE_MODELS.filter(m => m.provider === 'openrouter');

  // 检查是否选中了即梦模型
  const hasJimenSelected = selectedModels.some(id => id.startsWith('jimen:'));

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 text-right">
        已选 {selectedModels.length}/{MAX_SELECTED_MODELS}
      </div>

      {/* 即梦模型 */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          即梦 (Doubao)
        </div>
        <div className="grid grid-cols-2 gap-2">
          {jimenModels.map(model => (
            <ModelCheckboxCompact
              key={model.id}
              model={model}
              checked={selectedModels.includes(model.id)}
              disabled={!selectedModels.includes(model.id) && selectedModels.length >= MAX_SELECTED_MODELS}
              onChange={() => handleToggle(model.id)}
            />
          ))}
        </div>

        {/* 即梦分辨率选择器 */}
        {hasJimenSelected && onResolutionChange && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-xs font-medium text-gray-600 mb-2">输出分辨率</div>
            <div className="flex gap-2 flex-wrap">
              {JIMEN_RESOLUTION_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onResolutionChange(option.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all
                    ${jimenResolution === option.id
                      ? 'border-orange-400 bg-orange-100 text-orange-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  <span className="font-medium">{option.name}</span>
                  <span className="text-gray-400 ml-1">({option.size}×{option.size})</span>
                  {option.id === '2k' && (
                    <span className="ml-1 text-orange-500">推荐</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OpenRouter 模型 */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          OpenRouter
        </div>
        <div className="grid grid-cols-2 gap-2">
          {openrouterModels.map(model => (
            <ModelCheckboxCompact
              key={model.id}
              model={model}
              checked={selectedModels.includes(model.id)}
              disabled={!selectedModels.includes(model.id) && selectedModels.length >= MAX_SELECTED_MODELS}
              onChange={() => handleToggle(model.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ModelCheckboxCompactProps {
  model: {
    id: string;
    displayName: string;
    description?: string;
  };
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

function ModelCheckboxCompact({ model, checked, disabled, onChange }: ModelCheckboxCompactProps) {
  return (
    <label
      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer
        ${checked
          ? 'border-purple-300 bg-purple-50'
          : disabled
            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-purple-200'
        }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
      />
      <span className="text-sm text-gray-700 truncate">{model.displayName}</span>
    </label>
  );
}
