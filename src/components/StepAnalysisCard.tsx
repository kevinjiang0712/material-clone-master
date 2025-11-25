'use client';

import { useState } from 'react';
import { LayoutAnalysis, StyleAnalysis, ContentAnalysis } from '@/types';

interface StepAnalysisCardProps {
  stepNumber: number;
  title: string;
  description: string;
  data: LayoutAnalysis | StyleAnalysis | ContentAnalysis | null;
  type: 'layout' | 'style' | 'content';
}

export default function StepAnalysisCard({
  stepNumber,
  title,
  description,
  data,
  type,
}: StepAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">
            {stepNumber}
          </span>
          <div>
            <h4 className="font-medium text-gray-400">{title}</h4>
            <p className="text-sm text-gray-400">暂无数据</p>
          </div>
        </div>
      </div>
    );
  }

  const renderLayoutAnalysis = (layout: LayoutAnalysis) => (
    <div className="space-y-4">
      {/* 主体构图 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          主体构图
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">位置:</span>{' '}
            <span className="text-gray-800">{layout.main_object?.position}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">视角:</span>{' '}
            <span className="text-gray-800">{layout.main_object?.view_angle}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">大小:</span>{' '}
            <span className="text-gray-800">{layout.main_object?.size}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">裁切:</span>{' '}
            <span className="text-gray-800">{layout.main_object?.edge_crop ? '是' : '否'}</span>
          </div>
        </div>
      </div>

      {/* 背景结构 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          背景结构
        </h5>
        <div className="bg-gray-50 rounded px-3 py-2 text-sm">
          <span className="text-gray-500">类型:</span>{' '}
          <span className="text-gray-800">{layout.background_structure?.type}</span>
          {layout.background_structure?.layers?.length > 0 && (
            <div className="mt-1">
              <span className="text-gray-500">图层:</span>{' '}
              <span className="text-gray-800">{layout.background_structure.layers.join('、')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 图层顺序 */}
      {layout.layer_sequence?.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            图层顺序
          </h5>
          <div className="flex items-center gap-2 flex-wrap">
            {layout.layer_sequence.map((layer, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                  {layer}
                </span>
                {idx < layout.layer_sequence.length - 1 && (
                  <span className="text-gray-400">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStyleAnalysis = (style: StyleAnalysis) => (
    <div className="space-y-4">
      {/* 色彩风格 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500"></span>
          色彩风格
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">主色:</span>{' '}
            <span className="text-gray-800">{style.color_style?.primary_color}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">饱和度:</span>{' '}
            <span className="text-gray-800">{style.color_style?.saturation}</span>
          </div>
          {style.color_style?.secondary_colors?.length > 0 && (
            <div className="bg-gray-50 rounded px-3 py-2 col-span-2">
              <span className="text-gray-500">辅色:</span>{' '}
              <span className="text-gray-800">{style.color_style.secondary_colors.join('、')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 光影 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          光影效果
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">光线方向:</span>{' '}
            <span className="text-gray-800">{style.lighting?.direction}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">光线类型:</span>{' '}
            <span className="text-gray-800">{style.lighting?.type}</span>
          </div>
        </div>
      </div>

      {/* 整体氛围 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          整体氛围
        </h5>
        <div className="bg-indigo-50 rounded px-3 py-2 text-sm text-indigo-800">
          {style.vibe}
        </div>
      </div>

      {/* 风格提示词 */}
      {style.style_prompt && (
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            风格 Prompt
          </h5>
          <div className="bg-gray-50 rounded px-3 py-2 text-xs text-gray-600 italic">
            {style.style_prompt}
          </div>
        </div>
      )}
    </div>
  );

  const renderContentAnalysis = (content: ContentAnalysis) => (
    <div className="space-y-4">
      {/* 产品形状 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          产品形状
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">类别:</span>{' '}
            <span className="text-gray-800">{content.product_shape?.category}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">比例:</span>{' '}
            <span className="text-gray-800">{content.product_shape?.proportions}</span>
          </div>
        </div>
      </div>

      {/* 产品朝向 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          产品朝向
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">视角:</span>{' '}
            <span className="text-gray-800">{content.product_orientation?.view_angle}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">朝向:</span>{' '}
            <span className="text-gray-800">{content.product_orientation?.facing}</span>
          </div>
        </div>
      </div>

      {/* 材质信息 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          材质信息
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">材质:</span>{' '}
            <span className="text-gray-800">{content.product_surface?.material}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">光泽:</span>{' '}
            <span className="text-gray-800">{content.product_surface?.glossiness}</span>
          </div>
        </div>
      </div>

      {/* 色彩信息 */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          色彩信息
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">主色:</span>{' '}
            <span className="text-gray-800">{content.color_profile?.primary_color}</span>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2">
            <span className="text-gray-500">辅色:</span>{' '}
            <span className="text-gray-800">{content.color_profile?.secondary_color}</span>
          </div>
        </div>
      </div>

      {/* 瑕疵检测 */}
      {content.defects && content.defects.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            检测到的瑕疵
          </h5>
          <div className="flex flex-wrap gap-2">
            {content.defects.map((defect, idx) => (
              <span
                key={idx}
                className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs"
              >
                {defect}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const getStepColor = () => {
    switch (type) {
      case 'layout':
        return 'bg-blue-100 text-blue-600';
      case 'style':
        return 'bg-pink-100 text-pink-600';
      case 'content':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-full ${getStepColor()} flex items-center justify-center font-bold text-sm`}
          >
            {stepNumber}
          </span>
          <div className="text-left">
            <h4 className="font-medium text-gray-800">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4">
            {type === 'layout' && renderLayoutAnalysis(data as LayoutAnalysis)}
            {type === 'style' && renderStyleAnalysis(data as StyleAnalysis)}
            {type === 'content' && renderContentAnalysis(data as ContentAnalysis)}
          </div>
        </div>
      )}
    </div>
  );
}
