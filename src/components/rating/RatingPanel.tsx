'use client';

import { useState, useEffect } from 'react';
import TaskRatingForm from './TaskRatingForm';
import ImageRatingGrid from './ImageRatingGrid';
import { ResultImage, TaskRatingsResponse } from '@/types';

interface RatingPanelProps {
  taskId: string;
  resultImages: ResultImage[];
}

export default function RatingPanel({
  taskId,
  resultImages,
}: RatingPanelProps) {
  const [activeTab, setActiveTab] = useState<'task' | 'images'>('task');
  const [ratingsData, setRatingsData] = useState<TaskRatingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载评分数据
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(`/api/ratings/task/${taskId}`);
        if (response.ok) {
          const data = await response.json();
          setRatingsData(data);
        }
      } catch (error) {
        console.error('获取评分失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [taskId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const statistics = ratingsData?.statistics;

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      {statistics && (statistics.ratedImagesCount > 0 || ratingsData?.taskRating) && (
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {ratingsData?.taskRating && (
            <div>
              <div className="text-xs text-gray-500">任务整体评分</div>
              <div className="text-2xl font-bold text-blue-600">
                {ratingsData.taskRating.overallRating}/5
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500">已评分图片</div>
            <div className="text-2xl font-bold text-green-600">
              {statistics.ratedImagesCount}/{statistics.totalImagesCount}
            </div>
          </div>
          {statistics.avgOverallRating > 0 && (
            <div>
              <div className="text-xs text-gray-500">图片平均分</div>
              <div className="text-2xl font-bold text-purple-600">
                {statistics.avgOverallRating.toFixed(1)}/5
              </div>
            </div>
          )}
          {(statistics.avgImageQuality > 0 ||
            statistics.avgStyleMatch > 0 ||
            statistics.avgProductFidelity > 0 ||
            statistics.avgCreativity > 0) && (
            <div>
              <div className="text-xs text-gray-500">维度平均分</div>
              <div className="text-sm text-gray-700 space-y-1">
                {statistics.avgImageQuality > 0 && (
                  <div>质量: {statistics.avgImageQuality.toFixed(1)}</div>
                )}
                {statistics.avgStyleMatch > 0 && (
                  <div>风格: {statistics.avgStyleMatch.toFixed(1)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 标签页切换 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('task')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'task'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            整体任务评分
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'images'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            图片对比评分
            {statistics && statistics.totalImagesCount > 0 && (
              <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {statistics.ratedImagesCount}/{statistics.totalImagesCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="py-6">
        {activeTab === 'task' ? (
          <TaskRatingForm
            taskId={taskId}
            existingRating={ratingsData?.taskRating || null}
          />
        ) : (
          <ImageRatingGrid
            taskId={taskId}
            resultImages={resultImages}
            existingRatings={ratingsData?.imageRatings || []}
          />
        )}
      </div>
    </div>
  );
}
