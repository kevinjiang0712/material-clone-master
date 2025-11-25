'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface TaskHistoryCardProps {
  task: {
    id: string;
    status: string;
    currentStep: number;
    totalSteps: number;
    competitorImagePath: string;
    productImagePath: string;
    resultImagePath: string | null;
    errorMessage: string | null;
    createdAt: Date | string;
  };
}

const STATUS_CONFIG = {
  pending: { label: '等待中', color: 'text-gray-500', bg: 'bg-gray-100', icon: '⏸️' },
  analyzing_layout: { label: '分析版式', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🔄' },
  analyzing_style: { label: '分析风格', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🔄' },
  analyzing_content: { label: '分析内容', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🔄' },
  generating_prompt: { label: '生成提示词', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🔄' },
  generating_image: { label: '生成图像', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🔄' },
  completed: { label: '成功', color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
  failed: { label: '失败', color: 'text-red-600', bg: 'bg-red-100', icon: '❌' },
};

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return past.toLocaleDateString('zh-CN');
}

export default function TaskHistoryCard({ task }: TaskHistoryCardProps) {
  const router = useRouter();
  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const [isRetrying, setIsRetrying] = useState(false);

  const handleViewDetails = () => {
    router.push(`/result/${task.id}`);
  };

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      const response = await fetch('/api/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorImagePath: task.competitorImagePath,
          productImagePath: task.productImagePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建任务失败');
      }

      // 跳转到新任务的结果页
      router.push(`/result/${data.taskId}`);
    } catch (error) {
      console.error('重试失败:', error);
      alert(error instanceof Error ? error.message : '重试失败，请稍后再试');
      setIsRetrying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100">
      {/* 状态和时间 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${statusConfig.bg} ${statusConfig.color} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </span>
          {task.status !== 'completed' && task.status !== 'failed' && (
            <span className="text-xs text-gray-500">
              {task.currentStep}/{task.totalSteps}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{getTimeAgo(task.createdAt)}</span>
      </div>

      {/* 图片预览 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* 竞品图 */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={task.competitorImagePath}
            alt="竞品图"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 text-center">
            竞品图
          </div>
        </div>

        {/* 实拍图 */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={task.productImagePath}
            alt="实拍图"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 text-center">
            实拍图
          </div>
        </div>

        {/* 生成结果 */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          {task.resultImagePath ? (
            <>
              <Image
                src={task.resultImagePath}
                alt="生成结果"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 text-center">
                生成结果
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {task.status === 'failed' ? (
                <span className="text-2xl">❌</span>
              ) : (
                <span className="text-2xl">⏳</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 错误信息 */}
      {task.errorMessage && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded">
          {task.errorMessage}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleViewDetails}
          className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
        >
          查看详情
        </button>
        {task.status === 'failed' && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? '重试中...' : '重试'}
          </button>
        )}
      </div>
    </div>
  );
}
