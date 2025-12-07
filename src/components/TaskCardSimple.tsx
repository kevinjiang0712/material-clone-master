'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from './SafeImage';

interface TaskCardSimpleProps {
  task: {
    id: string;
    status: string;
    productImagePath: string;
    resultImagePath: string | null;
    competitorImagePath?: string | null;
    createdAt: Date | string;
  };
}

const STATUS_CONFIG = {
  pending: { label: '等待中', color: 'text-gray-500', bg: 'bg-gray-100', icon: '⏸️' },
  analyzing_competitor: { label: '分析竞品', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🔄' },
  analyzing_content: { label: '分析实拍', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🔄' },
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

export default function TaskCardSimple({ task }: TaskCardSimpleProps) {
  const router = useRouter();
  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const [isRetrying, setIsRetrying] = useState(false);

  const handleViewDetails = () => {
    router.push(`/result/${task.id}`);
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

      router.push(`/result/${data.taskId}`);
    } catch (error) {
      console.error('重试失败:', error);
      alert(error instanceof Error ? error.message : '重试失败，请稍后再试');
      setIsRetrying(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-card-border hover:border-primary transition-all duration-300 group">
      {/* 任务ID */}
      <div
        className="text-xs text-muted font-mono mb-3 break-all cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
        title="点击复制"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(task.id);
        }}
      >
        <span className="opacity-50">ID:</span> {task.id.slice(0, 8)}...
      </div>

      {/* 图片预览：实拍图 + 结果图 并排 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* 实拍图 */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-background border border-card-border">
          <SafeImage
            src={task.productImagePath}
            alt="实拍图"
            fill
            sizes="(max-width: 768px) 50vw, 150px"
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-1 text-center">
            实拍图
          </div>
        </div>

        {/* 结果图 */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-background border border-card-border">
          {task.resultImagePath ? (
            <>
              <SafeImage
                src={task.resultImagePath}
                alt="生成结果"
                fill
                sizes="(max-width: 768px) 50vw, 150px"
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[10px] px-1 py-1 text-center">
                生成结果
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#666]">
              {task.status === 'failed' ? (
                <span className="text-2xl opacity-50">❌</span>
              ) : (
                <span className="text-2xl animate-pulse">⏳</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 状态和时间 */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 border ${task.status === 'completed' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
          task.status === 'failed' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
            'bg-blue-900/20 text-blue-400 border-blue-900/30'
          }`}>
          <span>{statusConfig.icon}</span>
          <span>{statusConfig.label}</span>
        </span>
        <span className="text-[10px] text-[#737373]">{getTimeAgo(task.createdAt)}</span>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleViewDetails}
          className="flex-1 px-3 py-2 bg-background hover:bg-card-border text-foreground text-xs rounded-lg transition-all duration-200 border border-card-border"
        >
          查看详情
        </button>
        {task.status === 'failed' && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-lg transition-colors border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? '...' : '重试'}
          </button>
        )}
      </div>
    </div>
  );
}
