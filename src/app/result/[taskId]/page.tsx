'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProgressTracker from '@/components/ProgressTracker';
import ImageComparison from '@/components/ImageComparison';
import StepAnalysisCard from '@/components/StepAnalysisCard';
import Button from '@/components/ui/Button';
import { TaskStatusResponse, TaskResultResponse, ApiCallInfo } from '@/types';
import { POLLING_INTERVAL } from '@/lib/constants';

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

// 提示词展示组件
function PromptSection({
  stepNumber,
  prompt,
  modelName,
}: {
  stepNumber: number;
  prompt: string;
  modelName?: string;
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
            {modelName && <LocalModelTag modelName={modelName} />}
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
      1: '分析竞品图（版式+风格）',
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
                  {/* 步骤1: 竞品图分析（版式+风格） */}
                  <StepAnalysisCard
                    stepNumber={1}
                    title="分析竞品图（版式+风格）"
                    description="提取版式布局、色彩风格、光影效果等信息"
                    data={result.competitorAnalysis}
                    type="competitor"
                    modelName={result.usedModels?.step1_competitor}
                    cost={getStepCost(1)}
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
                  />

                  {/* 步骤3: 合成提示词 */}
                  {result.generatedPrompt && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <PromptSection
                        stepNumber={3}
                        prompt={result.generatedPrompt}
                        modelName={result.usedModels?.step3_prompt}
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

                  {/* 已产生的成本 */}
                  {result.totalCost !== null && result.totalCost !== undefined && result.totalCost > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-orange-800">已产生成本</span>
                        </div>
                        <span className="text-lg font-bold text-orange-700 font-mono">
                          ${result.totalCost.toFixed(6)}
                        </span>
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
                  {/* 步骤1: 竞品图分析 */}
                  <StepAnalysisCard
                    stepNumber={1}
                    title="分析竞品图（版式+风格）"
                    description="提取版式布局、色彩风格、光影效果等信息"
                    data={status.competitorAnalysis || null}
                    type="competitor"
                    modelName={status.usedModels?.step1_competitor}
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
            <ImageComparison
              competitorImage={result.competitorImagePath}
              productImage={result.productImagePath}
              resultImage={result.resultImagePath}
              onDownload={handleDownload}
            />

            <div className="flex justify-center mt-8">
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
                {/* 步骤1: 竞品图分析（版式+风格） */}
                <StepAnalysisCard
                  stepNumber={1}
                  title="分析竞品图（版式+风格）"
                  description="提取版式布局、色彩风格、光影效果等信息"
                  data={result.competitorAnalysis}
                  type="competitor"
                  modelName={result.usedModels?.step1_competitor}
                  cost={getStepCost(1)}
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
                />

                {/* 步骤3: 合成提示词 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <PromptSection
                    stepNumber={3}
                    prompt={result.generatedPrompt}
                    modelName={result.usedModels?.step3_prompt}
                  />
                </div>

                {/* 步骤4: 图片生成 */}
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
                      <div className="flex items-center gap-2 mt-1">
                        {result.usedModels?.step4_image && (
                          <ImageModelTag modelName={result.usedModels.step4_image} />
                        )}
                        {getStepCost(4) !== null && (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-mono px-2 py-1 rounded-md">
                            <span>$</span>
                            <span>{getStepCost(4)!.toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      已完成
                    </span>
                  </div>
                </div>

                {/* 总成本 */}
                {result.totalCost !== null && result.totalCost !== undefined && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-emerald-800">本次生成总成本</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-700 font-mono">
                        ${result.totalCost.toFixed(6)}
                      </span>
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
    </main>
  );
}
