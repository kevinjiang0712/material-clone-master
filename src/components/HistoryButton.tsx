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

export default function HistoryButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks?limit=10');

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  // 定期更新任务数量
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const response = await fetch('/api/tasks?limit=1');
        if (response.ok) {
          const data = await response.json();
          setTotal(data.total);
        }
      } catch (err) {
        console.error('Failed to fetch total:', err);
      }
    };

    fetchTotal();
    const interval = setInterval(fetchTotal, 10000); // 每 10 秒更新一次

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
      >
        <span>📋</span>
        <span>历史</span>
        {total > 0 && (
          <span className="bg-white text-blue-500 px-2 py-0.5 rounded-full text-xs font-bold">
            {total}
          </span>
        )}
      </button>

      {/* 侧边栏 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* 侧边栏内容 */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <div>
                  <h2 className="text-lg font-semibold">历史记录</h2>
                  <p className="text-sm text-blue-100">共 {total} 条记录</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">📋</div>
                  <p className="text-gray-500">还没有生成记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <TaskHistoryCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            {tasks.length > 0 && (
              <div className="border-t p-4 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}
                  className="w-full py-2 text-blue-500 hover:text-blue-600 font-medium text-sm"
                >
                  查看首页完整列表 →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
