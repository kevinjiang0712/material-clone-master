'use client';

import { useCallback, useState } from 'react';
import Spinner from './ui/Spinner';

interface ImageUploaderProps {
  type: 'competitor' | 'product';
  onUpload: (path: string) => void;
}

export default function ImageUploader({ type, onUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '上传失败');
        }

        onUpload(data.path);
      } catch (err) {
        setError(err instanceof Error ? err.message : '上传失败');
      } finally {
        setIsUploading(false);
      }
    },
    [type, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleUpload(file);
      } else {
        setError('请上传图片文件');
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(file);
    };
    input.click();
  }, [handleUpload]);

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-8
        flex flex-col items-center justify-center
        min-h-[240px] cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleFileSelect}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Spinner />
          <p className="text-gray-500 mt-3">上传中...</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">点击或拖拽上传图片</p>
          <p className="text-sm text-gray-400 mt-1">
            支持 JPG、PNG、WebP，最大 10MB
          </p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}
