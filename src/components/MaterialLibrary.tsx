'use client';

import { useState, useEffect, useCallback } from 'react';
import SafeImage from './SafeImage';

interface Material {
  id: string;
  name: string | null;
  path: string;
  type: string;
  source: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface MaterialLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (material: Material) => void;
  type?: 'product' | 'competitor';
  // 多选模式新增属性
  multiSelect?: boolean;
  maxSelect?: number;
  selectedPaths?: string[];
  onMultiSelect?: (materials: Material[]) => void;
}

export default function MaterialLibrary({
  isOpen,
  onClose,
  onSelect,
  type = 'product',
  multiSelect = false,
  maxSelect = 10,
  selectedPaths = [],
  onMultiSelect,
}: MaterialLibraryProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 多选模式状态
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);

  // 上传弹窗状态
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // 编辑弹窗状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/materials?type=${type}&page=${page}&limit=12`);
      const data = await response.json();
      setMaterials(data.materials || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  }, [type, page]);

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
      setSelectedId(null);
      // 多选模式：重置选中状态
      if (!multiSelect) {
        setSelectedMaterials([]);
      }
    }
  }, [isOpen, fetchMaterials, multiSelect]);

  // 当 materials 加载完成后，根据 selectedPaths 初始化选中状态
  useEffect(() => {
    if (multiSelect && selectedPaths.length > 0 && materials.length > 0) {
      const orderedSelected = selectedPaths
        .map(path => materials.find(m => m.path === path))
        .filter((m): m is Material => m !== undefined);
      setSelectedMaterials(orderedSelected);
    }
  }, [multiSelect, selectedPaths, materials]);

  // 选择文件后打开弹窗
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadName('');
    setUploadPreview(URL.createObjectURL(file));
    setUploadModalOpen(true);
    e.target.value = '';
  };

  // 关闭上传弹窗
  const closeUploadModal = () => {
    setUploadModalOpen(false);
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadFile(null);
    setUploadName('');
    setUploadPreview(null);
  };

  // 确认上传
  const handleConfirmUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', type);
      if (uploadName.trim()) {
        formData.append('name', uploadName.trim());
      }

      const response = await fetch('/api/materials', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '上传失败');
      }

      // 关闭弹窗并刷新列表
      closeUploadModal();
      await fetchMaterials();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个素材吗？')) return;

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      // 刷新列表
      await fetchMaterials();
      if (selectedId === id) {
        setSelectedId(null);
      }
      // 多选模式：从选中列表中移除
      setSelectedMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleConfirm = () => {
    const selected = materials.find((m) => m.id === selectedId);
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  // 多选模式：切换选中状态
  const toggleMultiSelect = (material: Material) => {
    setSelectedMaterials(prev => {
      const index = prev.findIndex(m => m.id === material.id);
      if (index >= 0) {
        return prev.filter(m => m.id !== material.id);
      } else {
        if (prev.length >= maxSelect) {
          alert(`最多只能选择 ${maxSelect} 张图片`);
          return prev;
        }
        return [...prev, material];
      }
    });
  };

  // 多选模式确认
  const handleMultiConfirm = () => {
    if (onMultiSelect && selectedMaterials.length > 0) {
      onMultiSelect(selectedMaterials);
      onClose();
    }
  };

  // 获取素材在选中列表中的序号
  const getSelectionIndex = (materialId: string): number => {
    return selectedMaterials.findIndex(m => m.id === materialId);
  };

  // 处理点击素材
  const handleMaterialClick = (material: Material) => {
    if (multiSelect) {
      toggleMultiSelect(material);
    } else {
      setSelectedId(material.id);
    }
  };

  // 判断素材是否被选中
  const isMaterialSelected = (materialId: string): boolean => {
    if (multiSelect) {
      return selectedMaterials.some(m => m.id === materialId);
    }
    return selectedId === materialId;
  };

  // 打开编辑弹窗
  const openEditModal = (material: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMaterial(material);
    setEditName(material.name || '');
    setEditModalOpen(true);
  };

  // 关闭编辑弹窗
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingMaterial(null);
    setEditName('');
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingMaterial) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/materials/${editingMaterial.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      // 更新本地列表
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === editingMaterial.id ? { ...m, name: editName.trim() || null } : m
        )
      );

      closeEditModal();
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col m-4 border border-card-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
          <h2 className="text-xl font-semibold text-foreground">
            {type === 'product' ? '选择实拍图' : '选择竞品图'}
            {multiSelect && (
              <span className="ml-2 text-sm font-normal text-muted">
                （可多选，最多 {maxSelect} 张）
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/20 rounded-full transition-colors text-muted hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload Button */}
        <div className="px-6 py-3 border-b border-card-border bg-background/50">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>上传新素材</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Materials Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>暂无素材，点击上方按钮上传</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {materials.map((material) => {
                const isSelected = isMaterialSelected(material.id);
                const selectionIndex = multiSelect ? getSelectionIndex(material.id) : -1;

                return (
                  <div
                    key={material.id}
                    onClick={() => handleMaterialClick(material)}
                    className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-muted'
                      }`}
                  >
                    <div className="relative w-full h-full">
                      <SafeImage
                        src={material.path}
                        alt={material.name || '素材'}
                        fill
                        sizes="(max-width: 768px) 33vw, 150px"
                        className="object-cover"
                      />
                    </div>
                    {/* 商品名称显示 */}
                    {material.name && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                        <p className="text-xs text-white truncate">{material.name}</p>
                      </div>
                    )}
                    {/* 选中标记 */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        {multiSelect ? (
                          <span className="text-white text-xs font-bold">
                            {selectionIndex + 1}
                          </span>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                    {/* 操作按钮组 */}
                    <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 编辑按钮 */}
                      <button
                        onClick={(e) => openEditModal(material, e)}
                        className="w-6 h-6 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center"
                        title="编辑商品名称"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => handleDelete(material.id, e)}
                        className="w-6 h-6 bg-danger hover:bg-danger/90 rounded-full flex items-center justify-center"
                        title="删除素材"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-card-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-card-border text-muted disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/20 hover:text-foreground"
            >
              上一页
            </button>
            <span className="text-sm text-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-card-border text-muted disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/20 hover:text-foreground"
            >
              下一页
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-card-border">
          {/* 左侧：多选模式显示已选数量 */}
          <div className="text-sm text-muted">
            {multiSelect && (
              <span>
                已选 <span className="font-semibold text-primary">{selectedMaterials.length}</span> 张
                <span className="text-muted">（最多 {maxSelect} 张）</span>
              </span>
            )}
          </div>

          {/* 右侧：按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted hover:text-foreground hover:bg-muted/20 rounded-lg transition-colors"
            >
              取消
            </button>
            {multiSelect ? (
              <button
                onClick={handleMultiConfirm}
                disabled={selectedMaterials.length === 0}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认选择 ({selectedMaterials.length})
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={!selectedId}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认选择
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingMaterial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md m-4 border border-card-border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
              <h3 className="text-lg font-semibold text-foreground">编辑商品名称</h3>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-muted/20 rounded-full transition-colors text-muted hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Preview */}
              <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-background">
                <SafeImage
                  src={editingMaterial.path}
                  alt={editingMaterial.name || '素材'}
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  商品名称
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="输入商品名称（可选）"
                  className="w-full px-4 py-3 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
                <p className="mt-1 text-xs text-muted">
                  商品名称将用于生图时的提示词，帮助 AI 更好理解商品
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-card-border">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-muted hover:text-foreground hover:bg-muted/20 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md m-4 border border-card-border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
              <h3 className="text-lg font-semibold text-foreground">上传素材</h3>
              <button
                onClick={closeUploadModal}
                className="p-2 hover:bg-muted/20 rounded-full transition-colors text-muted hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Preview */}
              {uploadPreview && (
                <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-background">
                  <img
                    src={uploadPreview}
                    alt="预览"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  商品名称
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="输入商品名称（可选）"
                  className="w-full px-4 py-3 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
                <p className="mt-1 text-xs text-muted">
                  商品名称将用于生图时的提示词，帮助 AI 更好理解商品
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-card-border">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 text-muted hover:text-foreground hover:bg-muted/20 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
