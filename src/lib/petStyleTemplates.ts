import { CompetitorAnalysis } from '@/types';

// 宠物行业风格模板
export interface PetStyleTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;  // 缩略图路径
  description: string;
  suitableProducts: string[];  // 适用产品类型
  presetAnalysis: CompetitorAnalysis;
}

// 模板分类
export const TEMPLATE_CATEGORIES = [
  { id: 'food', name: '主粮/零食类' },
  { id: 'supplies', name: '用品/洗护类' },
  { id: 'promotion', name: '大促活动类' },
] as const;

// 宠物行业风格模板库
export const PET_STYLE_TEMPLATES: PetStyleTemplate[] = [
  // ========== 主粮/零食类 ==========
  {
    id: 'pet-food-natural',
    name: '清新自然风',
    category: 'food',
    thumbnail: '/templates/pet-food-natural.jpg',
    description: '绿色自然背景，突出健康、天然的产品理念',
    suitableProducts: ['天然粮', '冻干', '有机食品', '蔬果零食'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中偏下',
          vertical_offset: '下三分之一',
          size: '产品占画面60%，视觉突出',
          view_angle: '平拍略俯',
          rotation: '无旋转或微倾5°',
          edge_crop: false
        },
        background_structure: {
          type: '渐变背景+自然元素',
          layers: ['浅绿到深绿渐变底层', '草地/树叶装饰层', '产品层'],
          decorations: ['绿叶', '草地元素', '阳光光斑', '露珠']
        },
        text_blocks: [],
        decors: {
          light_effects: ['顶部自然光', '柔和光斑'],
          shadows: ['产品底部柔和阴影'],
          shapes: []
        },
        layer_sequence: ['background', 'decorations', 'product', 'light_effects']
      },
      style: {
        color_style: {
          primary_color: '#4CAF50',
          secondary_colors: ['#8BC34A', '#FFFFFF', '#F5F5DC'],
          saturation: '中等偏高，清新明快',
          brightness: '明亮，阳光感'
        },
        lighting: {
          direction: '顶部偏前',
          type: '柔光',
          shadow_intensity: '轻柔',
          shadow_blur: '高模糊度，自然过渡'
        },
        texture: {
          surface: '自然质感',
          grain: '细腻',
          reflection: '低反光，哑光质感'
        },
        background_style: {
          gradient_direction: '上到下',
          blur_level: '背景元素轻微虚化',
          floating_effects: true
        },
        vibe: '健康、自然、清新、活力',
        style_prompt: 'Fresh natural green background with leaves and grass elements, soft sunlight, healthy organic vibe, pet food product photography'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '天然健康，给毛孩子最好的营养',
          points: [
            { point: '天然原料', category: '品质' },
            { point: '营养均衡', category: '功能' },
            { point: '健康放心', category: '情感' }
          ],
          target_audience: '注重宠物健康的养宠人士',
          emotional_appeal: '让主人安心，让宠物健康'
        }
      }
    }
  },
  {
    id: 'pet-food-appetite',
    name: '食欲诱惑风',
    category: 'food',
    thumbnail: '/templates/pet-food-appetite.jpg',
    description: '暖色调，展示食材，激发购买欲望',
    suitableProducts: ['零食', '罐头', '湿粮', '肉干', '冻干'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '中心偏下',
          size: '产品占画面50-60%',
          view_angle: '45度俯拍',
          rotation: '轻微倾斜展示包装',
          edge_crop: false
        },
        background_structure: {
          type: '暖色渐变+食材元素',
          layers: ['暖橙色渐变底层', '食材装饰层', '产品层'],
          decorations: ['肉块', '食材原料', '香气效果线', '油光质感']
        },
        text_blocks: [],
        decors: {
          light_effects: ['聚光灯效果', '食物油光'],
          shadows: ['产品底部投影'],
          shapes: []
        },
        layer_sequence: ['background', 'ingredients', 'product', 'highlights']
      },
      style: {
        color_style: {
          primary_color: '#FF8C00',
          secondary_colors: ['#8B4513', '#FFD700', '#DC143C'],
          saturation: '高饱和度，色彩鲜艳',
          brightness: '温暖明亮'
        },
        lighting: {
          direction: '侧前方',
          type: '硬光+柔光结合',
          shadow_intensity: '中等',
          shadow_blur: '中等'
        },
        texture: {
          surface: '食物质感，有光泽',
          grain: '细腻',
          reflection: '适度反光，突出新鲜感'
        },
        background_style: {
          gradient_direction: '中心向外',
          blur_level: '食材元素轻微虚化',
          floating_effects: false
        },
        vibe: '美味、诱人、新鲜、高品质',
        style_prompt: 'Warm appetizing food photography style, orange and brown tones, visible meat ingredients, glossy texture, delicious pet food presentation'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '真材实料，看得见的美味',
          points: [
            { point: '真肉制作', category: '品质' },
            { point: '适口性好', category: '功能' },
            { point: '高蛋白营养', category: '功能' }
          ],
          target_audience: '想给宠物吃好的宠物主',
          emotional_appeal: '让挑食的毛孩子也爱上吃饭'
        }
      }
    }
  },
  {
    id: 'pet-food-premium',
    name: '高端轻奢风',
    category: 'food',
    thumbnail: '/templates/pet-food-premium.jpg',
    description: '深色背景，金色点缀，彰显品质感',
    suitableProducts: ['进口粮', '高端线产品', '处方粮', '特殊配方粮'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '中心',
          size: '产品占画面55%，留白优雅',
          view_angle: '平拍',
          rotation: '无旋转，端正摆放',
          edge_crop: false
        },
        background_structure: {
          type: '深色纯色+光效',
          layers: ['深色背景层', '光效装饰层', '产品层'],
          decorations: ['金色光点', '高光线条', '金属质感元素']
        },
        text_blocks: [],
        decors: {
          light_effects: ['轮廓光', '金色高光', '光晕效果'],
          shadows: ['深色环境阴影'],
          shapes: ['金色几何线条']
        },
        layer_sequence: ['background', 'light_effects', 'product', 'highlights']
      },
      style: {
        color_style: {
          primary_color: '#1a1a2e',
          secondary_colors: ['#D4AF37', '#C0C0C0', '#2C2C54'],
          saturation: '低饱和度，高级感',
          brightness: '整体偏暗，产品明亮'
        },
        lighting: {
          direction: '多角度轮廓光',
          type: '硬光勾边',
          shadow_intensity: '强',
          shadow_blur: '低'
        },
        texture: {
          surface: '高端质感',
          grain: '细腻精致',
          reflection: '金属光泽'
        },
        background_style: {
          gradient_direction: '中心向外暗角',
          blur_level: '背景纯净',
          floating_effects: true
        },
        vibe: '高端、奢华、专业、品质',
        style_prompt: 'Premium luxury pet food photography, dark background with gold accents, elegant lighting, high-end brand feeling, professional product shot'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '高端品质，给最爱的它最好的',
          points: [
            { point: '进口原料', category: '品质' },
            { point: '科学配方', category: '功能' },
            { point: '品牌保障', category: '品质' }
          ],
          target_audience: '高消费能力、追求品质的宠物主',
          emotional_appeal: '宠爱不将就，品质生活从饮食开始'
        }
      }
    }
  },
  {
    id: 'pet-food-cute',
    name: '萌宠互动风',
    category: 'food',
    thumbnail: '/templates/pet-food-cute.jpg',
    description: '温馨场景，有宠物元素，情感共鸣',
    suitableProducts: ['全品类', '日常口粮', '零食', '需要情感共鸣的产品'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '可偏左或偏右，留空间给宠物元素',
          vertical_offset: '中下部',
          size: '产品占画面40-50%',
          view_angle: '平拍或轻微俯拍',
          rotation: '自然摆放',
          edge_crop: false
        },
        background_structure: {
          type: '温馨场景',
          layers: ['柔和色彩背景', '家居/宠物元素', '产品层'],
          decorations: ['可爱爪印', '宠物剪影', '爱心', '毛绒质感元素']
        },
        text_blocks: [],
        decors: {
          light_effects: ['柔和环境光'],
          shadows: ['自然阴影'],
          shapes: ['爪印图案', '爱心形状']
        },
        layer_sequence: ['background', 'pet_elements', 'product', 'decorations']
      },
      style: {
        color_style: {
          primary_color: '#FFB6C1',
          secondary_colors: ['#87CEEB', '#FFFACD', '#E6E6FA'],
          saturation: '中等，柔和可爱',
          brightness: '明亮温暖'
        },
        lighting: {
          direction: '前侧光',
          type: '柔光',
          shadow_intensity: '轻',
          shadow_blur: '高'
        },
        texture: {
          surface: '柔软温暖',
          grain: '细腻',
          reflection: '低反光'
        },
        background_style: {
          gradient_direction: '自然过渡',
          blur_level: '背景虚化营造氛围',
          floating_effects: false
        },
        vibe: '温馨、可爱、治愈、有爱',
        style_prompt: 'Cute and warm pet product photography, pastel colors, paw prints and heart decorations, cozy atmosphere, emotional connection with pets'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '有爱的选择，毛孩子值得被宠爱',
          points: [
            { point: '宠物喜欢', category: '情感' },
            { point: '主人放心', category: '情感' },
            { point: '每一口都是爱', category: '情感' }
          ],
          target_audience: '感性消费、把宠物当家人的宠物主',
          emotional_appeal: '它是家人，值得最好的宠爱'
        }
      }
    }
  },

  // ========== 用品/洗护类 ==========
  {
    id: 'pet-supplies-simple',
    name: '简约功能风',
    category: 'supplies',
    thumbnail: '/templates/pet-supplies-simple.jpg',
    description: '白底简洁，突出产品本身，适合功能性产品',
    suitableProducts: ['智能用品', '日用品', '功能性产品', '工具类'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '居中',
          size: '产品占画面65-75%',
          view_angle: '平拍或3/4角度',
          rotation: '最佳展示角度',
          edge_crop: false
        },
        background_structure: {
          type: '纯白或浅灰背景',
          layers: ['纯色背景', '产品层', '倒影层'],
          decorations: ['简洁倒影', '微弱阴影']
        },
        text_blocks: [],
        decors: {
          light_effects: ['均匀柔光'],
          shadows: ['产品底部轻微倒影'],
          shapes: []
        },
        layer_sequence: ['background', 'reflection', 'product']
      },
      style: {
        color_style: {
          primary_color: '#FFFFFF',
          secondary_colors: ['#F5F5F5', '#E0E0E0'],
          saturation: '低，干净清爽',
          brightness: '高，明亮清晰'
        },
        lighting: {
          direction: '顶部+前侧',
          type: '柔光箱',
          shadow_intensity: '极轻',
          shadow_blur: '高'
        },
        texture: {
          surface: '产品真实质感',
          grain: '无颗粒',
          reflection: '根据产品材质'
        },
        background_style: {
          gradient_direction: '无渐变',
          blur_level: '无虚化',
          floating_effects: false
        },
        vibe: '简洁、专业、清晰、可信',
        style_prompt: 'Clean minimal product photography, pure white background, professional lighting, focus on product details, e-commerce ready'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '专业品质，功能可靠',
          points: [
            { point: '高品质材料', category: '品质' },
            { point: '实用功能', category: '功能' },
            { point: '耐用可靠', category: '品质' }
          ],
          target_audience: '注重产品品质和功能的理性消费者',
          emotional_appeal: '简单好用，解决养宠难题'
        }
      }
    }
  },
  {
    id: 'pet-care-professional',
    name: '专业医护风',
    category: 'supplies',
    thumbnail: '/templates/pet-care-professional.jpg',
    description: '蓝白配色，干净专业，适合医护保健类',
    suitableProducts: ['保健品', '药品', '医护用品', '洗护产品'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '中心偏下',
          size: '产品占画面55-65%',
          view_angle: '平拍',
          rotation: '端正展示',
          edge_crop: false
        },
        background_structure: {
          type: '蓝白渐变+专业元素',
          layers: ['浅蓝渐变背景', '医护元素装饰', '产品层'],
          decorations: ['分子结构图', '专业图标', '干净线条']
        },
        text_blocks: [],
        decors: {
          light_effects: ['冷调均匀光'],
          shadows: ['清晰但柔和的阴影'],
          shapes: ['科技感线条', '圆形元素']
        },
        layer_sequence: ['background', 'tech_elements', 'product']
      },
      style: {
        color_style: {
          primary_color: '#E3F2FD',
          secondary_colors: ['#2196F3', '#FFFFFF', '#4CAF50'],
          saturation: '低到中等',
          brightness: '明亮清新'
        },
        lighting: {
          direction: '顶部均匀',
          type: '柔光',
          shadow_intensity: '轻',
          shadow_blur: '中等'
        },
        texture: {
          surface: '干净光滑',
          grain: '无',
          reflection: '轻微'
        },
        background_style: {
          gradient_direction: '上到下',
          blur_level: '元素轻微虚化',
          floating_effects: false
        },
        vibe: '专业、可信、科学、安全',
        style_prompt: 'Professional medical pet care product photography, blue and white color scheme, clean scientific look, trustworthy healthcare feeling'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '专业配方，科学呵护',
          points: [
            { point: '科学配方', category: '功能' },
            { point: '专业研发', category: '品质' },
            { point: '安全有效', category: '功能' }
          ],
          target_audience: '关注宠物健康的科学养宠人群',
          emotional_appeal: '专业守护，让宠物更健康'
        }
      }
    }
  },
  {
    id: 'pet-care-organic',
    name: '天然有机风',
    category: 'supplies',
    thumbnail: '/templates/pet-care-organic.jpg',
    description: '植物元素，自然成分，适合天然洗护类',
    suitableProducts: ['天然洗护', '驱虫产品', '护理用品', '有机产品'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中或偏左',
          vertical_offset: '中下部',
          size: '产品占画面50-60%',
          view_angle: '轻微俯拍',
          rotation: '自然摆放',
          edge_crop: false
        },
        background_structure: {
          type: '自然元素场景',
          layers: ['米白/浅绿背景', '植物装饰层', '产品层'],
          decorations: ['绿叶', '植物', '天然成分素材', '木质元素']
        },
        text_blocks: [],
        decors: {
          light_effects: ['自然光感'],
          shadows: ['柔和自然阴影'],
          shapes: []
        },
        layer_sequence: ['background', 'plants', 'product', 'leaves']
      },
      style: {
        color_style: {
          primary_color: '#F5F5DC',
          secondary_colors: ['#8FBC8F', '#DEB887', '#228B22'],
          saturation: '中等，自然色调',
          brightness: '柔和明亮'
        },
        lighting: {
          direction: '侧前自然光',
          type: '柔光',
          shadow_intensity: '轻',
          shadow_blur: '高'
        },
        texture: {
          surface: '自然质感',
          grain: '轻微自然颗粒',
          reflection: '低反光'
        },
        background_style: {
          gradient_direction: '自然过渡',
          blur_level: '背景植物虚化',
          floating_effects: false
        },
        vibe: '天然、温和、有机、安心',
        style_prompt: 'Natural organic pet care product photography, botanical elements, green leaves, beige background, eco-friendly gentle atmosphere'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '天然成分，温和不刺激',
          points: [
            { point: '植物萃取', category: '品质' },
            { point: '温和配方', category: '功能' },
            { point: '无添加', category: '品质' }
          ],
          target_audience: '追求天然、环保的养宠人群',
          emotional_appeal: '来自大自然的温和呵护'
        }
      }
    }
  },

  // ========== 大促活动类 ==========
  {
    id: 'pet-promo-double11',
    name: '双11狂欢风',
    category: 'promotion',
    thumbnail: '/templates/pet-promo-double11.jpg',
    description: '红色主调，促销感强，紧迫感',
    suitableProducts: ['全品类', '双11活动商品'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '中心',
          size: '产品占画面50-60%',
          view_angle: '平拍或俯拍',
          rotation: '动感倾斜',
          edge_crop: false
        },
        background_structure: {
          type: '红色促销背景',
          layers: ['红色渐变底层', '促销元素层', '产品层', '特效层'],
          decorations: ['光线放射', '金币', '礼盒', '彩带', '爆炸效果']
        },
        text_blocks: [],
        decors: {
          light_effects: ['强烈高光', '闪烁效果', '光芒四射'],
          shadows: ['强对比阴影'],
          shapes: ['爆炸形状', '星星', '数字装饰']
        },
        layer_sequence: ['background', 'effects', 'product', 'highlights']
      },
      style: {
        color_style: {
          primary_color: '#FF0000',
          secondary_colors: ['#FFD700', '#FF6B6B', '#FFFFFF'],
          saturation: '极高，视觉冲击',
          brightness: '高亮度'
        },
        lighting: {
          direction: '多角度',
          type: '硬光',
          shadow_intensity: '强',
          shadow_blur: '低'
        },
        texture: {
          surface: '高光泽',
          grain: '无',
          reflection: '强反光'
        },
        background_style: {
          gradient_direction: '中心放射',
          blur_level: '元素清晰',
          floating_effects: true
        },
        vibe: '狂欢、促销、紧迫、热烈',
        style_prompt: 'Double 11 shopping festival style, red and gold colors, explosive effects, sales promotion atmosphere, exciting and urgent feeling'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '双11狂欢，错过等一年',
          points: [
            { point: '限时特惠', category: '价格' },
            { point: '全年最低', category: '价格' },
            { point: '狂欢盛典', category: '场景' }
          ],
          target_audience: '等待促销囤货的消费者',
          emotional_appeal: '错过就要等一年，赶紧下单'
        }
      }
    }
  },
  {
    id: 'pet-promo-newyear',
    name: '年货节喜庆风',
    category: 'promotion',
    thumbnail: '/templates/pet-promo-newyear.jpg',
    description: '红金配色，传统喜庆，年货氛围',
    suitableProducts: ['全品类', '年货节商品', '礼盒装'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '中心偏下',
          size: '产品占画面55%',
          view_angle: '平拍或轻微俯拍',
          rotation: '端正或微倾',
          edge_crop: false
        },
        background_structure: {
          type: '喜庆红色背景',
          layers: ['红色底层', '传统元素层', '产品层', '装饰层'],
          decorations: ['祥云', '灯笼', '金色边框', '福字', '梅花', '烟花']
        },
        text_blocks: [],
        decors: {
          light_effects: ['温暖灯光', '金色光晕'],
          shadows: ['柔和阴影'],
          shapes: ['云纹', '传统花纹']
        },
        layer_sequence: ['background', 'traditional_elements', 'product', 'decorations']
      },
      style: {
        color_style: {
          primary_color: '#C41E3A',
          secondary_colors: ['#FFD700', '#8B0000', '#FFFACD'],
          saturation: '高，喜庆热烈',
          brightness: '温暖明亮'
        },
        lighting: {
          direction: '前侧光',
          type: '暖色柔光',
          shadow_intensity: '中等',
          shadow_blur: '中等'
        },
        texture: {
          surface: '质感丰富',
          grain: '细腻',
          reflection: '金属元素高反光'
        },
        background_style: {
          gradient_direction: '中心向外',
          blur_level: '背景元素轻微虚化',
          floating_effects: true
        },
        vibe: '喜庆、团圆、传统、温暖',
        style_prompt: 'Chinese New Year festive style, red and gold traditional colors, lanterns and clouds, warm celebration atmosphere, Spring Festival shopping'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '新年送好礼，毛孩子也过年',
          points: [
            { point: '新年特惠', category: '价格' },
            { point: '精美礼盒', category: '品质' },
            { point: '年货必备', category: '场景' }
          ],
          target_audience: '春节期间购买年货的消费者',
          emotional_appeal: '新的一年，给毛孩子最好的祝福'
        }
      }
    }
  }
];

// 根据分类获取模板
export function getTemplatesByCategory(categoryId: string): PetStyleTemplate[] {
  return PET_STYLE_TEMPLATES.filter(t => t.category === categoryId);
}

// 根据ID获取模板
export function getTemplateById(id: string): PetStyleTemplate | undefined {
  return PET_STYLE_TEMPLATES.find(t => t.id === id);
}

// 获取所有模板（按分类分组）
export function getTemplatesGroupedByCategory(): Record<string, PetStyleTemplate[]> {
  const grouped: Record<string, PetStyleTemplate[]> = {};
  for (const category of TEMPLATE_CATEGORIES) {
    grouped[category.id] = getTemplatesByCategory(category.id);
  }
  return grouped;
}
