'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TaskCardSimple from './TaskCardSimple';
import Spinner from './ui/Spinner';

interface Task {
  id: string;
  status: string;
  productImagePath: string;
  resultImagePath: string | null;
  competitorImagePath: string | null;
  createdAt: string;
}

export default function RecentGenerations() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks?limit=4&offset=0');

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // 每 5 秒刷新一次
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  // 无记录时不显示
  if (!isLoading && tasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          最近生成
        </h2>
        {total > 4 && (
          <Link
            href="/history"
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            查看全部
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* 加载状态 */}
      {isLoading && tasks.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        /* 卡片网格 */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tasks.map((task) => (
            <TaskCardSimple key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
