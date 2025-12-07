'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TaskCardSimple from '@/components/TaskCardSimple';

interface Task {
  id: string;
  status: string;
  productImagePath: string;
  resultImagePath: string | null;
  competitorImagePath: string | null;
  createdAt: string;
}

interface GroupedTasks {
  today: Task[];
  yesterday: Task[];
  earlier: Task[];
}

function groupTasksByDate(tasks: Task[]): GroupedTasks {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const grouped: GroupedTasks = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  tasks.forEach((task) => {
    const taskDate = new Date(task.createdAt);
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

    if (taskDay.getTime() >= today.getTime()) {
      grouped.today.push(task);
    } else if (taskDay.getTime() >= yesterday.getTime()) {
      grouped.yesterday.push(task);
    } else {
      grouped.earlier.push(task);
    }
  });

  return grouped;
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const PAGE_SIZE = 20;

  const fetchTasks = async (offset: number = 0, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/tasks?limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await response.json();

      if (response.ok) {
        if (append) {
          setTasks((prev) => [...prev, ...data.tasks]);
        } else {
          setTasks(data.tasks);
        }
        setTotal(data.total);
        setHasMore(offset + data.tasks.length < data.total);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTasks(tasks.length, true);
    }
  };

  const groupedTasks = groupTasksByDate(tasks);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-[#a3a3a3]">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#f5f5f5]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white">生成历史</h1>
          <div className="text-sm text-[#737373]">
            共 {total} 条记录
          </div>
        </div>

        {/* 空状态 */}
        {tasks.length === 0 ? (
          <div className="bg-[#2d2d2d] border border-[#404040] rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">暂无生成记录</h3>
            <p className="text-[#a3a3a3] mb-6">开始创建您的第一个图像生成任务吧</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#e07a5f] text-white rounded-xl hover:bg-[#d0694e] transition-colors"
            >
              开始创建
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 今天 */}
            {groupedTasks.today.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#e07a5f]"></div>
                  <h2 className="text-lg font-semibold text-[#f5f5f5]">今天</h2>
                  <span className="text-sm text-[#737373]">({groupedTasks.today.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedTasks.today.map((task) => (
                    <TaskCardSimple key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* 昨天 */}
            {groupedTasks.yesterday.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#81b29a]"></div>
                  <h2 className="text-lg font-semibold text-[#f5f5f5]">昨天</h2>
                  <span className="text-sm text-[#737373]">({groupedTasks.yesterday.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedTasks.yesterday.map((task) => (
                    <TaskCardSimple key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* 更早 */}
            {groupedTasks.earlier.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#f2cc8f]"></div>
                  <h2 className="text-lg font-semibold text-[#f5f5f5]">更早</h2>
                  <span className="text-sm text-[#737373]">({groupedTasks.earlier.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedTasks.earlier.map((task) => (
                    <TaskCardSimple key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* 加载更多 */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-[#2d2d2d] border border-[#404040] rounded-xl text-[#a3a3a3] hover:text-white hover:border-[#e07a5f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      加载中...
                    </span>
                  ) : (
                    '加载更多'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
