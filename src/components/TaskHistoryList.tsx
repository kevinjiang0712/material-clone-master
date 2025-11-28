'use client';

import { useState, useEffect } from 'react';
import TaskHistoryCard from './TaskHistoryCard';
import Spinner from './ui/Spinner';

interface Task {
  id: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  competitorImagePath: string;
  productImagePath: string;
  resultImagePath: string | null;
  errorMessage: string | null;
  createdAt: Date | string;
}

interface TaskHistoryListProps {
  limit?: number;
  showTitle?: boolean;
  showLoadMore?: boolean;
}

export default function TaskHistoryList({
  limit = 6,
  showTitle = true,
  showLoadMore = false,
}: TaskHistoryListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchTasks = async (reset = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;
      const response = await fetch(`/api/tasks?limit=${limit}&offset=${currentOffset}`);

      if (!response.ok) {
        throw new Error('获取任务列表失败');
      }

      const data = await response.json();

      if (reset) {
        setTasks(data.tasks);
        setOffset(data.tasks.length);
      } else {
        setTasks((prev) => [...prev, ...data.tasks]);
        setOffset((prev) => prev + data.tasks.length);
      }

      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(true);

    // 每 5 秒刷新一次，以更新进行中的任务
    const interval = setInterval(() => {
      fetchTasks(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [limit]);

  const handleLoadMore = () => {
    fetchTasks(false);
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
        {error}
      </div>
    );
  }

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">📋</div>
        <p className="text-gray-500">还没有生成记录</p>
        <p className="text-gray-400 text-sm mt-2">上传图片开始你的第一次生成吧</p>
      </div>
    );
  }

  return (
    <div>
      {/* 标题 */}
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>📋</span>
            <span>最近生成</span>
          </h2>
          {total > limit && (
            <span className="text-sm text-gray-500">共 {total} 条记录</span>
          )}
        </div>
      )}

      {/* 任务列表 */}
      <div className="grid gap-4 grid-cols-2">
        {tasks.map((task) => (
          <TaskHistoryCard key={task.id} task={task} />
        ))}
      </div>

      {/* 加载更多 */}
      {showLoadMore && offset < total && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? '加载中...' : `加载更多 (${total - offset} 条)`}
          </button>
        </div>
      )}

      {/* 查看全部按钮 */}
      {!showLoadMore && total > limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // 滚动到顶部并触发浮动按钮
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            查看全部历史记录 ({total} 条) →
          </button>
        </div>
      )}
    </div>
  );
}
