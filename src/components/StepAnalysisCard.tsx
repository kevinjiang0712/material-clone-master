'use client';

import { useState } from 'react';
import { LayoutAnalysis, StyleAnalysis, ContentAnalysis, CompetitorAnalysis, CopywritingAnalysis } from '@/types';

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
  duration?: number | null; // 耗时（毫秒）
}

// 模型类型图标组件
function ModelIcon({ type }: { type: 'vision' | 'image' | 'local' }) {
  if (type === 'vision') {
    return (
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9V7a2 2 0 012-2h4a2 2 0 012 2v2M8 9H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2M8 9h8M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" />
      </svg>
    );
  }
  if (type === 'image') {
    return (
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

// 判断是否为人民币计费（即梦/doubao 模型）
function isRMBModel(modelName?: string): boolean {
  if (!modelName) return false;
  return modelName.includes('jimen') || modelName.includes('doubao');
}

// 格式化耗时显示
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m${remainingSeconds.toFixed(0)}s`;
}

// 模型标签组件
function ModelTag({ modelName, type, cost, duration }: { modelName: string; type: 'vision' | 'image' | 'local'; cost?: number | null; duration?: number | null }) {
  const isRMB = isRMBModel(modelName);
  const currencySymbol = isRMB ? '¥' : '$';
  const decimals = isRMB ? 2 : 6;

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded-md">
        <ModelIcon type={type} />
        <span>{modelName}</span>
      </div>
      {cost !== undefined && cost !== null && (
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-mono px-2 py-1 rounded-md">
          <span>{currencySymbol}</span>
          <span>{cost.toFixed(decimals)}</span>
        </div>
      )}
      {duration !== undefined && duration !== null && (
        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-mono px-2 py-1 rounded-md">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDuration(duration)}</span>
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

// 信息项组件 - 更紧凑
function InfoItem({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-700 truncate">{value}</span>
    </div>
  );
}

// 标签组件
function Tag({ children, color = 'gray' }: { children: React.ReactNode; color?: 'blue' | 'green' | 'pink' | 'purple' | 'orange' | 'gray' | 'amber' | 'red' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

// 分析卡片组件 - 紧凑版
function AnalysisCard({
  icon,
  title,
  children,
  className = ''
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h5 className="text-sm font-semibold text-gray-700">{title}</h5>
      </div>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}

// 版式分析 - 精简版
function LayoutAnalysisCompact({ layout }: { layout: LayoutAnalysis }) {
  return (
    <AnalysisCard
      icon={<span className="w-2 h-2 rounded-full bg-blue-500"></span>}
      title="版式分析"
    >
      <div className="flex flex-wrap gap-1.5 mb-2">
        {layout.main_object?.position && <Tag color="blue">{layout.main_object.position}</Tag>}
        {layout.main_object?.view_angle && <Tag color="blue">{layout.main_object.view_angle}</Tag>}
        {layout.background_structure?.type && <Tag color="purple">{layout.background_structure.type}</Tag>}
        {layout.main_object?.edge_crop && <Tag color="gray">裁切</Tag>}
      </div>
      <InfoItem label="大小" value={layout.main_object?.size} />
      {layout.layer_sequence?.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          图层: {layout.layer_sequence.join(' → ')}
        </div>
      )}
    </AnalysisCard>
  );
}

// 风格分析 - 精简版
function StyleAnalysisCompact({ style }: { style: StyleAnalysis }) {
  return (
    <AnalysisCard
      icon={<span className="w-2 h-2 rounded-full bg-pink-500"></span>}
      title="风格分析"
    >
      <div className="flex flex-wrap gap-1.5 mb-2">
        {style.color_style?.primary_color && <Tag color="pink">{style.color_style.primary_color}</Tag>}
        {style.lighting?.type && <Tag color="orange">{style.lighting.type}</Tag>}
        {style.vibe && <Tag color="purple">{style.vibe}</Tag>}
      </div>
      <InfoItem label="光线方向" value={style.lighting?.direction} />
      <InfoItem label="饱和度" value={style.color_style?.saturation} />
      {style.color_style?.secondary_colors?.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          辅色: {style.color_style.secondary_colors.slice(0, 3).join('、')}
        </div>
      )}
    </AnalysisCard>
  );
}

// 内容分析 - 精简版
function ContentAnalysisCompact({ content }: { content: ContentAnalysis }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <AnalysisCard
        icon={<span className="w-2 h-2 rounded-full bg-orange-500"></span>}
        title="形状与朝向"
      >
        <div className="flex flex-wrap gap-1.5 mb-2">
          {content.product_shape?.category && <Tag color="orange">{content.product_shape.category}</Tag>}
          {content.product_orientation?.view_angle && <Tag color="blue">{content.product_orientation.view_angle}</Tag>}
          {content.product_orientation?.facing && <Tag color="green">{content.product_orientation.facing}</Tag>}
        </div>
        <InfoItem label="比例" value={content.product_shape?.proportions} />
      </AnalysisCard>

      <AnalysisCard
        icon={<span className="w-2 h-2 rounded-full bg-cyan-500"></span>}
        title="材质与色彩"
      >
        <div className="flex flex-wrap gap-1.5 mb-2">
          {content.product_surface?.material && <Tag color="gray">{content.product_surface.material}</Tag>}
          {content.color_profile?.primary_color && <Tag color="pink">{content.color_profile.primary_color}</Tag>}
        </div>
        <InfoItem label="光泽" value={content.product_surface?.glossiness} />
        <InfoItem label="辅色" value={content.color_profile?.secondary_color} />
      </AnalysisCard>

      {content.defects && content.defects.length > 0 && (
        <div className="col-span-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">检测瑕疵:</span>
            {content.defects.map((defect, idx) => (
              <Tag key={idx} color="red">{defect}</Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// OCR 识别结果 - 精简版
function OcrResultCompact({ ocrTexts }: { ocrTexts: string[] }) {
  if (!ocrTexts || ocrTexts.length === 0) {
    return (
      <AnalysisCard
        icon={<span className="w-2 h-2 rounded-full bg-cyan-500"></span>}
        title="OCR 识别结果"
      >
        <div className="text-xs text-gray-400">未识别到文字</div>
      </AnalysisCard>
    );
  }

  return (
    <AnalysisCard
      icon={<span className="w-2 h-2 rounded-full bg-cyan-500"></span>}
      title="OCR 识别结果"
    >
      {/* 来源标签 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
          百度 OCR
        </span>
        <span className="text-[10px] text-gray-400">{ocrTexts.length} 条</span>
      </div>
      {/* 文字列表 */}
      <div className="flex flex-wrap gap-1.5">
        {ocrTexts.map((text, idx) => (
          <span
            key={idx}
            className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded text-xs border border-cyan-200"
          >
            {text}
          </span>
        ))}
      </div>
    </AnalysisCard>
  );
}

// 文案分析 - 精简版
function CopywritingAnalysisCompact({ copywriting }: { copywriting: CopywritingAnalysis }) {
  return (
    <AnalysisCard
      icon={<span className="w-2 h-2 rounded-full bg-amber-500"></span>}
      title="文案与卖点"
    >
      {/* 核心卖点 */}
      {copywriting.selling_points?.main_selling_point && (
        <div className="bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 mb-2">
          <span className="text-xs text-emerald-600 font-medium">核心: </span>
          <span className="text-xs text-emerald-800">{copywriting.selling_points.main_selling_point}</span>
        </div>
      )}

      {/* 卖点标签 */}
      {copywriting.selling_points?.points && copywriting.selling_points.points.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {copywriting.selling_points.points.slice(0, 4).map((item, idx) => (
            <Tag key={idx} color="blue">{item.point}</Tag>
          ))}
          {copywriting.selling_points.points.length > 4 && (
            <span className="text-xs text-gray-400">+{copywriting.selling_points.points.length - 4}</span>
          )}
        </div>
      )}

      {/* 提取的文案 - 只显示前2条 */}
      {copywriting.text_content && copywriting.text_content.length > 0 && (
        <div className="space-y-1">
          {copywriting.text_content.slice(0, 2).map((item, idx) => (
            <div key={idx} className="text-xs flex items-start gap-1">
              <span className={`shrink-0 px-1 py-0.5 rounded text-[10px] ${
                item.emphasis === '高' ? 'bg-red-100 text-red-600' :
                item.emphasis === '中' ? 'bg-yellow-100 text-yellow-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {item.type}
              </span>
              <span className="text-gray-600 truncate">{item.text}</span>
            </div>
          ))}
          {copywriting.text_content.length > 2 && (
            <span className="text-xs text-gray-400">还有 {copywriting.text_content.length - 2} 条...</span>
          )}
        </div>
      )}

      {/* 目标用户 */}
      <div className="flex items-center gap-3 mt-2 text-xs">
        {copywriting.selling_points?.target_audience && (
          <span className="text-gray-500">
            目标: <span className="text-gray-700">{copywriting.selling_points.target_audience}</span>
          </span>
        )}
      </div>
    </AnalysisCard>
  );
}

// 竞品分析 - 双栏网格布局
function CompetitorAnalysisGrid({ competitor }: { competitor: CompetitorAnalysis }) {
  return (
    <div className="space-y-3">
      {/* 版式 + 风格 双栏 */}
      <div className="grid grid-cols-2 gap-3">
        {competitor.layout && <LayoutAnalysisCompact layout={competitor.layout} />}
        {competitor.style && <StyleAnalysisCompact style={competitor.style} />}
      </div>

      {/* 文案卖点 + OCR 识别结果 左右排布 */}
      <div className="grid grid-cols-2 gap-3">
        {competitor.copywriting && (
          <CopywritingAnalysisCompact copywriting={competitor.copywriting} />
        )}
        <OcrResultCompact ocrTexts={competitor.ocrTexts || []} />
      </div>
    </div>
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
  duration,
}: StepAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getModelIconType = (): 'vision' | 'image' | 'local' => {
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
              {modelName && <ModelTag modelName={modelName} type={getModelIconType()} cost={cost} duration={duration} />}
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
            {modelName && <ModelTag modelName={modelName} type={getModelIconType()} cost={cost} duration={duration} />}
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

      {/* 展开内容 - 使用新的紧凑布局 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4">
            {type === 'competitor' && <CompetitorAnalysisGrid competitor={data as CompetitorAnalysis} />}
            {type === 'content' && <ContentAnalysisCompact content={data as ContentAnalysis} />}
            {type === 'layout' && <LayoutAnalysisCompact layout={data as LayoutAnalysis} />}
            {type === 'style' && <StyleAnalysisCompact style={data as StyleAnalysis} />}
          </div>
        </div>
      )}
    </div>
  );
}
