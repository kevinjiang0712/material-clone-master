# Changelog

## [0.9.1] - 2024-12-08

### Added

- **提示词调试功能**:
  - 结果页"合成生成提示词"部分新增 AI 输入数据展示
  - 展示调用模型时的完整输入内容，便于调试提示词
  - 支持查看：完整 AI Prompt、版式分析、风格分析、文案分析、产品分析、商品信息、竞品信息
  - 模板模式额外展示：模板风格预设、AI 场景推断 Prompt 及结果
  - 平铺展示所有输入数据，一目了然

### Database

- `Task` 表新增字段：
  - `promptInputData`: 存储 AI 模型输入数据（JSON 格式，用于调试）

---

## [0.9.0] - 2024-12-07

### Added

- **智能使用场景生成**:
  - AI 自动分析商品类型，智能推断最合适的场景类型
  - 支持 4 种场景模式：产品展示、人物使用、宠物互动、环境展示
  - 用户可手动指定使用场景描述，或留空由 AI 智能推断
  - 针对不同场景类型优化提示词模板

- **全新 UI 配色系统**:
  - 重新设计简洁现代的配色方案
  - 浅灰背景 + 纯白卡片 + 蓝绿双色图标
  - 统一的 CSS 变量系统，易于主题定制
  - 优化按钮、输入框等组件视觉效果

### Changed

- 首页入口卡片视觉优化，悬停效果增强
- 向导容器样式更新，使用更柔和的阴影和边框
- 表单组件重构：新增 `FormInput` 和 `FormSelect` 组件
- 修复 Next.js Image 组件 `fill` 属性的父元素定位问题

### Fixed

- 修复 Step3Info 组件导入错误（Input/Select 命名导出问题）
- 修复 MaterialLibrary 图片容器缺少 `relative` 定位的警告
- 修复 CSS 变量冲突导致按钮不可见的问题

---

## [0.8.0] - 2024-12-05

### Added

- **批量生图功能**:
  - 支持从素材库多选素材（最多 10 张）进行批量生成
  - 新增 `BatchTask` 数据表管理批量任务
  - 新增批量处理服务 `batchProcessor.ts`，支持并发控制（最多 3 个子任务并行）
  - 新增批量任务 API 端点：
    - `POST /api/batch/create` - 创建批量任务
    - `GET /api/batch/[batchId]/status` - 查询批量任务状态
    - `GET /api/batch/[batchId]/result` - 获取批量任务结果
    - `POST /api/batch/[batchId]/retry` - 重试失败的子任务
  - 新增批量结果页面 `/batch/[batchId]`，展示总进度和子任务详情
  - 共享竞品分析：批量任务中所有子任务共享同一份竞品分析结果，避免重复 API 调用

- **素材库多选模式**:
  - `MaterialLibrary` 组件新增多选支持
  - 显示选中序号和已选数量
  - 批量确认选择功能

- **向导组件增强**:
  - `Step1Upload` 支持展示多个已选素材
  - `Step3Info` 批量模式 UI 提示（显示批量模式标记和数量）
  - 首页状态管理支持批量任务提交

### Changed

- 首页向导流程优化，支持单任务和批量任务两种模式
- `taskProcessor.ts` 支持注入预加载的竞品分析结果
- 任务创建流程根据素材数量自动选择单任务或批量任务模式

### Database

- 新增 `BatchTask` 表：
  - `id`, `status`, `totalCount`, `completedCount`, `failedCount`
  - `generationMode`, `competitorImagePath`, `styleTemplateId`
  - `competitorAnalysis` - 共享的竞品分析结果
  - `productInfo`, `selectedImageModels`, `jimenResolution`
- `Task` 表新增字段：
  - `batchTaskId` - 关联批量任务
  - `batchIndex` - 批量任务中的序号

---

## [0.7.0] - 2024-12-02

### Added

- **评分系统**:
  - 新增任务整体评分功能（1-5 星）
  - 新增单张图片评分功能，支持多维度评价
  - 评分维度：图像质量、风格匹配度、商品还原度、创意性
  - 支持文字评论反馈
  - 新增 `TaskRating`、`ImageRating` 数据表
  - 新增 `StarRating`、`RatingPanel`、`TaskRatingForm`、`ImageRatingGrid` 组件
  - 新增 `/api/ratings/task`、`/api/ratings/image` API 端点

- **素材库功能**:
  - 新增素材库页面 `/materials`，集中管理上传的图片素材
  - 新增 `Material` 数据表存储素材元数据
  - 新增 `MaterialLibrary` 组件展示素材库
  - 新增 `/api/materials` API 端点管理素材
  - 支持素材类型分类（产品图/竞品图）

- **历史记录页面**:
  - 新增独立历史记录页面 `/history`
  - 优化历史任务展示和筛选

- **即梦图生图增强**:
  - 新增画笔蒙版参考（brush_mask）功能
  - 新增边缘参考（canny）功能
  - 新增深度参考（depth）功能
  - 新增风格参考（style）功能
  - 支持多重参考图叠加使用
  - 结果页展示参考类型信息

### Changed

- 首页布局优化，改进向导式交互体验
- `TaskHistoryCard` 组件支持更多状态展示
- `ImageComparison` 组件增强对比功能
- 风格模板库精简优化
- 图像生成器架构重构，支持多种参考模式

### Database

- 新增 `Material` 表存储素材信息
- 新增 `TaskRating` 表存储任务评分
- 新增 `ImageRating` 表存储图片评分

---

## [0.6.0] - 2024-11-30

### Added

- **即梦分辨率选择**:
  - 选择即梦模型时支持选择输出分辨率（1K/2K/4K）
  - 新增 `JIMEN_RESOLUTION_OPTIONS` 配置（1024/2048/4096）
  - 数据库新增 `jimenResolution` 字段存储分辨率选择
  - 默认使用 2K 分辨率（2048×2048）

- **风格模板模式**:
  - 新增生成模式选择：竞品参考 / 风格模板
  - 新增 `TemplateGallery` 组件展示预设风格模板
  - 新增 `petStyleTemplates.ts` 定义宠物商品风格模板库
  - 数据库新增 `generationMode`、`styleTemplateId` 字段

- **AI 动态 Prompt 合成**:
  - 第三步（提示词合成）改用 AI 大模型动态生成
  - 新增 `synthesizePromptWithAI()` 函数替代静态字符串拼接
  - AI 根据分析结果智能决定是否添加宠物元素及详细描述
  - 提示词输出改为中文

- **SafeImage 组件**:
  - 新增 `SafeImage` 组件处理图片加载失败场景
  - 图片不存在时显示优雅的占位符而非报错
  - 解决数据库引用不存在图片文件导致的 400 错误

- **向导式界面**:
  - 首页重构为 3 步向导流程
  - 新增 `StepIndicator` 步骤指示器组件
  - 新增 `Step1Upload`、`Step2StyleSource`、`Step3Info` 向导组件
  - 支持步骤间导航和信息预览

### Changed

- Next.js Image 组件优化：
  - 所有 `fill` 属性的 Image 添加 `sizes` 属性
  - 结果图片添加 `priority` 属性优化 LCP
- `ModelSelector` 组件增强：选择即梦时显示分辨率选项
- `imageGenerator.ts` 支持传递 `jimenResolution` 参数
- `jimenImageGenerator.ts` 支持动态分辨率配置

### Database

- `Task` 表新增字段：
  - `jimenResolution`: 即梦输出分辨率选择
  - `generationMode`: 生成模式（competitor/template）
  - `styleTemplateId`: 风格模板 ID

---

## [0.5.0] - 2024-11-30

### Added

- **输入图片分辨率优化**:
  - 上传图片时保留原图尺寸，不再强制缩放到 1024×1024
  - 新增 `getImageBase64ForModel()` 函数，为每个模型动态生成最优分辨率输入
  - 新增 `MODEL_INPUT_RESOLUTION` 配置，定义各模型最佳输入分辨率
  - Flux 2 Pro 自动对齐到 16 像素倍数，符合 API 要求

- **Gemini 高分辨率模式**:
  - Gemini 模型请求自动添加 `media_resolution: 'HIGH'` 参数
  - 新增 `GEMINI_MODELS` 配置列表

- **OCR 辅助文案分析**:
  - 改进竞品分析流程：先执行百度 OCR，再将结果传给大模型
  - OCR 识别的文字注入到分析提示词，提升文案卖点提取准确性
  - 解决大模型自行识别中文文字不准确的问题

### Changed

- `analyzeCompetitor()` 函数新增 `ocrTexts` 参数，支持 OCR 结果辅助分析
- `COMPETITOR_ANALYSIS_PROMPT` 提示词优化，要求大模型使用 OCR 结果进行文案分析
- Step 1 执行顺序从并行改为串行（先 OCR → 再大模型分析）
- 输入图片分辨率从固定 1MP 提升到最高 4MP，显著提升生成图片细节

### Performance

- 输入分辨率提升约 4 倍（1024² → 2048²）
- Flux 成本相应增加（按像素计费）
- Step 1 耗时略增（+1-2秒，因 OCR 改为串行）

---

## [0.4.0] - 2024-11-29

### Added

- **多模型图像生成**:
  - 支持同时选择多个图像生成模型并行调用
  - 新增即梦 API 支持 (Doubao Seedream 系列模型)
  - 新增 `ModelSelector` 组件，可在首页选择最多 3 个模型
  - 新增 `resultImages` 字段存储多模型生成结果 (JSON 数组)
  - 新增 `AVAILABLE_IMAGE_MODELS` 配置支持的模型列表

- **竞品/商品信息表单**:
  - 新增 `CompetitorInfoForm` 组件：竞品名称、竞品类目
  - 新增 `ProductInfoForm` 组件：商品名称、类目、核心卖点、目标人群、品牌调性
  - 新增 `TagSelect` 组件用于品牌调性多选
  - 表单信息会融入 AI 分析提示词，增强生成效果

- **重新生成功能**:
  - 新增 `POST /api/task/[taskId]/regenerate` 接口
  - 结果页可追加生成新图片（最多 10 张/任务）
  - 新增 `RegenerateControls` 组件选择模型并重新生成

- **步骤耗时记录**:
  - 新增 `StepTiming` 数据表记录每步骤耗时
  - 结果页每个步骤卡片显示耗时信息
  - 图片生成结果显示单张图片耗时

- **图片历史分组**:
  - 新增 `ImageHistorySection` 组件按生成时间分组展示
  - 支持展开/折叠查看历史生成结果
  - 显示每组统计（成功/失败数、成本、耗时）

- **成本汇总增强**:
  - 支持多币种成本汇总（USD + CNY）
  - 新增 `CostSummary` 类型和 `USD_TO_CNY_RATE` 汇率常量
  - 结果页显示分币种成本明细和参考人民币总计

### Changed

- 首页 UI 重构：两栏布局整合图片上传和信息表单
- 结果页图片对比组件支持多图展示和点击放大
- `StepAnalysisCard` 组件重构，支持显示耗时信息
- 任务创建接口支持 `competitorInfo`、`productInfo`、`selectedImageModels` 参数
- 任务状态接口返回实时分析数据，支持处理中步骤展示

### Database

- `Task` 表新增字段：
  - `resultImages`: 多模型生成结果 JSON
  - `selectedImageModels`: 选择的模型列表
  - `competitorName`、`competitorCategory`: 竞品信息
  - `productName`、`productCategory`、`sellingPoints`、`targetAudience`、`brandTone`: 商品信息
- 新增 `StepTiming` 表记录步骤耗时

---

## [0.3.0] - 2024-11-27

### Added

- **API 调用成本记录功能**:
  - 新增 `ApiCall` 数据表记录每次大模型调用成本
  - 通过 OpenRouter `/api/v1/generation` 端点获取精确成本数据
  - 新增 `costTracker.ts` 服务模块处理成本查询和记录
  - Task 表新增 `totalCost` 字段汇总任务总成本

- **成本展示 UI**:
  - 结果页每个步骤显示调用成本（绿色标签 `$0.001234`）
  - 结果页底部显示总成本汇总卡片
  - 失败任务也会显示已产生的成本（橙色卡片）

### Changed

- 首页最近生成模块从 3 张卡片改为 6 张卡片（2列×3行布局）
- `analyzeCompetitor` 和 `analyzeContent` 函数现在返回 `{ data, generationId }`
- `generateImage` 函数现在返回 `generationId` 字段
- `/api/task/[taskId]/result` 接口新增 `apiCalls` 和 `totalCost` 字段

---

## [0.2.0] - 2024-11-26

### Added

- **结果页步骤展示**: 生成结果页现在展示每个 AI 分析步骤的详细输出
  - 版式分析: 主体构图、背景结构、图层顺序
  - 风格分析: 色彩风格、光影效果、整体氛围
  - 内容分析: 产品形状、材质、朝向、色彩
  - 生成提示词: 可展开查看完整 prompt

- **失败任务分析展示**: 失败任务也能查看已完成步骤的分析结果

- **断点重试功能**: 失败任务支持从失败步骤继续执行
  - 新增 `failedStep` 数据库字段记录失败步骤
  - 新增 `POST /api/task/[taskId]/retry` 重试接口
  - 任务处理器支持 `startFromStep` 参数
  - 前端添加「从失败处重试」按钮

- **新增组件**:
  - `StepAnalysisCard`: 可折叠的步骤分析卡片组件

### Changed

- **API 返回数据增强**:
  - `/api/task/[taskId]/result` 现在返回完整的分析数据 (layoutAnalysis, styleAnalysis, contentAnalysis)
  - `/api/task/[taskId]/status` 现在返回 failedStep 字段
  - 允许 failed 状态的任务也能获取分析结果

- **任务处理器重构**:
  - `processTask()` 函数支持 `startFromStep` 参数
  - 失败时记录具体失败步骤号
  - 重试时自动加载之前步骤的分析结果

### Fixed

- 修复图像生成 API 调用问题 (添加 modalities 参数)
- 修复未使用变量导致的 ESLint 错误

---

## [0.1.0] - 2024-11-25

### Added

- 初始 MVP 版本
- 图片上传功能 (竞品图 + 实拍图)
- 5 步 AI 分析流程
- 任务状态轮询和进度展示
- 结果图片展示和下载
- 任务历史列表
