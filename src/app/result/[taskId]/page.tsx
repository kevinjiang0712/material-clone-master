'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ProgressTracker from '@/components/ProgressTracker';
import ImageComparison from '@/components/ImageComparison';
import ImageHistorySection from '@/components/ImageHistorySection';
import StepAnalysisCard from '@/components/StepAnalysisCard';
import Button from '@/components/ui/Button';
import { TaskStatusResponse, TaskResultResponse, ApiCallInfo, ResultImage, StepTimingInfo } from '@/types';
import { POLLING_INTERVAL, AVAILABLE_IMAGE_MODELS, MAX_IMAGES_PER_TASK } from '@/lib/constants';
import { getTemplateById } from '@/lib/petStyleTemplates';

// 模型标签组件（本地处理类型）
function LocalModelTag({ modelName }: { modelName: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded-md mt-1">
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
      <span>{modelName}</span>
    </div>
  );
}

// 模型标签组件（图像生成类型）
function ImageModelTag({ modelName }: { modelName: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded-md mt-1">
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      <span>{modelName}</span>
    </div>
  );
}

// 获取模型显示名称
function getModelDisplayName(modelId: string): string {
  const config = AVAILABLE_IMAGE_MODELS.find(m => m.model === modelId || m.id.includes(modelId));
  return config?.displayName || modelId;
}

// 按 createdAt 分组结果
function groupByCreatedAt(images: ResultImage[]): Map<string, ResultImage[]> {
  const groups = new Map<string, ResultImage[]>();
  images.forEach(img => {
    const key = img.createdAt || 'initial';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(img);
  });
  return groups;
}

// 格式化时间
function formatGroupTime(isoString: string): string {
  if (isoString === 'initial') return '首次生成';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '首次生成';
  }
}

// 步骤 4 图片生成结果展示组件
function Step4ImageResults({ resultImages }: { resultImages: ResultImage[] }) {
  // 按时间分组
  const groups = groupByCreatedAt(resultImages);
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'initial') return 1;
    if (b === 'initial') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // 展开状态：默认只展开第一组（最新）
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    return new Set(sortedKeys.length > 0 ? [sortedKeys[0]] : []);
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // 计算每组的统计信息
  const getGroupStats = (images: ResultImage[]) => {
    let totalCost = 0;
    let totalDuration = 0;
    let successCount = 0;
    let hasJimen = false;
    let hasOpenRouter = false;

    images.forEach(img => {
      if (img.cost) totalCost += img.cost;
      if (img.duration) totalDuration += img.duration;
      if (img.path && !img.error) successCount++;
      if (img.provider === 'jimen') hasJimen = true;
      else hasOpenRouter = true;
    });

    return { totalCost, totalDuration, successCount, failCount: images.length - successCount, hasJimen, hasOpenRouter };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 步骤头部 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
            4
          </span>
          <div>
            <h4 className="font-medium text-gray-800">生成结果图片</h4>
            <p className="text-sm text-gray-500">
              基于提示词和实拍图生成最终产品图 · 共 {sortedKeys.length} 批次
            </p>
          </div>
          <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            已完成
          </span>
        </div>
      </div>

      {/* 分组列表 */}
      <div className="divide-y divide-gray-100">
        {sortedKeys.map((key, groupIndex) => {
          const groupImages = groups.get(key) || [];
          const isExpanded = expandedGroups.has(key);
          const stats = getGroupStats(groupImages);
          const isLatest = groupIndex === 0;

          return (
            <div key={key} className={isLatest ? 'bg-purple-50/30' : ''}>
              {/* 分组标题 - 可折叠 */}
              <button
                onClick={() => toggleGroup(key)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center gap-2">
                    {isLatest && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">最新</span>
                    )}
                    <span className="text-sm font-medium text-gray-700">{formatGroupTime(key)}</span>
                    <span className="text-xs text-gray-400">
                      {stats.successCount > 0 && `${stats.successCount} 张成功`}
                      {stats.failCount > 0 && stats.successCount > 0 && ' / '}
                      {stats.failCount > 0 && `${stats.failCount} 张失败`}
                    </span>
                  </div>
                </div>
                {/* 统计信息 */}
                <div className="flex items-center gap-2 text-xs">
                  {stats.totalCost > 0 && (
                    <span className="text-emerald-600 font-mono">
                      {stats.hasJimen && !stats.hasOpenRouter ? '¥' : stats.hasOpenRouter && !stats.hasJimen ? '$' : '≈¥'}
                      {stats.totalCost.toFixed(stats.hasJimen ? 2 : 4)}
                    </span>
                  )}
                  {stats.totalDuration > 0 && (
                    <span className="text-blue-600 font-mono">{formatDurationLocal(stats.totalDuration)}</span>
                  )}
                </div>
              </button>

              {/* 展开内容 - 每个模型的详情 */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {groupImages.map((img, imgIndex) => (
                    <div
                      key={`${key}-${imgIndex}`}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        img.error ? 'bg-red-50 border border-red-100' : 'bg-gray-50'
                      }`}
                    >
                      {/* 模型标识 */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        img.provider === 'jimen' ? 'bg-orange-400' : 'bg-blue-400'
                      }`} />

                      {/* 模型名称 */}
                      <span className="text-sm font-medium text-gray-700 min-w-[100px]">
                        {getModelDisplayName(img.model)}
                      </span>

                      {/* 状态/路径 */}
                      <span className={`flex-1 text-xs truncate ${img.error ? 'text-red-500' : 'text-gray-400'}`}>
                        {img.error || (img.path ? '生成成功' : '处理中')}
                      </span>

                      {/* 成本 */}
                      {img.cost !== undefined && img.cost > 0 && (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-mono px-2 py-1 rounded">
                          <span>{img.provider === 'jimen' ? '¥' : '$'}</span>
                          <span>{img.cost.toFixed(img.provider === 'jimen' ? 2 : 6)}</span>
                        </div>
                      )}

                      {/* 耗时 */}
                      {img.duration !== undefined && (
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-mono px-2 py-1 rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDurationLocal(img.duration)}</span>
                        </div>
                      )}

                      {/* 状态标记 */}
                      {img.error ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">失败</span>
                      ) : img.path ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">成功</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 格式化耗时显示（组件外部使用）
function formatDurationLocal(ms: number): string {
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

// 提示词展示组件
function PromptSection({
  stepNumber,
  prompt,
  modelName,
  duration,
}: {
  stepNumber: number;
  prompt: string;
  modelName?: string;
  duration?: number | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
            {stepNumber}
          </span>
          <div className="text-left">
            <h4 className="font-medium text-gray-800">合成生成提示词</h4>
            <p className="text-sm text-gray-500">
              综合版式、风格、内容分析结果生成 Prompt
            </p>
            <div className="flex items-center gap-2 mt-1">
              {modelName && <LocalModelTag modelName={modelName} />}
              {duration !== undefined && duration !== null && (
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-mono px-2 py-1 rounded-md">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDurationLocal(duration)}</span>
                </div>
              )}
            </div>
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
      {isExpanded && prompt && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <pre className="mt-4 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg overflow-x-auto font-mono">
            {prompt}
          </pre>
        </div>
      )}
    </>
  );
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

// 重新生成面板组件
interface RegenerateControlsProps {
  selectedModels: string[];
  onModelToggle: (modelId: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  currentImageCount: number;
  maxImages: number;
}

function RegenerateControls({
  selectedModels,
  onModelToggle,
  onRegenerate,
  isRegenerating,
  currentImageCount,
  maxImages,
}: RegenerateControlsProps) {
  const remainingSlots = maxImages - currentImageCount;
  const canRegenerate = selectedModels.length > 0 && selectedModels.length <= remainingSlots;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">重新生成</h3>
        <span className="text-sm text-gray-500">
          已生成 {currentImageCount}/{maxImages} 张
        </span>
      </div>

      {remainingSlots <= 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          已达到最大图片数量限制
        </div>
      ) : (
        <>
          {/* 模型选择 - 紧凑的 checkbox 布局 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {AVAILABLE_IMAGE_MODELS.map(model => {
              const isSelected = selectedModels.includes(model.id);
              const isDisabled = !isSelected && selectedModels.length >= remainingSlots;

              return (
                <label
                  key={model.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : isDisabled
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => onModelToggle(model.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`w-2 h-2 rounded-full ${model.provider === 'jimen' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                  <span className="text-sm">{model.displayName}</span>
                </label>
              );
            })}
          </div>

          {/* 生成按钮 */}
          <button
            onClick={onRegenerate}
            disabled={!canRegenerate || isRegenerating}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              canRegenerate && !isRegenerating
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isRegenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在生成...
              </span>
            ) : (
              `生成 ${selectedModels.length} 张图片`
            )}
          </button>
        </>
      )}
    </div>
  );
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [status, setStatus] = useState<TaskStatusResponse | null>(null);
  const [result, setResult] = useState<TaskResultResponse | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // 重新生成相关状态
  const [regenerateModels, setRegenerateModels] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 图片模态框状态
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/task/${taskId}/status`);
      if (!response.ok) {
        throw new Error('获取状态失败');
      }
      const data: TaskStatusResponse = await response.json();
      setStatus(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch status:', error);
      return null;
    }
  }, [taskId]);

  const fetchResult = useCallback(async () => {
    setIsLoadingResult(true);
    try {
      const response = await fetch(`/api/task/${taskId}/result`);
      if (!response.ok) {
        throw new Error('获取结果失败');
      }
      const data: TaskResultResponse = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to fetch result:', error);
    } finally {
      setIsLoadingResult(false);
    }
  }, [taskId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      const data = await fetchStatus();

      if (data?.status === 'completed' || data?.status === 'failed') {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        // 无论成功还是失败，都获取分析结果数据
        await fetchResult();
      }
    };

    // 立即执行一次
    pollStatus();

    // 设置轮询
    intervalId = setInterval(pollStatus, POLLING_INTERVAL);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchStatus, fetchResult]);

  const handleDownload = (imagePath?: string) => {
    const pathToDownload = imagePath || result?.resultImagePath;
    if (pathToDownload) {
      const link = document.createElement('a');
      link.href = pathToDownload;
      // 从路径中提取文件名
      const fileName = pathToDownload.split('/').pop() || `material-clone-${taskId}.jpg`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRetry = () => {
    router.push('/');
  };

  // 处理模型选择切换
  const handleModelToggle = (modelId: string) => {
    setRegenerateModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  // 处理重新生成
  const handleRegenerate = async () => {
    if (regenerateModels.length === 0 || isRegenerating) return;

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/task/${taskId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedModels: regenerateModels }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '重新生成失败');
      }

      // 成功后刷新结果
      await fetchResult();
      setRegenerateModels([]);  // 清空选择
    } catch (error) {
      console.error('Regenerate error:', error);
      alert(error instanceof Error ? error.message : '重新生成失败');
    } finally {
      setIsRegenerating(false);
    }
  };

  // 处理图片点击（打开模态框）
  const handleImageClick = (src: string, alt: string) => {
    setModalImage({ src, alt });
  };

  // 计算成功的图片数量
  const getSuccessfulImageCount = (): number => {
    if (!result?.resultImages) return 0;
    return result.resultImages.filter(r => r.path && !r.error).length;
  };

  // 从失败步骤重试
  const handleRetryFromFailed = async () => {
    if (!status?.failedStep) return;

    setIsRetrying(true);
    try {
      const response = await fetch(`/api/task/${taskId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('重试请求失败');
      }

      // 重试成功，清除失败状态，重新开始轮询
      setStatus(null);
      setResult(null);

      // 延迟一下再开始轮询，让后端有时间更新状态
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

  // 获取步骤名称（根据生成模式动态返回）
  const getStepName = (step: number): string => {
    const isTemplateMode = result?.generationMode === 'template';
    const templateName = result?.styleTemplateId ? getTemplateById(result.styleTemplateId)?.name : '风格模板';

    const names: Record<number, string> = {
      1: isTemplateMode ? `使用风格模板：${templateName}` : '分析竞品图（版式+风格）',
      2: '分析实拍图内容',
      3: '合成生成提示词',
      4: '生成结果图片',
    };
    return names[step] || `步骤 ${step}`;
  };

  // 获取指定步骤的成本
  const getStepCost = (step: number): number | null => {
    if (!result?.apiCalls) return null;
    const call = result.apiCalls.find((c: ApiCallInfo) => c.step === step);
    return call?.totalCost ?? null;
  };

  // 获取指定步骤的耗时
  const getStepDuration = (step: number): number | null => {
    if (!result?.stepTimings) return null;
    const timing = result.stepTimings.find((t: StepTimingInfo) => t.step === step);
    return timing?.duration ?? null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回首页
          </Link>
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {status?.status === 'completed'
            ? '生成完成'
            : status?.status === 'failed'
              ? '生成失败'
              : '正在生成...'}
        </h1>

        {/* 失败状态 */}
        {status?.status === 'failed' && (
          <>
            <div className="max-w-md mx-auto text-center mb-8">
              <div className="bg-red-50 text-red-600 p-6 rounded-xl mb-6">
                <div className="text-5xl mb-4">:(</div>
                <p className="text-lg font-medium">生成失败</p>
                <p className="mt-2 text-sm">{status.errorMessage || '未知错误'}</p>
                {status.failedStep && (
                  <p className="mt-2 text-xs text-red-400">
                    失败步骤：{getStepName(status.failedStep)}
                  </p>
                )}
              </div>
              <div className="flex justify-center gap-3">
                {status.failedStep && (
                  <Button
                    onClick={handleRetryFromFailed}
                    loading={isRetrying}
                    variant="primary"
                  >
                    从失败处重试
                  </Button>
                )}
                <Button onClick={handleRetry} variant="secondary">
                  重新开始
                </Button>
              </div>
            </div>

            {/* 失败时也展示已完成的分析步骤 */}
            {result && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  AI 分析过程（已完成的步骤）
                </h2>

                <div className="space-y-4">
                  {/* 步骤1: 竞品图分析 或 使用模板 */}
                  <StepAnalysisCard
                    stepNumber={1}
                    title={result.generationMode === 'template'
                      ? `使用风格模板：${getTemplateById(result.styleTemplateId || '')?.name || '风格模板'}`
                      : '分析竞品图（版式+风格）'
                    }
                    description={result.generationMode === 'template'
                      ? '使用预设的版式布局、色彩风格、光影效果配置'
                      : '提取版式布局、色彩风格、光影效果等信息'
                    }
                    data={result.competitorAnalysis}
                    type="competitor"
                    modelName={result.generationMode === 'template' ? undefined : result.usedModels?.step1_competitor}
                    cost={result.generationMode === 'template' ? null : getStepCost(1)}
                    duration={result.generationMode === 'template' ? null : getStepDuration(1)}
                  />

                  {/* 步骤2: 内容分析 */}
                  <StepAnalysisCard
                    stepNumber={2}
                    title="分析实拍图内容"
                    description="识别产品形状、材质、朝向、色彩等特征信息"
                    data={result.contentAnalysis}
                    type="content"
                    modelName={result.usedModels?.step2_content}
                    cost={getStepCost(2)}
                    duration={getStepDuration(2)}
                  />

                  {/* 步骤3: 合成提示词 */}
                  {result.generatedPrompt && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <PromptSection
                        stepNumber={3}
                        prompt={result.generatedPrompt}
                        modelName={result.usedModels?.step3_prompt}
                        duration={getStepDuration(3)}
                      />
                    </div>
                  )}

                  {/* 步骤4: 图片生成 - 失败 */}
                  <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                        4
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-800">生成结果图片</h4>
                        <p className="text-sm text-red-500">
                          {status.errorMessage || '生成失败'}
                        </p>
                        {result.usedModels?.step4_image && (
                          <ImageModelTag modelName={result.usedModels.step4_image} />
                        )}
                      </div>
                      <span className="ml-auto bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        失败
                      </span>
                    </div>
                  </div>

                  {/* 已产生的成本 - 双币种显示 */}
                  {result.costSummary && (result.costSummary.usd > 0 || result.costSummary.cny > 0) && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-orange-800">已产生成本</span>
                      </div>
                      <div className="space-y-2">
                        {result.costSummary.usd > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-orange-600">API 分析 (OpenRouter)</span>
                            <span className="font-mono text-orange-700">${result.costSummary.usd.toFixed(6)}</span>
                          </div>
                        )}
                        {result.costSummary.cny > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-orange-600">图片生成 (即梦)</span>
                            <span className="font-mono text-orange-700">¥{result.costSummary.cny.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-orange-200 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-orange-700 font-medium">参考总计</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-orange-700 font-mono">≈¥{result.costSummary.totalCny.toFixed(2)}</span>
                              <p className="text-xs text-orange-500">按 $1=¥7.2 换算</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 处理中状态 */}
        {status &&
          status.status !== 'completed' &&
          status.status !== 'failed' && (
            <>
              <ProgressTracker
                currentStep={status.currentStep}
                totalSteps={status.totalSteps}
                stepDescription={status.stepDescription}
                progress={status.progress}
              />

              {/* 实时展示 AI 分析过程 */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  AI 分析过程
                </h2>

                <div className="space-y-4">
                  {/* 步骤1: 竞品图分析 或 使用模板 */}
                  <StepAnalysisCard
                    stepNumber={1}
                    title={status.generationMode === 'template'
                      ? `使用风格模板：${getTemplateById(status.styleTemplateId || '')?.name || '风格模板'}`
                      : '分析竞品图（版式+风格）'
                    }
                    description={status.generationMode === 'template'
                      ? '使用预设的版式布局、色彩风格、光影效果配置'
                      : '提取版式布局、色彩风格、光影效果等信息'
                    }
                    data={status.competitorAnalysis || null}
                    type="competitor"
                    modelName={status.generationMode === 'template' ? undefined : status.usedModels?.step1_competitor}
                    stepStatus={
                      status.currentStep > 1
                        ? 'completed'
                        : status.currentStep === 1
                          ? 'in_progress'
                          : 'pending'
                    }
                  />

                  {/* 步骤2: 内容分析 */}
                  <StepAnalysisCard
                    stepNumber={2}
                    title="分析实拍图内容"
                    description="识别产品形状、材质、朝向、色彩等特征信息"
                    data={status.contentAnalysis || null}
                    type="content"
                    modelName={status.usedModels?.step2_content}
                    stepStatus={
                      status.currentStep > 2
                        ? 'completed'
                        : status.currentStep === 2
                          ? 'in_progress'
                          : 'pending'
                    }
                  />

                  {/* 步骤3: 合成提示词 */}
                  <div className={`rounded-xl shadow-sm border overflow-hidden ${
                    status.currentStep > 3
                      ? 'bg-white border-gray-100'
                      : status.currentStep === 3
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}>
                    {status.currentStep > 3 && status.generatedPrompt ? (
                      <PromptSection
                        stepNumber={3}
                        prompt={status.generatedPrompt}
                        modelName={status.usedModels?.step3_prompt}
                      />
                    ) : (
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            status.currentStep === 3
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            3
                          </span>
                          <div>
                            <h4 className={`font-medium ${
                              status.currentStep === 3 ? 'text-gray-800' : 'text-gray-400'
                            }`}>合成生成提示词</h4>
                            <p className={`text-sm ${
                              status.currentStep === 3 ? 'text-gray-500' : 'text-gray-400'
                            }`}>综合版式、风格、内容分析结果生成 Prompt</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          status.currentStep === 3
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {status.currentStep === 3 ? '进行中' : '等待中'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 步骤4: 图片生成 */}
                  <div className={`rounded-xl shadow-sm border p-4 ${
                    status.currentStep === 4
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          status.currentStep === 4
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          4
                        </span>
                        <div>
                          <h4 className={`font-medium ${
                            status.currentStep === 4 ? 'text-gray-800' : 'text-gray-400'
                          }`}>生成结果图片</h4>
                          <p className={`text-sm ${
                            status.currentStep === 4 ? 'text-gray-500' : 'text-gray-400'
                          }`}>基于提示词和实拍图生成最终产品图</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        status.currentStep === 4
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {status.currentStep === 4 ? '进行中' : '等待中'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        {/* 完成状态 */}
        {status?.status === 'completed' && result && (
          <>
            {/* 图片展示区 - 最新结果 */}
            <ImageComparison
              competitorImage={result.competitorImagePath}
              productImage={result.productImagePath}
              resultImage={result.resultImagePath}
              resultImages={result.resultImages}
              onDownload={handleDownload}
              onImageClick={handleImageClick}
              generationMode={result.generationMode}
              templateName={result.styleTemplateId ? getTemplateById(result.styleTemplateId)?.name : undefined}
            />

            {/* 历史生成记录 */}
            {result.resultImages && result.resultImages.length > 0 && (
              <div className="mt-4">
                <ImageHistorySection
                  resultImages={result.resultImages}
                  onImageClick={handleImageClick}
                  onDownload={handleDownload}
                />
              </div>
            )}

            {/* 重新生成面板 */}
            <div className="mt-6">
              <RegenerateControls
                selectedModels={regenerateModels}
                onModelToggle={handleModelToggle}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
                currentImageCount={getSuccessfulImageCount()}
                maxImages={MAX_IMAGES_PER_TASK}
              />
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={handleRetry} variant="secondary">
                创建新任务
              </Button>
            </div>

            {/* AI 分析过程 */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                AI 分析过程
              </h2>

              <div className="space-y-4">
                {/* 步骤1: 竞品图分析 或 使用模板 */}
                <StepAnalysisCard
                  stepNumber={1}
                  title={result.generationMode === 'template'
                    ? `使用风格模板：${getTemplateById(result.styleTemplateId || '')?.name || '风格模板'}`
                    : '分析竞品图（版式+风格）'
                  }
                  description={result.generationMode === 'template'
                    ? '使用预设的版式布局、色彩风格、光影效果配置'
                    : '提取版式布局、色彩风格、光影效果等信息'
                  }
                  data={result.competitorAnalysis}
                  type="competitor"
                  modelName={result.generationMode === 'template' ? undefined : result.usedModels?.step1_competitor}
                  cost={result.generationMode === 'template' ? null : getStepCost(1)}
                  duration={result.generationMode === 'template' ? null : getStepDuration(1)}
                />

                {/* 步骤2: 内容分析 */}
                <StepAnalysisCard
                  stepNumber={2}
                  title="分析实拍图内容"
                  description="识别产品形状、材质、朝向、色彩等特征信息"
                  data={result.contentAnalysis}
                  type="content"
                  modelName={result.usedModels?.step2_content}
                  cost={getStepCost(2)}
                  duration={getStepDuration(2)}
                />

                {/* 步骤3: 合成提示词 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <PromptSection
                    stepNumber={3}
                    prompt={result.generatedPrompt}
                    modelName={result.usedModels?.step3_prompt}
                    duration={getStepDuration(3)}
                  />
                </div>

                {/* 步骤4: 图片生成 - 按时间分组展示 */}
                {result.resultImages && result.resultImages.length > 0 ? (
                  <Step4ImageResults resultImages={result.resultImages} />
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                        4
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-800">生成结果图片</h4>
                        <p className="text-sm text-gray-500">
                          基于提示词和实拍图生成最终产品图
                        </p>
                        {result.usedModels?.step4_image && (
                          <ImageModelTag modelName={result.usedModels.step4_image} />
                        )}
                      </div>
                      <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        已完成
                      </span>
                    </div>
                  </div>
                )}

                {/* 总成本 - 双币种显示 */}
                {result.costSummary && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-emerald-800">本次生成成本</span>
                    </div>
                    <div className="space-y-2">
                      {/* 分项显示 */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-600">API 分析 (OpenRouter)</span>
                        <span className="font-mono text-emerald-700">${result.costSummary.usd.toFixed(6)}</span>
                      </div>
                      {result.costSummary.cny > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-emerald-600">图片生成 (即梦)</span>
                          <span className="font-mono text-emerald-700">¥{result.costSummary.cny.toFixed(2)}</span>
                        </div>
                      )}
                      {/* 参考汇总 */}
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
              </div>
            </div>
          </>
        )}

        {/* 加载结果中 */}
        {status?.status === 'completed' && isLoadingResult && !result && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4" />
            <p className="text-gray-600">加载结果中...</p>
          </div>
        )}
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
