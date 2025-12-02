'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  StepIndicator,
  Step1Upload,
  Step2StyleSource,
  Step3Info,
} from '@/components/wizard';
import RecentGenerations from '@/components/RecentGenerations';
import MaterialLibrary from '@/components/MaterialLibrary';
import { CompetitorInfo, ProductInfo, GenerationMode } from '@/types';
import { DEFAULT_IMAGE_MODELS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';

const STEPS = [
  { number: 1, label: '上传实拍图' },
  { number: 2, label: '选择风格' },
  { number: 3, label: '完善信息' },
];

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showEntryCards, setShowEntryCards] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false);

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
  const [selectedTemplateThumbnail, setSelectedTemplateThumbnail] = useState<string | null>(null);

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

  // 处理URL参数传递的素材路径
  useEffect(() => {
    const materialPath = searchParams.get('materialPath');
    if (materialPath) {
      setProductImage(materialPath);
      setShowEntryCards(false);
      setCurrentStep(2); // 直接进入步骤2
      // 清除URL参数
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  // 处理素材库选择
  const handleMaterialSelect = (material: { path: string }) => {
    setProductImage(material.path);
    setShowMaterialLibrary(false);
    setShowEntryCards(false);
    setCurrentStep(2);
  };

  // 处理直接上传入口
  const handleDirectUpload = () => {
    setShowEntryCards(false);
    setCurrentStep(1);
  };

  // 处理模板选择
  const handleTemplateSelect = (templateId: string, templateName: string, templateThumbnail: string) => {
    setSelectedTemplateId(templateId);
    setSelectedTemplateName(templateName);
    setSelectedTemplateThumbnail(templateThumbnail);
  };

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            素材克隆大师
          </h1>
          <p className="text-gray-600 text-lg">
            AI 帮你生成专业的宠物商品图
          </p>
        </div>

        {/* 入口卡片（首次进入显示） */}
        {showEntryCards ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* 素材库入口 */}
              <div
                onClick={() => setShowMaterialLibrary(true)}
                className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">素材库</h2>
                  <p className="text-gray-500 text-sm">
                    从素材库选择图片开始生成流程
                  </p>
                </div>
              </div>

              {/* 直接上传入口 */}
              <div
                onClick={handleDirectUpload}
                className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-transparent hover:border-green-200"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">直接上传</h2>
                  <p className="text-gray-500 text-sm">
                    上传新图片开始生成流程
                  </p>
                </div>
              </div>
            </div>

            {/* 素材库管理入口 */}
            <div className="text-center mb-8">
              <button
                onClick={() => router.push('/materials')}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>管理素材库</span>
              </button>
            </div>

            {/* 最近生成 */}
            <RecentGenerations />

            {/* 素材库选择器 */}
            <MaterialLibrary
              isOpen={showMaterialLibrary}
              onClose={() => setShowMaterialLibrary(false)}
              onSelect={handleMaterialSelect}
              type="product"
            />
          </>
        ) : (
          <>
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
                onProductImageUpload={(path) => {
                  setProductImage(path);
                }}
                onNext={() => goToStep(2)}
                onOpenMaterialLibrary={() => setShowMaterialLibrary(true)}
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
                onTemplateSelect={handleTemplateSelect}
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
                selectedTemplateThumbnail={selectedTemplateThumbnail}
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

            {/* 返回入口卡片按钮 */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setShowEntryCards(true);
                  setCurrentStep(1);
                  setProductImage(null);
                  setCompetitorImage(null);
                  setSelectedTemplateId(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                返回首页
              </button>
            </div>

            {/* 素材库选择器（步骤1中使用） */}
            <MaterialLibrary
              isOpen={showMaterialLibrary}
              onClose={() => setShowMaterialLibrary(false)}
              onSelect={handleMaterialSelect}
              type="product"
            />
          </>
        )}
      </div>
    </main>
  );
}
