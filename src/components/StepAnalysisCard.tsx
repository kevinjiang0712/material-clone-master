'use client';

import { useState } from 'react';
import { LayoutAnalysis, StyleAnalysis, ContentAnalysis, CompetitorAnalysis } from '@/types';

type StepStatus = 'completed' | 'in_progress' | 'pending';

interface StepAnalysisCardProps {
  stepNumber: number;
  title: string;
  description: string;
  data: LayoutAnalysis | StyleAnalysis | ContentAnalysis | CompetitorAnalysis | null;
  type: 'layout' | 'style' | 'content' | 'competitor';
  modelName?: string;
  stepStatus?: StepStatus;
  cost?: number | null;
}

// 模型类型图标组件
function ModelIcon({ type }: { type: 'vision' | 'image' | 'local' }) {
  if (type === 'vision') {
    // CPU/芯片图标 - 表示 AI 分析
    return (
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9V7a2 2 0 012-2h4a2 2 0 012 2v2M8 9H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2M8 9h8M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" />
      </svg>
    );
  }
  if (type === 'image') {
    // 图片图标 - 表示图像生成
    return (
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    );
  }
  // 代码图标 - 表示本地处理
  return (
    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

// 模型标签组件
function ModelTag({ modelName, type, cost }: { modelName: string; type: 'vision' | 'image' | 'local'; cost?: number | null }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded-md">
        <ModelIcon type={type} />
        <span>{modelName}</span>
      </div>
      {cost !== undefined && cost !== null && (
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-mono px-2 py-1 rounded-md">
          <span>$</span>
          <span>{cost.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}

// 步骤状态徽章组件
function StepStatusBadge({ status }: { status: StepStatus }) {
  if (status === 'completed') {
    return (
      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        已完成
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        进行中
      </span>
    );
  }
  return (
    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">
      等待中
    </span>
  );
}

export default function StepAnalysisCard({
  stepNumber,
  title,
  description,
  data,
  type,
  modelName,
  stepStatus = 'completed',
  cost,
}: StepAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 根据类型确定模型图标类型
  const getModelIconType = (): 'vision' | 'image' | 'local' => {
    if (type === 'competitor' || type === 'content' || type === 'layout' || type === 'style') {
      return 'vision';
    }
    return 'vision';
  };

  // 等待中状态
  if (stepStatus === 'pending') {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-sm">
              {stepNumber}
            </span>
            <div>
              <h4 className="font-medium text-gray-400">{title}</h4>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          <StepStatusBadge status="pending" />
        </div>
      </div>
    );
  }

  // 进行中状态
  if (stepStatus === 'in_progress') {
    return (
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              {stepNumber}
            </span>
            <div>
              <h4 className="font-medium text-gray-800">{title}</h4>
              <p className="text-sm text-gray-500">{description}</p>
              {modelName && <ModelTag modelName={modelName} type={getModelIconType()} cost={cost} />}
            </div>
          </div>
          <StepStatusBadge status="in_progress" />
        </div>
      </div>
    );
  }

  // 已完成但无数据
  if (!data) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
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

  const renderCompetitorAnalysis = (competitor: CompetitorAnalysis) => (
    <div className="space-y-6">
      {/* 版式分析 */}
      <div>
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          版式分析
        </h4>
        {competitor.layout && renderLayoutAnalysis(competitor.layout)}
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-200"></div>

      {/* 风格分析 */}
      <div>
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink-500"></span>
          风格分析
        </h4>
        {competitor.style && renderStyleAnalysis(competitor.style)}
      </div>
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
      case 'competitor':
        return 'bg-indigo-100 text-indigo-600';
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
            {modelName && <ModelTag modelName={modelName} type={getModelIconType()} cost={cost} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StepStatusBadge status="completed" />
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
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4">
            {type === 'layout' && renderLayoutAnalysis(data as LayoutAnalysis)}
            {type === 'style' && renderStyleAnalysis(data as StyleAnalysis)}
            {type === 'content' && renderContentAnalysis(data as ContentAnalysis)}
            {type === 'competitor' && renderCompetitorAnalysis(data as CompetitorAnalysis)}
          </div>
        </div>
      )}
    </div>
  );
}
