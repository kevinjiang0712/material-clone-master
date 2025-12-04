'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/SafeImage';

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

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      const response = await fetch(`/api/materials?type=product&page=${page}&limit=24`);
      const data = await response.json();
      setMaterials(data.materials || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

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
      formData.append('type', 'product');
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

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个素材吗？')) return;

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      await fetchMaterials();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个素材吗？`)) return;

    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      }
      await fetchMaterials();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Batch delete error:', error);
      alert('批量删除失败');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectFromLibrary = (material: Material) => {
    // 跳转到首页并传递选中的素材路径和名称
    const params = new URLSearchParams();
    params.set('materialPath', material.path);
    if (material.name) {
      params.set('materialName', material.name);
    }
    router.push(`/?${params.toString()}`);
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

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#f5f5f5]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#333] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-[#333] rounded-lg transition-colors text-[#a3a3a3] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">我的素材库</h1>
                <p className="text-sm text-[#737373]">{total} 个素材</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#2d2d2d] rounded-lg p-1 border border-[#404040]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#404040] text-white' : 'text-[#737373] hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#404040] text-white' : 'text-[#737373] hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Batch Delete */}
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded-lg transition-colors"
                >
                  删除 ({selectedIds.size})
                </button>
              )}

              {/* Upload Button */}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#e07a5f] hover:bg-[#d0694e] text-white rounded-lg cursor-pointer transition-colors border border-[#e07a5f]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>上传素材</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e07a5f]"></div>
          </div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#737373]">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg mb-2">素材库为空</p>
            <p className="text-sm">点击上方按钮上传您的第一个素材</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-[#2d2d2d] border border-[#404040] hover:border-[#e07a5f] transition-all"
              >
                <SafeImage
                  src={material.path}
                  alt={material.name || '素材'}
                  fill
                  sizes="(max-width: 768px) 33vw, 150px"
                  className="object-cover cursor-pointer"
                  onClick={() => handleSelectFromLibrary(material)}
                />
                {/* Checkbox */}
                <div
                  className={`absolute top-2 left-2 w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${selectedIds.has(material.id) ? 'bg-[#e07a5f] border-[#e07a5f]' : 'bg-[#2d2d2d]/80 border-[#a3a3a3]'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(material.id);
                  }}
                >
                  {selectedIds.has(material.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {/* 商品名称显示 */}
                {material.name && (
                  <div className="absolute top-8 left-0 right-0 px-2 pointer-events-none">
                    <p className="text-xs text-white bg-black/60 rounded px-1.5 py-0.5 truncate">{material.name}</p>
                  </div>
                )}
                {/* 操作按钮组 */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 编辑按钮 */}
                  <button
                    onClick={(e) => openEditModal(material, e)}
                    className="w-6 h-6 bg-blue-600/80 hover:bg-blue-600 rounded-full flex items-center justify-center"
                    title="编辑商品名称"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(material.id);
                    }}
                    className="w-6 h-6 bg-red-900/80 hover:bg-red-900 rounded-full flex items-center justify-center"
                    title="删除素材"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Use Button */}
                <button
                  onClick={() => handleSelectFromLibrary(material)}
                  className="absolute bottom-0 left-0 right-0 py-1.5 bg-[#e07a5f]/90 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  使用此素材
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#2d2d2d] rounded-lg border border-[#404040] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#333] border-b border-[#404040]">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="w-16 px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">预览</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">商品名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">尺寸</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">大小</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">上传时间</th>
                  <th className="w-40 px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#404040]">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-[#333]">
                    <td className="px-4 py-3">
                      <div
                        className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center ${selectedIds.has(material.id) ? 'bg-[#e07a5f] border-[#e07a5f]' : 'bg-[#2d2d2d] border-[#a3a3a3]'
                          }`}
                        onClick={() => toggleSelect(material.id)}
                      >
                        {selectedIds.has(material.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-[#333]">
                        <SafeImage
                          src={material.path}
                          alt={material.name || '素材'}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#f5f5f5]">
                      {material.name || <span className="text-[#737373]">未命名</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#f5f5f5]">
                      {material.width && material.height
                        ? `${material.width} × ${material.height}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#f5f5f5]">
                      {formatFileSize(material.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#f5f5f5]">
                      {formatDate(material.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSelectFromLibrary(material)}
                        className="px-3 py-1 text-sm bg-[#e07a5f] hover:bg-[#d0694e] text-white rounded mr-2"
                      >
                        使用
                      </button>
                      <button
                        onClick={(e) => openEditModal(material, e)}
                        className="px-3 py-1 text-sm bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 border border-blue-900/30 rounded mr-2"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="px-3 py-1 text-sm bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-[#404040] bg-[#2d2d2d] text-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333]"
            >
              上一页
            </button>
            <span className="text-sm text-[#737373] px-4">
              第 {page} 页，共 {totalPages} 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-[#404040] bg-[#2d2d2d] text-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333]"
            >
              下一页
            </button>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editModalOpen && editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#2d2d2d] rounded-2xl shadow-xl w-full max-w-md m-4 border border-[#404040]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#404040]">
              <h2 className="text-lg font-semibold text-white">编辑商品名称</h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-[#404040] rounded-full transition-colors text-[#a3a3a3] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Preview */}
              <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-[#333]">
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
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  商品名称
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="输入商品名称（可选）"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:border-[#e07a5f] transition-colors"
                />
                <p className="mt-1 text-xs text-[#737373]">
                  商品名称将用于生图时的提示词，帮助 AI 更好理解商品
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#404040]">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-[#a3a3a3] hover:text-white hover:bg-[#404040] rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-2 bg-[#e07a5f] hover:bg-[#d0694e] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#2d2d2d] rounded-2xl shadow-xl w-full max-w-md m-4 border border-[#404040]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#404040]">
              <h2 className="text-lg font-semibold text-white">上传素材</h2>
              <button
                onClick={closeUploadModal}
                className="p-2 hover:bg-[#404040] rounded-full transition-colors text-[#a3a3a3] hover:text-white"
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
                <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-[#333]">
                  <img
                    src={uploadPreview}
                    alt="预览"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  商品名称
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="输入商品名称（可选）"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:border-[#e07a5f] transition-colors"
                />
                <p className="mt-1 text-xs text-[#737373]">
                  商品名称将用于生图时的提示词，帮助 AI 更好理解商品
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#404040]">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 text-[#a3a3a3] hover:text-white hover:bg-[#404040] rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="px-6 py-2 bg-[#e07a5f] hover:bg-[#d0694e] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
