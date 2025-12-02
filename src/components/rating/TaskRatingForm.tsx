'use client';

import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { TaskRating } from '@/types';

interface TaskRatingFormProps {
  taskId: string;
  existingRating?: TaskRating | null;
}

export default function TaskRatingForm({
  taskId,
  existingRating,
}: TaskRatingFormProps) {
  const [overallRating, setOverallRating] = useState(existingRating?.overallRating || 0);
  const [imageQuality, setImageQuality] = useState(existingRating?.imageQuality || 0);
  const [styleMatch, setStyleMatch] = useState(existingRating?.styleMatch || 0);
  const [productFidelity, setProductFidelity] = useState(existingRating?.productFidelity || 0);
  const [creativity, setCreativity] = useState(existingRating?.creativity || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [showDetails, setShowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // 自动保存逻辑（debounce 1秒）
  useEffect(() => {
    if (overallRating === 0) return; // 必须有整体评分才能保存

    const timer = setTimeout(() => {
      handleSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [overallRating, imageQuality, styleMatch, productFidelity, creativity, comment]);

  const handleSave = async () => {
    if (overallRating === 0) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const response = await fetch('/api/ratings/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          overallRating,
          imageQuality: imageQuality || null,
          styleMatch: styleMatch || null,
          productFidelity: productFidelity || null,
          creativity: creativity || null,
          comment: comment || null,
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('保存评分失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 整体评分 */}
      <div>
        <label className="block text-lg font-medium mb-3">
          整体评分 <span className="text-red-500">*</span>
        </label>
        <StarRating
          value={overallRating}
          onChange={setOverallRating}
          size="large"
          showLabel
        />
      </div>

      {/* 多维度评分（折叠面板） */}
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            多维度评分（可选）
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-5 h-5 text-gray-500 transition-transform ${
              showDetails ? 'rotate-180' : ''
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {showDetails && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图像质量
              </label>
              <StarRating
                value={imageQuality}
                onChange={setImageQuality}
                size="medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                风格匹配度
              </label>
              <StarRating
                value={styleMatch}
                onChange={setStyleMatch}
                size="medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品还原度
              </label>
              <StarRating
                value={productFidelity}
                onChange={setProductFidelity}
                size="medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                创意性
              </label>
              <StarRating
                value={creativity}
                onChange={setCreativity}
                size="medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* 文字反馈 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          评论或建议（可选）
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          placeholder="写下您的想法..."
        />
      </div>

      {/* 保存状态提示 */}
      {saveStatus !== 'idle' && (
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' && (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-blue-600">保存中...</span>
            </>
          )}
          {saveStatus === 'success' && (
            <>
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-600">已保存</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-red-600">保存失败，请重试</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
