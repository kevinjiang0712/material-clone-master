'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProgressTracker from '@/components/ProgressTracker';
import ImageComparison from '@/components/ImageComparison';
import StepAnalysisCard from '@/components/StepAnalysisCard';
import Button from '@/components/ui/Button';
import { TaskStatusResponse, TaskResultResponse } from '@/types';
import { POLLING_INTERVAL } from '@/lib/constants';

// 提示词展示组件
function PromptSection({
  stepNumber,
  prompt,
}: {
  stepNumber: number;
  prompt: string;
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

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [status, setStatus] = useState<TaskStatusResponse | null>(null);
  const [result, setResult] = useState<TaskResultResponse | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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

  const handleDownload = () => {
    if (result?.resultImagePath) {
      const link = document.createElement('a');
      link.href = result.resultImagePath;
      link.download = `material-clone-${taskId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRetry = () => {
    router.push('/');
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

  // 获取步骤名称
  const getStepName = (step: number): string => {
    const names: Record<number, string> = {
      1: '分析竞品图版式',
      2: '分析竞品图风格',
      3: '分析实拍图内容',
      4: '合成生成提示词',
      5: '生成结果图片',
    };
    return names[step] || `步骤 ${step}`;
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
                  {/* 步骤1: 版式分析 */}
                  <StepAnalysisCard
                    stepNumber={1}
                    title="分析竞品图版式"
                    description="提取主体构图、背景结构、图层顺序等版式信息"
                    data={result.layoutAnalysis}
                    type="layout"
                  />

                  {/* 步骤2: 风格分析 */}
                  <StepAnalysisCard
                    stepNumber={2}
                    title="分析竞品图风格"
                    description="提取色彩风格、光影效果、整体氛围等视觉风格"
                    data={result.styleAnalysis}
                    type="style"
                  />

                  {/* 步骤3: 内容分析 */}
                  <StepAnalysisCard
                    stepNumber={3}
                    title="分析实拍图内容"
                    description="识别产品形状、材质、朝向、色彩等特征信息"
                    data={result.contentAnalysis}
                    type="content"
                  />

                  {/* 步骤4: 合成提示词 */}
                  {result.generatedPrompt && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <PromptSection
                        stepNumber={4}
                        prompt={result.generatedPrompt}
                      />
                    </div>
                  )}

                  {/* 步骤5: 图片生成 - 失败 */}
                  <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                        5
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-800">生成结果图片</h4>
                        <p className="text-sm text-red-500">
                          {status.errorMessage || '生成失败'}
                        </p>
                      </div>
                      <span className="ml-auto bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        失败
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 处理中状态 */}
        {status &&
          status.status !== 'completed' &&
          status.status !== 'failed' && (
            <ProgressTracker
              currentStep={status.currentStep}
              totalSteps={status.totalSteps}
              stepDescription={status.stepDescription}
              progress={status.progress}
            />
          )}

        {/* 完成状态 */}
        {status?.status === 'completed' && result && (
          <>
            <ImageComparison
              competitorImage={result.competitorImagePath}
              productImage={result.productImagePath}
              resultImage={result.resultImagePath}
            />

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={handleDownload} variant="primary">
                下载结果图
              </Button>
              <Button onClick={handleRetry} variant="secondary">
                再次生成
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
                {/* 步骤1: 版式分析 */}
                <StepAnalysisCard
                  stepNumber={1}
                  title="分析竞品图版式"
                  description="提取主体构图、背景结构、图层顺序等版式信息"
                  data={result.layoutAnalysis}
                  type="layout"
                />

                {/* 步骤2: 风格分析 */}
                <StepAnalysisCard
                  stepNumber={2}
                  title="分析竞品图风格"
                  description="提取色彩风格、光影效果、整体氛围等视觉风格"
                  data={result.styleAnalysis}
                  type="style"
                />

                {/* 步骤3: 内容分析 */}
                <StepAnalysisCard
                  stepNumber={3}
                  title="分析实拍图内容"
                  description="识别产品形状、材质、朝向、色彩等特征信息"
                  data={result.contentAnalysis}
                  type="content"
                />

                {/* 步骤4: 合成提示词 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <PromptSection
                    stepNumber={4}
                    prompt={result.generatedPrompt}
                  />
                </div>

                {/* 步骤5: 图片生成 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                      5
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-800">生成结果图片</h4>
                      <p className="text-sm text-gray-500">
                        基于提示词和实拍图生成最终产品图
                      </p>
                    </div>
                    <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      已完成
                    </span>
                  </div>
                </div>
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
    </main>
  );
}
