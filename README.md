# 素材克隆大师 (Material Clone Master)

一款基于 AI 的电商产品图生成工具，通过分析竞品图的版式和风格，结合你的产品实拍图，自动生成同款风格的产品图。

## 功能特性

- **双模式生成**:
  - 竞品参考模式：上传竞品图作为风格参考
  - 风格模板模式：选择预设风格模板快速生成
- **智能使用场景**: AI 自动分析商品类型，智能推断最合适的场景（产品展示/人物使用/宠物互动/环境展示）
- **批量生图**: 从素材库多选素材（最多 10 张），批量生成同风格产品图，共享竞品分析结果
- **竞品图分析**: 自动提取竞品图的版式布局、视觉风格、文案卖点
- **OCR 辅助分析**: 百度 OCR 高精度识别 + 大模型理解，精准提取文案信息
- **实拍图识别**: 识别产品形状、材质、朝向等特征
- **AI 动态提示词**: 大模型智能合成提示词，自动判断场景类型和宠物元素
- **多模型图像生成**: 支持多个 AI 图像生成模型并行调用
  - OpenRouter: Gemini 2.5 Flash、Flux 2 Pro、GPT-5 Image 等
  - 即梦 API: Doubao Seedream 4.0（支持 1K/2K/4K 分辨率选择）
- **即梦图生图增强**: 支持多种参考模式
  - 画笔蒙版参考（brush_mask）
  - 边缘参考（canny）、深度参考（depth）、风格参考（style）
  - 支持多重参考图叠加使用
- **智能分辨率优化**: 根据各模型最佳参数动态调整输入分辨率（最高 2048×2048）
- **竞品/商品信息表单**: 可输入竞品名称、商品卖点、品牌调性等增强生成效果
- **向导式界面**: 3 步向导流程，清晰引导用户完成操作
- **素材库**: 集中管理上传的产品图和竞品图素材
- **评分系统**: 对生成结果进行多维度评分（图像质量、风格匹配度、商品还原度、创意性）
- **任务历史**: 查看历史任务和生成结果
- **断点重试 & 重新生成**: 失败任务可从失败步骤继续，成功任务可追加生成
- **成本追踪**: 记录每次 API 调用成本，支持多币种（USD/CNY）汇总

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: SQLite + Prisma ORM
- **样式**: Tailwind CSS
- **AI 服务**: OpenRouter API (支持多种模型)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件:

```env
DATABASE_URL="file:./dev.db"

# OpenRouter API 配置
OPENROUTER_API_KEY="your-api-key"
OPENROUTER_VISION_MODEL="google/gemini-flash-1.5-8b"
OPENROUTER_SITE_URL="https://your-site.com"
OPENROUTER_SITE_NAME="Material Clone Master"

# 即梦 API 配置（可选）
JIMEN_API_KEY="your-jimen-api-key"

# Mock 模式 (设为 true 跳过真实 API 调用)
USE_MOCK_GENERATION="false"
```

### 3. 初始化数据库

```bash
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 工作流程

1. **上传实拍图** - 你的产品照片
2. **选择风格来源** - 上传竞品图 或 选择预设风格模板
3. **完善信息** - 填写商品信息、选择生成模型和分辨率
4. **AI 分析** (4 个步骤):
   - Step 1: 分析竞品图/模板（版式 + 风格 + OCR 文案提取）
   - Step 2: 分析实拍图内容（产品特征识别）
   - Step 3: AI 动态合成提示词（智能判断是否需要宠物元素）
   - Step 4: 多模型并行生成结果图片
5. **查看结果** - 对比多模型生成效果，下载产品图

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── task/          # 任务相关 API
│   │   ├── tasks/         # 任务列表 API
│   │   └── upload/        # 图片上传 API
│   ├── result/[taskId]/   # 结果页面
│   └── page.tsx           # 首页
├── components/            # React 组件
├── services/              # 业务逻辑
│   ├── taskProcessor.ts   # 任务处理器
│   ├── openrouter.ts      # OpenRouter 视觉分析
│   └── imageGenerator.ts  # 图像生成
├── lib/                   # 工具函数
└── types/                 # TypeScript 类型定义
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/task/create` | POST | 创建新任务 |
| `/api/task/[taskId]/status` | GET | 获取任务状态 |
| `/api/task/[taskId]/result` | GET | 获取任务结果 |
| `/api/task/[taskId]/retry` | POST | 重试失败任务 |
| `/api/task/[taskId]/regenerate` | POST | 重新生成图片 |
| `/api/tasks` | GET | 获取任务列表 |
| `/api/upload` | POST | 上传图片 |
| `/api/materials` | GET/POST | 素材库管理 |
| `/api/materials/[id]` | DELETE | 删除素材 |
| `/api/ratings/task` | GET/POST | 任务评分 |
| `/api/ratings/image` | GET/POST | 图片评分 |
| `/api/batch/create` | POST | 创建批量任务 |
| `/api/batch/[batchId]/status` | GET | 获取批量任务状态 |
| `/api/batch/[batchId]/result` | GET | 获取批量任务结果 |
| `/api/batch/[batchId]/retry` | POST | 重试失败的子任务 |

## 许可证

MIT
