'use client';

import Image from 'next/image';

interface ImagePreviewProps {
  src?: string;           // 图片路径（方式1）
  imagePath?: string;     // 图片路径（方式2，兼容）
  alt?: string;           // 图片描述
  onRemove?: () => void;  // 删除回调（可选）
}

export default function ImagePreview({ src, imagePath, alt, onRemove }: ImagePreviewProps) {
  // 兼容两种方式传入图片路径
  const imgSrc = src || imagePath;

  // 如果没有图片路径，不渲染任何内容
  if (!imgSrc) {
    return null;
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-100 min-h-[240px]">
      <Image
        src={imgSrc}
        alt={alt || 'Preview'}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          title="删除图片"
        >
          <svg
            className="w-4 h-4"
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
      )}
    </div>
  );
}
