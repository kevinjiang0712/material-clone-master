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
import { CompetitorInfo, ProductInfo, GenerationMode, MaterialInfo } from '@/types';
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

  // 步骤1：实拍图（改为数组，支持多选）
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialInfo[]>([]);
  const isBatchMode = selectedMaterials.length > 1;

  // 步骤2：风格来源（默认选中风格模板生成，并默认选中POPOCOLA简约风）
  const [generationMode, setGenerationMode] = useState<GenerationMode>('template');
  const [competitorImage, setCompetitorImage] = useState<string | null>(null);
  const [competitorInfo, setCompetitorInfo] = useState<CompetitorInfo>({
    competitorName: '',
    competitorCategory: '',
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('popocola-simple-practical');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>('POPOCOLA简约实用风');
  const [selectedTemplateThumbnail, setSelectedTemplateThumbnail] = useState<string | null>('/templates/popocola.jpg');

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  // 处理URL参数传递的素材路径和名称
  useEffect(() => {
    const materialPath = searchParams.get('materialPath');
    const materialName = searchParams.get('materialName');
    if (materialPath) {
      const material: MaterialInfo = {
        id: `url-${Date.now()}`,
        name: materialName || null,
        path: materialPath,
      };
      setSelectedMaterials([material]);
      // 如果有素材名称，预填充到商品名称
      if (materialName) {
        setProductInfo(prev => ({ ...prev, productName: materialName }));
      }
      setShowEntryCards(false);
      setCurrentStep(2); // 直接进入步骤2
      // 清除URL参数
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  // Handle entry card selection
  const handleEntrySelect = (type: 'library' | 'upload') => {
    if (type === 'library') {
      setShowMaterialLibrary(true);
    } else {
      setShowEntryCards(false);
      setCurrentStep(1);
    }
  };

  // 处理素材库多选
  const handleMultiMaterialSelect = (materials: { id: string; name: string | null; path: string }[]) => {
    const materialInfos: MaterialInfo[] = materials.map(m => ({
      id: m.id,
      name: m.name,
      path: m.path,
    }));
    setSelectedMaterials(materialInfos);
    setShowMaterialLibrary(false);
    setShowEntryCards(false);
    setCurrentStep(selectedMaterials.length > 0 ? currentStep : 1);
  };

  // 处理素材库单选（兼容旧逻辑）
  const handleSingleMaterialSelect = (material: { id: string; name: string | null; path: string }) => {
    handleMultiMaterialSelect([material]);
    // 如果素材有名称，预填充到商品名称
    if (material.name) {
      setProductInfo(prev => ({ ...prev, productName: material.name || '' }));
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    if (currentStep === 1) {
      setShowEntryCards(true);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isBatchMode) {
        // 批量任务
        const response = await fetch('/api/batch/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materials: selectedMaterials,
            generationMode: generationMode,
            competitorImagePath: generationMode === 'competitor' ? competitorImage : undefined,
            competitorInfo: generationMode === 'competitor' ? competitorInfo : undefined,
            styleTemplateId: generationMode === 'template' ? selectedTemplateId : undefined,
            productInfo: {
              productCategory: productInfo.productCategory,
              sellingPoints: productInfo.sellingPoints,
              targetAudience: productInfo.targetAudience,
              brandTone: productInfo.brandTone,
            },
            selectedImageModels: selectedModels,
            jimenResolution: jimenResolution,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '创建批量任务失败');
        }

        // 成功后跳转到批量结果页面
        router.push(`/batch/${data.batchTaskId}`);
      } else {
        // 单任务
        const response = await fetch('/api/task/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productImagePath: selectedMaterials[0]?.path,
            generationMode: generationMode,
            competitorImagePath: generationMode === 'competitor' ? competitorImage : undefined,
            competitorInfo: generationMode === 'competitor' ? competitorInfo : undefined,
            styleTemplateId: generationMode === 'template' ? selectedTemplateId : undefined,
            productInfo: productInfo,
            selectedImageModels: selectedModels,
            jimenResolution: jimenResolution,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '创建任务失败');
        }

        // 成功后跳转到结果页面
        router.push(`/result/${data.taskId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败');
      alert(err instanceof Error ? err.message : '创建任务失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取第一张图片路径（用于兼容旧组件）
  const firstImagePath = selectedMaterials.length > 0 ? selectedMaterials[0].path : '';

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-gray-900">
            AI Product Photography
          </h1>
          <p className="text-lg text-gray-500 font-normal max-w-2xl mx-auto">
            Create professional product visuals with artistic precision.
          </p>
        </div>

        {showEntryCards ? (
          <div className="space-y-16">
            {/* Entry Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Material Library Card */}
              <div
                onClick={() => handleEntrySelect('library')}
                className="group bg-white rounded-2xl p-8 cursor-pointer border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-500 transition-colors duration-200">
                  <svg className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">素材库</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  管理和使用已上传的产品素材，支持批量选择生图。
                </p>
              </div>

              {/* Direct Upload Card */}
              <div
                onClick={() => handleEntrySelect('upload')}
                className="group bg-white rounded-2xl p-8 cursor-pointer border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-500 transition-colors duration-200">
                  <svg className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">直接上传</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  上传新的产品实拍图，立即生成高质量营销图。
                </p>
              </div>
            </div>

            {/* Recent Generations */}
            <div className="border-t border-gray-200 pt-12">
              <RecentGenerations />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Wizard Container */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
              <div className="mb-12">
                <StepIndicator steps={STEPS} currentStep={currentStep} />
              </div>

              <div className="min-h-[400px]">
                {currentStep === 1 && (
                  <Step1Upload
                    selectedMaterials={selectedMaterials}
                    onMaterialsChange={setSelectedMaterials}
                    maxImages={10}
                    onNext={handleNext}
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
                    onCompetitorNameChange={(name) => setCompetitorInfo(prev => ({ ...prev, competitorName: name }))}
                    competitorCategory={competitorInfo.competitorCategory || ''}
                    onCompetitorCategoryChange={(category) => setCompetitorInfo(prev => ({ ...prev, competitorCategory: category }))}
                    selectedTemplateId={selectedTemplateId}
                    onTemplateSelect={(templateId, templateName, templateThumbnail) => {
                      setSelectedTemplateId(templateId);
                      setSelectedTemplateName(templateName);
                      setSelectedTemplateThumbnail(templateThumbnail);
                    }}
                    onPrev={handlePrev}
                    onNext={handleNext}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Info
                    generationMode={generationMode}
                    productImagePath={firstImagePath}
                    competitorImagePath={competitorImage || ''}
                    selectedTemplateName={selectedTemplateName}
                    selectedTemplateThumbnail={selectedTemplateThumbnail || ''}
                    productInfo={productInfo}
                    onProductInfoChange={setProductInfo}
                    selectedModels={selectedModels}
                    onModelsChange={setSelectedModels}
                    jimenResolution={jimenResolution}
                    onJimenResolutionChange={setJimenResolution}
                    onPrev={handlePrev}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isBatchMode={isBatchMode}
                    batchCount={selectedMaterials.length}
                  />
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowEntryCards(true)}
                className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        )}

        {/* Material Library Modal - 多选模式 */}
        <MaterialLibrary
          isOpen={showMaterialLibrary}
          onClose={() => setShowMaterialLibrary(false)}
          onSelect={handleSingleMaterialSelect}
          type="product"
          multiSelect={true}
          maxSelect={10}
          selectedPaths={selectedMaterials.map(m => m.path)}
          onMultiSelect={handleMultiMaterialSelect}
        />
      </div>
    </div>
  );
}
