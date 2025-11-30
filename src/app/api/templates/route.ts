import { NextResponse } from 'next/server';
import { PET_STYLE_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/petStyleTemplates';

// 返回前端需要的模板数据（不包含完整的 presetAnalysis，减少传输量）
interface TemplateListItem {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  suitableProducts: string[];
}

export async function GET() {
  try {
    // 只返回展示需要的字段，不返回完整的 presetAnalysis
    const templates: TemplateListItem[] = PET_STYLE_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      thumbnail: t.thumbnail,
      description: t.description,
      suitableProducts: t.suitableProducts,
    }));

    // 按分类分组
    const categories = TEMPLATE_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      templates: templates.filter(t => t.category === cat.id),
    }));

    return NextResponse.json({
      categories,
      templates,
    });
  } catch (error) {
    console.error('Failed to get templates:', error);
    return NextResponse.json(
      { error: '获取模板列表失败' },
      { status: 500 }
    );
  }
}
