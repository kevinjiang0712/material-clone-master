'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ResultImage } from '@/types';
import { AVAILABLE_IMAGE_MODELS } from '@/lib/constants';

interface ImageHistorySectionProps {
  resultImages: ResultImage[];
  onImageClick: (src: string, alt: string) => void;
  onDownload: (imagePath: string) => void;
}

// 获取模型显示名称
function getModelDisplayName(modelId: string): string {
  const config = AVAILABLE_IMAGE_MODELS.find(m => m.model === modelId || m.id.includes(modelId));
  return config?.displayName || modelId;
}

// 按 createdAt 分组，没有 createdAt 的归为最早一组
function groupByCreatedAt(images: ResultImage[]): Map<string, ResultImage[]> {
  const groups = new Map<string, ResultImage[]>();

  images.forEach(img => {
    const key = img.createdAt || 'initial';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(img);
  });

  return groups;
}

// 格式化时间
function formatTime(isoString: string): string {
  if (isoString === 'initial') return '首次生成';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '首次生成';
  }
}

export default function ImageHistorySection({
  resultImages,
  onImageClick,
  onDownload,
}: ImageHistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 按时间分组
  const groups = groupByCreatedAt(resultImages);
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'initial') return 1;
    if (b === 'initial') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // 最新一批（已在 ImageComparison 中显示）和历史批次
  const latestKey = sortedKeys[0];
  const historyKeys = sortedKeys.slice(1);

  // 历史图片（排除最新批次）
  const historyImages = historyKeys.flatMap(key => groups.get(key) || []);
  const successfulHistoryImages = historyImages.filter(r => r.path && !r.error);

  if (successfulHistoryImages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* 折叠标题 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-gray-700">历史生成</span>
          <span className="text-sm text-gray-500">({successfulHistoryImages.length} 张)</span>
        </div>
        <span className="text-sm text-gray-400">
          {isExpanded ? '点击收起' : '点击展开'}
        </span>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {historyKeys.map((key, groupIndex) => {
            const groupImages = groups.get(key) || [];
            const successfulImages = groupImages.filter(r => r.path && !r.error);

            if (successfulImages.length === 0) return null;

            return (
              <div key={key} className="space-y-2">
                {/* 时间标签 */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                  <span>{formatTime(key)}</span>
                </div>

                {/* 横向滚动图片列表 */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {successfulImages.map((result, index) => (
                    <div
                      key={`${key}-${index}`}
                      className="flex-shrink-0 w-32 bg-gray-50 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => onImageClick(result.path!, getModelDisplayName(result.model))}
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={result.path!}
                          alt={getModelDisplayName(result.model)}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                      <div className="px-2 py-1.5 bg-gray-100">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${result.provider === 'jimen' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                            <span className="text-xs text-gray-600 truncate">{getModelDisplayName(result.model)}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(result.path!);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title="下载"
                          >
                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
