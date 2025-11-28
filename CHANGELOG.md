# Changelog

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
