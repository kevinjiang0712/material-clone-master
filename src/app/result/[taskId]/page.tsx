'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProgressTracker from '@/components/ProgressTracker';
import ImageComparison from '@/components/ImageComparison';
import Button from '@/components/ui/Button';
import { TaskStatusResponse, TaskResultResponse } from '@/types';
import { POLLING_INTERVAL } from '@/lib/constants';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [status, setStatus] = useState<TaskStatusResponse | null>(null);
  const [result, setResult] = useState<TaskResultResponse | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

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

      if (data?.status === 'completed') {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        await fetchResult();
      } else if (data?.status === 'failed') {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
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
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 text-red-600 p-6 rounded-xl mb-6">
              <div className="text-5xl mb-4">:(</div>
              <p className="text-lg font-medium">生成失败</p>
              <p className="mt-2 text-sm">{status.errorMessage || '未知错误'}</p>
            </div>
            <Button onClick={handleRetry}>重新开始</Button>
          </div>
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

            {/* 生成的提示词（可选展示） */}
            {result.generatedPrompt && (
              <div className="mt-8 bg-white rounded-2xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  AI 生成的提示词
                </h3>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {result.generatedPrompt}
                </pre>
              </div>
            )}
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
