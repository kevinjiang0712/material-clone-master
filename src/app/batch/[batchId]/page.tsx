'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { BatchTaskResultResponse, ResultImage, TaskStatus } from '@/types';
import { POLLING_INTERVAL, AVAILABLE_IMAGE_MODELS } from '@/lib/constants';
import { getTemplateById } from '@/lib/petStyleTemplates';

// 获取模型显示名称
function getModelDisplayName(modelId: string): string {
  const config = AVAILABLE_IMAGE_MODELS.find(m => m.model === modelId || m.id.includes(modelId));
  return config?.displayName || modelId;
}


// 任务状态颜色映射
function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'failed': return 'bg-red-500';
    case 'pending': return 'bg-gray-400';
    default: return 'bg-blue-500'; // 所有进行中状态
  }
}

// 任务状态文本映射
function getStatusText(status: TaskStatus): string {
  switch (status) {
    case 'completed': return '完成';
    case 'failed': return '失败';
    case 'pending': return '等待中';
    default: return '处理中';
  }
}

// 判断是否正在处理中
function isProcessing(status: TaskStatus): boolean {
  return status !== 'completed' && status !== 'failed' && status !== 'pending';
}

// 图片模态框组件
function ImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// 子任务卡片组件
interface TaskCardProps {
  task: {
    id: string;
    batchIndex: number;
    status: TaskStatus;
    productImagePath: string;
    productName: string | null;
    resultImages: ResultImage[];
    generatedPrompt: string | null;
    errorMessage: string | null;
  };
  onImageClick: (src: string, alt: string) => void;
  onDownload: (path: string) => void;
}

function TaskCard({ task, onImageClick, onDownload }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const successImages = task.resultImages?.filter(img => img.path && !img.error) || [];
  const hasResults = successImages.length > 0;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${
      task.status === 'failed' ? 'border-red-200' : 'border-gray-200'
    }`}>
      {/* 卡片头部 */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* 原图缩略图 */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={task.productImagePath}
              alt={task.productName || `素材 ${task.batchIndex + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
            <div className="absolute top-1 left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{task.batchIndex + 1}</span>
            </div>
          </div>

          {/* 任务信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></span>
              <span className="text-sm font-medium text-gray-700">{getStatusText(task.status)}</span>
              {isProcessing(task.status) && (
                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-900 truncate">
              {task.productName || `素材 ${task.batchIndex + 1}`}
            </p>
            {task.status === 'failed' && task.errorMessage && (
              <p className="text-xs text-red-500 mt-1 truncate">{task.errorMessage}</p>
            )}
            {hasResults && (
              <p className="text-xs text-gray-500 mt-1">
                生成 {successImages.length} 张图片
              </p>
            )}
          </div>

          {/* 展开/收起按钮 */}
          {(hasResults || task.status === 'failed') && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 展开内容 - 结果图片 */}
      {isExpanded && hasResults && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {successImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <div
                  className="aspect-square rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => onImageClick(img.path!, `结果 ${idx + 1}`)}
                >
                  <Image
                    src={img.path!}
                    alt={`结果 ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                </div>
                <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center">
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    img.provider === 'jimen' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {getModelDisplayName(img.model)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(img.path!);
                    }}
                    className="p-1 bg-white/80 hover:bg-white rounded-full text-gray-600"
                    title="下载"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 展开内容 - 错误详情 */}
      {isExpanded && task.status === 'failed' && !hasResults && (
        <div className="border-t border-red-100 p-4 bg-red-50">
          <p className="text-sm text-red-600">{task.errorMessage || '未知错误'}</p>
        </div>
      )}
    </div>
  );
}

export default function BatchResultPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  const [result, setResult] = useState<BatchTaskResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  const fetchResult = useCallback(async () => {
    try {
      const response = await fetch(`/api/batch/${batchId}/result`);
      if (!response.ok) {
        throw new Error('获取批量任务结果失败');
      }
      const data: BatchTaskResultResponse = await response.json();
      setResult(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch batch result:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const poll = async () => {
      const data = await fetchResult();
      if (data?.status === 'completed' || data?.status === 'failed') {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    poll();
    intervalId = setInterval(poll, POLLING_INTERVAL);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchResult]);

  const handleRetryFailed = async () => {
    if (!result || result.failedCount === 0) return;

    setIsRetrying(true);
    try {
      const response = await fetch(`/api/batch/${batchId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('重试请求失败');
      }

      // 重新开始轮询
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to retry:', error);
      alert('重试失败，请稍后再试');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDownload = (imagePath: string) => {
    const link = document.createElement('a');
    link.href = imagePath;
    const fileName = imagePath.split('/').pop() || `batch-${batchId}.jpg`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (src: string, alt: string) => {
    setModalImage({ src, alt });
  };

  // 计算进度百分比
  const progressPercent = result
    ? Math.round(((result.completedCount + result.failedCount) / result.totalCount) * 100)
    : 0;

  // 获取风格模板名称
  const templateName = result?.styleTemplateId
    ? getTemplateById(result.styleTemplateId)?.name
    : null;

  if (isLoading && !result) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600">批量任务不存在</p>
            <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
        </div>

        {/* 标题和状态 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            批量生成任务
          </h1>
          <p className="text-gray-500">
            {result.generationMode === 'template' && templateName
              ? `风格模板：${templateName}`
              : result.generationMode === 'competitor'
                ? '竞品参考模式'
                : '批量生成'}
          </p>
        </div>

        {/* 进度卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                result.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : result.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {result.status === 'completed' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {result.status === 'processing' && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {result.status === 'completed' ? '全部完成' : result.status === 'failed' ? '部分失败' : '处理中'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {result.completedCount}/{result.totalCount} 完成
              {result.failedCount > 0 && (
                <span className="text-red-500 ml-2">({result.failedCount} 失败)</span>
              )}
            </div>
          </div>

          {/* 进度条 */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                result.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 失败重试按钮 */}
          {result.failedCount > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleRetryFailed}
                loading={isRetrying}
                variant="secondary"
                className="text-sm"
              >
                重试失败任务 ({result.failedCount})
              </Button>
            </div>
          )}
        </div>

        {/* 成本汇总 */}
        {result.costSummary && (result.costSummary.usd > 0 || result.costSummary.cny > 0) && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-emerald-800">批量生成成本</span>
            </div>
            <div className="space-y-2">
              {result.costSummary.usd > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-600">API 分析 (OpenRouter)</span>
                  <span className="font-mono text-emerald-700">${result.costSummary.usd.toFixed(4)}</span>
                </div>
              )}
              {result.costSummary.cny > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-600">图片生成 (即梦)</span>
                  <span className="font-mono text-emerald-700">¥{result.costSummary.cny.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-emerald-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 font-medium">参考总计</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-700 font-mono">≈¥{result.costSummary.totalCny.toFixed(2)}</span>
                    <p className="text-xs text-emerald-500">按 $1=¥7.2 换算</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 任务列表 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            子任务详情 ({result.tasks.length})
          </h2>
          {result.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onImageClick={handleImageClick}
              onDownload={handleDownload}
            />
          ))}
        </div>

        {/* 底部操作 */}
        <div className="mt-8 flex justify-center">
          <Button onClick={() => router.push('/')} variant="secondary">
            创建新任务
          </Button>
        </div>
      </div>

      {/* 图片模态框 */}
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </main>
  );
}
