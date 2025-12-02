'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { ResultImage } from '@/types';
import { AVAILABLE_IMAGE_MODELS } from '@/lib/constants';

interface ImageComparisonProps {
  competitorImage?: string | null;  // 竞品图（模板模式下为空）
  productImage: string;
  resultImage: string;
  resultImages?: ResultImage[];  // 多图结果
  taskId?: string;
  onDownload?: (imagePath?: string) => void;
  onImageClick?: (src: string, alt: string) => void;  // 外部控制模态框
  // 模板模式相关
  generationMode?: 'competitor' | 'template';
  templateName?: string;
  templateThumbnail?: string;  // 模板缩略图路径
}

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function ImageModal({ src, alt, onClose }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
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
        </button>
      </div>
    </div>
  );
}

// 获取模型显示名称
function getModelDisplayName(modelId: string): string {
  const config = AVAILABLE_IMAGE_MODELS.find(m => m.model === modelId || m.id.includes(modelId));
  return config?.displayName || modelId;
}

// 获取最新一批的结果（按 createdAt 分组）
function getLatestResults(resultImages: ResultImage[]): ResultImage[] {
  if (!resultImages || resultImages.length === 0) return [];

  // 按 createdAt 分组
  const groups = new Map<string, ResultImage[]>();
  resultImages.forEach(img => {
    const key = img.createdAt || 'initial';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(img);
  });

  // 排序获取最新的 key
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'initial') return 1;
    if (b === 'initial') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const latestKey = sortedKeys[0];
  return groups.get(latestKey) || [];
}

export default function ImageComparison({
  competitorImage,
  productImage,
  resultImage,
  resultImages,
  onDownload,
  onImageClick,
  generationMode = 'competitor',
  templateName,
  templateThumbnail,
}: ImageComparisonProps) {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  // 获取最新一批的成功结果
  const latestResults = useMemo(() => getLatestResults(resultImages || []), [resultImages]);
  const successfulResults = latestResults.filter(r => r.path && !r.error);
  const hasMultipleResults = successfulResults.length > 1;

  // 处理图片点击
  const handleImageClick = (src: string, alt: string) => {
    if (onImageClick) {
      onImageClick(src, alt);
    } else {
      setModalImage({ src, alt });
    }
  };

  // 是否为模板模式
  const isTemplateMode = generationMode === 'template';

  // 计算网格列数：风格模板/竞品图 + 实拍图，两种模式一致
  const baseImages = 2;
  const totalImages = hasMultipleResults ? baseImages + successfulResults.length : baseImages + 1;
  const gridCols = totalImages <= 2 ? 'md:grid-cols-2' : totalImages === 3 ? 'md:grid-cols-3' : totalImages === 4 ? 'md:grid-cols-4' : 'md:grid-cols-5';

  return (
    <>
      {/* 所有图片放在一行 */}
      <div className={`grid gap-4 ${gridCols}`}>
        {/* 竞品图 或 模板标识 */}
        {isTemplateMode ? (
          // 模板模式：显示模板缩略图
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 font-medium bg-purple-100 text-purple-700 text-sm">
              风格模板
            </div>
            <div className="relative aspect-square">
              {templateThumbnail ? (
                <Image
                  src={templateThumbnail}
                  alt={templateName || '风格模板'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                // 降级显示：无缩略图时显示图标
                <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center">
                  <svg className="w-16 h-16 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <p className="text-lg font-medium text-purple-700">{templateName || '风格模板'}</p>
                  <p className="text-sm text-purple-500 mt-1">预设风格</p>
                </div>
              )}
            </div>
          </div>
        ) : competitorImage ? (
          // 竞品模式：显示竞品图
          <div
            className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleImageClick(competitorImage, '竞品图（参考）')}
          >
            <div className="px-4 py-3 font-medium bg-gray-100 text-gray-700 text-sm">
              竞品图（参考）
            </div>
            <div className="relative aspect-square">
              <Image
                src={competitorImage}
                alt="竞品图（参考）"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
        ) : null}

        {/* 实拍图 */}
        <div
          className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => handleImageClick(productImage, '实拍图（原始）')}
        >
          <div className="px-4 py-3 font-medium bg-gray-100 text-gray-700 text-sm">
            实拍图（原始）
          </div>
          <div className="relative aspect-square">
            <Image
              src={productImage}
              alt="实拍图（原始）"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>

        {/* 生成结果 */}
        {hasMultipleResults ? (
          // 多图结果
          successfulResults.map((result, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ring-2 ring-blue-500 ring-offset-2"
              onClick={() => handleImageClick(result.path!, getModelDisplayName(result.model))}
            >
              <div className="px-3 py-2 bg-blue-500 text-white font-medium flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${result.provider === 'jimen' ? 'bg-orange-300' : 'bg-blue-300'}`}></span>
                  <span className="truncate">{getModelDisplayName(result.model)}</span>
                </div>
                {onDownload && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(result.path);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors flex-shrink-0 ml-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载
                  </button>
                )}
              </div>
              <div className="relative aspect-square">
                <Image
                  src={result.path!}
                  alt={getModelDisplayName(result.model)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={index === 0}
                />
              </div>
            </div>
          ))
        ) : resultImage ? (
          // 单图结果
          <div
            className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ring-2 ring-blue-500 ring-offset-2"
            onClick={() => handleImageClick(resultImage, '生成结果')}
          >
            <div className="px-4 py-3 font-medium flex items-center justify-between bg-blue-500 text-white text-sm">
              <span>生成结果</span>
              {onDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下载
                </button>
              )}
            </div>
            <div className="relative aspect-square">
              <Image
                src={resultImage}
                alt="生成结果"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* 显示最新批次失败的模型 */}
      {latestResults.filter(r => r.error).length > 0 && (
        <div className="mt-4 bg-white rounded-xl p-4 shadow">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">生成失败：</span>
            {latestResults.filter(r => r.error).map((r, i) => (
              <span key={i} className="ml-2">
                {getModelDisplayName(r.model)}
                <span className="text-xs text-gray-400 ml-1">({r.error})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </>
  );
}
