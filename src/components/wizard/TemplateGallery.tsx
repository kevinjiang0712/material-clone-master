'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  suitableProducts: string[];
}

interface TemplateCategory {
  id: string;
  name: string;
  templates: TemplateItem[];
}

interface TemplateGalleryProps {
  selectedTemplateId: string | null;
  onSelect: (templateId: string, templateName: string, templateThumbnail: string) => void;
}

export default function TemplateGallery({ selectedTemplateId, onSelect }: TemplateGalleryProps) {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) throw new Error('获取模板失败');
        const data = await response.json();
        setCategories(data.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取模板失败');
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  const selectedTemplate = categories
    .flatMap(c => c.templates)
    .find(t => t.id === selectedTemplateId);

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category.id}>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {category.name}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {category.templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => onSelect(template.id, template.name, template.thumbnail)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 选中模板的详情 */}
      {selectedTemplate && (
        <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-purple-900">
                已选择：{selectedTemplate.name}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                {selectedTemplate.description}
              </p>
              <p className="text-xs text-purple-600 mt-2">
                适合：{selectedTemplate.suitableProducts.join('、')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: TemplateItem;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200
        border-2
        ${isSelected
          ? 'border-purple-500 ring-2 ring-purple-200 scale-[1.02]'
          : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
        }
      `}
    >
      {/* 缩略图 */}
      <div className="aspect-square bg-gray-100 relative">
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">暂无预览</span>
          </div>
        ) : (
          <Image
            src={template.thumbnail}
            alt={template.name}
            fill
            className="object-cover"
            sizes="150px"
            onError={() => setImageError(true)}
          />
        )}

        {/* 选中标记 */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* 名称 */}
      <div className="p-2 bg-white">
        <p className={`text-sm font-medium text-center truncate ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
          {template.name}
        </p>
      </div>
    </div>
  );
}
