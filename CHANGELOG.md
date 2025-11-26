# Changelog

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
