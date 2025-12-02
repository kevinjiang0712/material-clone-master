'use client';

import ImageUploader from '../ImageUploader';
import ImagePreview from '../ImagePreview';

interface Step1UploadProps {
  productImagePath: string | null;
  onProductImageUpload: (path: string) => void;
  onNext: () => void;
  onOpenMaterialLibrary?: () => void;
}

export default function Step1Upload({
  productImagePath,
  onProductImageUpload,
  onNext,
  onOpenMaterialLibrary,
}: Step1UploadProps) {
  const canProceed = !!productImagePath;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        上传产品实拍图
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        请上传产品的真实照片，建议使用白底或简单背景的图片
      </p>

      {productImagePath ? (
        <div className="relative">
          <ImagePreview imagePath={productImagePath} alt="产品实拍图" />
          <button
            onClick={() => onProductImageUpload('')}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 p-2 rounded-lg shadow-sm transition-colors"
            title="重新上传"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ImageUploader type="product" onUpload={onProductImageUpload} />

          {/* 从素材库选择按钮 */}
          {onOpenMaterialLibrary && (
            <div className="flex items-center justify-center">
              <button
                onClick={onOpenMaterialLibrary}
                className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>从素材库选择</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 下一步按钮 */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all
            flex items-center gap-2
            ${canProceed
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          下一步
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
