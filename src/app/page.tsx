'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  StepIndicator,
  Step1Upload,
  Step2StyleSource,
  Step3Info,
} from '@/components/wizard';
import TaskHistoryList from '@/components/TaskHistoryList';
import HistoryButton from '@/components/HistoryButton';
import { CompetitorInfo, ProductInfo, GenerationMode } from '@/types';
import { DEFAULT_IMAGE_MODELS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';

const STEPS = [
  { number: 1, label: '上传实拍图' },
  { number: 2, label: '选择风格' },
  { number: 3, label: '完善信息' },
];

export default function HomePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // 步骤1：实拍图
  const [productImage, setProductImage] = useState<string | null>(null);

  // 步骤2：风格来源
  const [generationMode, setGenerationMode] = useState<GenerationMode>('competitor');
  const [competitorImage, setCompetitorImage] = useState<string | null>(null);
  const [competitorInfo, setCompetitorInfo] = useState<CompetitorInfo>({
    competitorName: '',
    competitorCategory: '',
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);

  // 步骤3：商品信息和模型
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    productName: '',
    productCategory: '',
    sellingPoints: '',
    targetAudience: '',
    brandTone: [],
  });
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULT_IMAGE_MODELS);
  const [jimenResolution, setJimenResolution] = useState<string>(DEFAULT_JIMEN_RESOLUTION);

  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取选中模板的名称
  useEffect(() => {
    if (selectedTemplateId) {
      fetch('/api/templates')
        .then(res => res.json())
        .then(data => {
          const template = data.templates.find((t: { id: string; name: string }) => t.id === selectedTemplateId);
          if (template) {
            setSelectedTemplateName(template.name);
          }
        })
        .catch(() => {});
    } else {
      setSelectedTemplateName(null);
    }
  }, [selectedTemplateId]);

  // 步骤导航
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
    }
  };

  // 提交生成任务
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImagePath: productImage,
          generationMode,
          competitorImagePath: generationMode === 'competitor' ? competitorImage : undefined,
          competitorInfo: generationMode === 'competitor' ? competitorInfo : undefined,
          styleTemplateId: generationMode === 'template' ? selectedTemplateId : undefined,
          productInfo,
          selectedImageModels: selectedModels,
          jimenResolution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建任务失败');
      }

      router.push(`/result/${data.taskId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败，请重试');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <HistoryButton />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              素材克隆大师
            </h1>
            <p className="text-gray-600 text-lg">
              AI 帮你生成专业的宠物商品图
            </p>
          </div>

          {/* 步骤指示器 */}
          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={goToStep}
          />

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {/* 步骤内容 */}
          {currentStep === 1 && (
            <Step1Upload
              productImagePath={productImage}
              onProductImageUpload={setProductImage}
              onNext={() => goToStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2StyleSource
              generationMode={generationMode}
              onModeChange={setGenerationMode}
              competitorImagePath={competitorImage}
              onCompetitorImageUpload={setCompetitorImage}
              competitorName={competitorInfo.competitorName}
              onCompetitorNameChange={(name) => setCompetitorInfo({ ...competitorInfo, competitorName: name })}
              competitorCategory={competitorInfo.competitorCategory || ''}
              onCompetitorCategoryChange={(category) => setCompetitorInfo({ ...competitorInfo, competitorCategory: category })}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={setSelectedTemplateId}
              onPrev={() => goToStep(1)}
              onNext={() => goToStep(3)}
            />
          )}

          {currentStep === 3 && productImage && (
            <Step3Info
              generationMode={generationMode}
              productImagePath={productImage}
              competitorImagePath={competitorImage}
              selectedTemplateName={selectedTemplateName}
              productInfo={productInfo}
              onProductInfoChange={setProductInfo}
              selectedModels={selectedModels}
              onModelsChange={setSelectedModels}
              jimenResolution={jimenResolution}
              onJimenResolutionChange={setJimenResolution}
              onPrev={() => goToStep(2)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {/* 历史记录（仅在步骤1显示） */}
          {currentStep === 1 && (
            <div className="mt-12">
              <TaskHistoryList limit={6} showTitle={true} showLoadMore={false} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
