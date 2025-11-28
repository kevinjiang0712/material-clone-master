'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import ImagePreview from '@/components/ImagePreview';
import CompetitorInfoForm from '@/components/CompetitorInfoForm';
import ProductInfoForm from '@/components/ProductInfoForm';
import ModelSelector, { DEFAULT_IMAGE_MODELS } from '@/components/ModelSelector';
import Button from '@/components/ui/Button';
import TaskHistoryList from '@/components/TaskHistoryList';
import HistoryButton from '@/components/HistoryButton';
import { CompetitorInfo, ProductInfo } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [competitorImage, setCompetitorImage] = useState<string | null>(null);
  const [competitorInfo, setCompetitorInfo] = useState<CompetitorInfo>({
    competitorName: '',
    competitorCategory: '',
  });
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    productName: '',
    productCategory: '',
    sellingPoints: '',
    targetAudience: '',
    brandTone: [],
  });
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULT_IMAGE_MODELS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartGenerate = async () => {
    if (!competitorImage || !productImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorImagePath: competitorImage,
          productImagePath: productImage,
          competitorInfo,
          productInfo,
          selectedImageModels: selectedModels,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建任务失败');
      }

      router.push(`/result/${data.taskId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败，请重试');
      setIsLoading(false);
    }
  };

  const canSubmit = competitorImage && productImage && !isLoading;

  return (
    <>
      <HistoryButton />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              素材克隆大师
            </h1>
            <p className="text-gray-600 text-lg">
              上传竞品图和实拍图，AI 帮你生成同款风格的产品图
            </p>
          </div>

          {/* 上传区域 */}
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            {/* 竞品图 + 竞品信息 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <h2 className="text-lg font-semibold text-gray-800">
                  竞品图（参考风格）
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                上传竞品图并填写基本信息
              </p>

              {/* 图片上传区域 */}
              <div className="mb-4">
                {competitorImage ? (
                  <ImagePreview
                    src={competitorImage}
                    onRemove={() => setCompetitorImage(null)}
                  />
                ) : (
                  <ImageUploader type="competitor" onUpload={setCompetitorImage} />
                )}
              </div>

              {/* 竞品信息表单 */}
              <CompetitorInfoForm value={competitorInfo} onChange={setCompetitorInfo} />
            </div>

            {/* 实拍图 + 商品信息 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <h2 className="text-lg font-semibold text-gray-800">
                  你的产品
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                上传商品照片并填写基本信息
              </p>

              {/* 图片上传区域 */}
              <div className="mb-4">
                {productImage ? (
                  <ImagePreview
                    src={productImage}
                    onRemove={() => setProductImage(null)}
                  />
                ) : (
                  <ImageUploader type="product" onUpload={setProductImage} />
                )}
              </div>

              {/* 商品信息表单 */}
              <ProductInfoForm value={productInfo} onChange={setProductInfo} />
            </div>
          </div>

          {/* 模型选择 */}
          <div className="mb-8">
            <ModelSelector
              selectedModels={selectedModels}
              onChange={setSelectedModels}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="text-center">
            <Button
              onClick={handleStartGenerate}
              disabled={!canSubmit}
              loading={isLoading}
              size="lg"
            >
              开始生成
            </Button>
            {!canSubmit && !isLoading && (
              <p className="text-gray-500 text-sm mt-3">
                请先上传竞品图和实拍图
              </p>
            )}
          </div>

          {/* 说明 */}
          <div className="mt-12 bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">使用说明</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">1.</span>
                <span>上传一张竞品图作为风格参考，AI 会分析其版式和视觉风格</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">2.</span>
                <span>上传你的商品实拍图，AI 会识别产品特征</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">3.</span>
                <span>点击「开始生成」，AI 将融合两者生成新的产品图</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">*</span>
                <span className="text-gray-500">支持 JPG、PNG、WebP 格式，最大 10MB</span>
              </li>
            </ul>
          </div>

          {/* 历史记录 */}
          <div className="mt-12">
            <TaskHistoryList limit={6} showTitle={true} showLoadMore={false} />
          </div>
        </div>
      </main>
    </>
  );
}
