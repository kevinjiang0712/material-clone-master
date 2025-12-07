'use client';

import ImageUploader from '../ImageUploader';
import SafeImage from '../SafeImage';
import { MaterialInfo } from '@/types';

interface Step1UploadProps {
  // 多选模式（批量生图）
  selectedMaterials: MaterialInfo[];
  onMaterialsChange: (materials: MaterialInfo[]) => void;
  maxImages?: number;
  onNext: () => void;
  onOpenMaterialLibrary?: () => void;
  // 单图上传回调（用于直接上传）
  onSingleUpload?: (path: string, name?: string) => void;
}

export default function Step1Upload({
  selectedMaterials,
  onMaterialsChange,
  maxImages = 10,
  onNext,
  onOpenMaterialLibrary,
  onSingleUpload,
}: Step1UploadProps) {
  const canProceed = selectedMaterials.length > 0;
  const isBatchMode = selectedMaterials.length > 1;

  // 移除单个素材
  const handleRemove = (index: number) => {
    const newMaterials = selectedMaterials.filter((_, i) => i !== index);
    onMaterialsChange(newMaterials);
  };

  // 处理直接上传（单张）
  const handleDirectUpload = (path: string) => {
    if (onSingleUpload) {
      onSingleUpload(path);
    }
    // 添加到素材列表
    const newMaterial: MaterialInfo = {
      id: `upload-${Date.now()}`,
      name: null,
      path,
    };
    onMaterialsChange([...selectedMaterials, newMaterial]);
  };

  // 清空所有选择
  const handleClearAll = () => {
    onMaterialsChange([]);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full"></span>
        上传产品实拍图
      </h2>
      <p className="text-sm text-muted mb-6 pl-3">
        请上传产品的真实照片，建议使用白底或简单背景的图片
        {maxImages > 1 && (
          <span className="ml-2 text-primary">
            （支持批量选择，最多 {maxImages} 张）
          </span>
        )}
      </p>

      {selectedMaterials.length > 0 ? (
        <div className="space-y-4">
          {/* 已选图片计数和清空按钮 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              已选 <span className="text-primary font-semibold">{selectedMaterials.length}</span>/{maxImages} 张
              {isBatchMode && (
                <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                  批量模式
                </span>
              )}
            </span>
            <button
              onClick={handleClearAll}
              className="text-sm text-danger hover:text-danger/80 transition-colors"
            >
              清空全部
            </button>
          </div>

          {/* 已选图片网格 */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {selectedMaterials.map((material, index) => (
              <div key={material.id} className="relative group aspect-square">
                <div className="w-full h-full rounded-lg overflow-hidden border border-card-border">
                  <SafeImage
                    src={material.path}
                    alt={material.name || `图片 ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 120px"
                    className="object-cover"
                  />
                </div>
                {/* 序号标记 */}
                <div className="absolute top-1 left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                {/* 商品名称 */}
                {material.name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                    <p className="text-xs text-white truncate">{material.name}</p>
                  </div>
                )}
                {/* 删除按钮 */}
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-danger hover:bg-danger/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="移除"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* 添加更多按钮 */}
            {selectedMaterials.length < maxImages && (
              <div
                onClick={onOpenMaterialLibrary}
                className="aspect-square rounded-lg border-2 border-dashed border-card-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-1 text-muted hover:text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">添加更多</span>
              </div>
            )}
          </div>

          {/* 批量模式提示 */}
          {isBatchMode && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p className="text-sm text-primary">
                <span className="font-semibold">批量生成模式：</span>
                将使用相同的风格为 {selectedMaterials.length} 张图片分别生成结果
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ImageUploader type="product" onUpload={handleDirectUpload} />

          {/* 从素材库选择按钮 */}
          {onOpenMaterialLibrary && (
            <div className="flex items-center justify-center">
              <button
                onClick={onOpenMaterialLibrary}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-all duration-300 border border-transparent hover:border-primary/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>从素材库选择（支持多选）</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 下一步按钮 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            px-8 py-3 rounded-xl font-medium transition-all duration-300
            flex items-center gap-2
            ${canProceed
              ? 'bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5'
              : 'bg-card text-muted cursor-not-allowed border border-card-border'
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
