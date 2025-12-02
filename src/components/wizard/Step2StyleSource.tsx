'use client';

import ImageUploader from '../ImageUploader';
import ImagePreview from '../ImagePreview';
import TemplateGallery from './TemplateGallery';
import type { GenerationMode } from '@/types';

interface Step2StyleSourceProps {
  generationMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  // 竞品模式
  competitorImagePath: string | null;
  onCompetitorImageUpload: (path: string) => void;
  competitorName: string;
  onCompetitorNameChange: (name: string) => void;
  competitorCategory: string;
  onCompetitorCategoryChange: (category: string) => void;
  // 模板模式
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string, templateName: string, templateThumbnail: string) => void;
  // 导航
  onPrev: () => void;
  onNext: () => void;
}

export default function Step2StyleSource({
  generationMode,
  onModeChange,
  competitorImagePath,
  onCompetitorImageUpload,
  competitorName,
  onCompetitorNameChange,
  competitorCategory,
  onCompetitorCategoryChange,
  selectedTemplateId,
  onTemplateSelect,
  onPrev,
  onNext,
}: Step2StyleSourceProps) {
  // 判断是否可以进入下一步
  const canProceed = generationMode === 'competitor'
    ? !!competitorImagePath
    : !!selectedTemplateId;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        选择风格来源
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        选择如何定义生成图片的风格
      </p>

      {/* 模式选择 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ModeCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="上传竞品图"
          description="上传竞品商品图，AI学习其版式和风格"
          isSelected={generationMode === 'competitor'}
          onClick={() => onModeChange('competitor')}
        />
        <ModeCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          }
          title="选择风格模板"
          description="从预设模板中选择，快速开始"
          isSelected={generationMode === 'template'}
          onClick={() => onModeChange('template')}
        />
      </div>

      {/* 根据模式显示不同内容 */}
      {generationMode === 'competitor' ? (
        <div className="space-y-4">
          {/* 竞品图上传 */}
          {competitorImagePath ? (
            <div className="relative">
              <ImagePreview imagePath={competitorImagePath} alt="竞品图" />
              <button
                onClick={() => onCompetitorImageUpload('')}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 p-2 rounded-lg shadow-sm transition-colors"
                title="重新上传"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          ) : (
            <ImageUploader type="competitor" onUpload={onCompetitorImageUpload} />
          )}

          {/* 竞品信息（选填） */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">竞品信息（选填）</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  竞品名称
                </label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => onCompetitorNameChange(e.target.value)}
                  placeholder="如：某品牌猫粮"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  竞品类目
                </label>
                <input
                  type="text"
                  value={competitorCategory}
                  onChange={(e) => onCompetitorCategoryChange(e.target.value)}
                  placeholder="如：猫主粮"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <TemplateGallery
          selectedTemplateId={selectedTemplateId}
          onSelect={onTemplateSelect}
        />
      )}

      {/* 导航按钮 */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一步
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all
            flex items-center gap-2
            ${canProceed
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          下一步
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

function ModeCard({ icon, title, description, isSelected, onClick }: ModeCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
        }
      `}
    >
      <div className={`mb-3 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      <h3 className={`font-semibold mb-1 ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
        {title}
      </h3>
      <p className="text-sm text-gray-500">
        {description}
      </p>
      {/* 选中指示器 */}
      <div className="mt-3 flex items-center gap-2">
        <div className={`
          w-4 h-4 rounded-full border-2 flex items-center justify-center
          ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}
        `}>
          {isSelected && (
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className={`text-sm ${isSelected ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
          {isSelected ? '已选择' : '点击选择'}
        </span>
      </div>
    </div>
  );
}
