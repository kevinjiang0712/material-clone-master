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
    <div className="w-full">
      <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-secondary rounded-full"></span>
        选择风格来源
      </h2>
      <p className="text-sm text-muted mb-6 pl-3">
        选择如何定义生成图片的风格
      </p>

      {/* 模式选择 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
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
        <div className="space-y-6">
          {/* 竞品图上传 */}
          {competitorImagePath ? (
            <div className="relative group">
              <div className="rounded-xl overflow-hidden border border-card-border">
                <ImagePreview imagePath={competitorImagePath} alt="竞品图" />
              </div>
              <button
                onClick={() => onCompetitorImageUpload('')}
                className="absolute top-2 right-2 bg-card/90 hover:bg-danger/90 text-muted hover:text-white p-2 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 border border-card-border hover:border-danger"
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
          <div className="border-t border-card-border pt-6">
            <p className="text-sm text-muted mb-4">竞品信息（选填）</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  竞品名称
                </label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => onCompetitorNameChange(e.target.value)}
                  placeholder="如：某品牌猫粮"
                  className="w-full px-4 py-2.5 bg-background/50 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm text-foreground placeholder-muted transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  竞品类目
                </label>
                <input
                  type="text"
                  value={competitorCategory}
                  onChange={(e) => onCompetitorCategoryChange(e.target.value)}
                  placeholder="如：猫主粮"
                  className="w-full px-4 py-2.5 bg-background/50 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm text-foreground placeholder-muted transition-all"
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
      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 rounded-xl font-medium text-muted hover:text-foreground hover:bg-card transition-all flex items-center gap-2 border border-transparent hover:border-card-border"
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
            px-8 py-3 rounded-xl font-medium transition-all duration-300
            flex items-center gap-2
            ${canProceed
              ? 'bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5'
              : 'bg-card text-muted cursor-not-allowed border border-card-border'
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
        p-5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden group
        ${isSelected
          ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(52,89,149,0.15)]'
          : 'border-card-border bg-card/30 hover:border-primary/50 hover:bg-card/50'
        }
      `}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}

      <div className={`mb-4 transition-colors ${isSelected ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>
        {icon}
      </div>
      <h3 className={`font-semibold mb-2 text-lg transition-colors ${isSelected ? 'text-primary-foreground' : 'text-foreground group-hover:text-foreground'}`}>
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">
        {description}
      </p>
      {/* 选中指示器 */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`
          w-5 h-5 rounded-full border flex items-center justify-center transition-all
          ${isSelected ? 'border-primary bg-primary' : 'border-card-border group-hover:border-muted'}
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className={`text-sm transition-colors ${isSelected ? 'text-primary font-medium' : 'text-muted group-hover:text-muted'}`}>
          {isSelected ? '已选择' : '点击选择'}
        </span>
      </div>
    </div>
  );
}
