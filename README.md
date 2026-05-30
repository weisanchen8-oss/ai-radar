# AI Radar｜AI 技术分析与验证平台

AI Radar 是一个面向 AI 产品经理、技术负责人与 AI Agent 工程师的个人版 AI 技术情报雷达系统。

它不是普通的 AI 新闻聚合器，也不是简单的技术收藏夹，而是一个围绕具体业务场景持续跟踪 AI 技术动态，并输出技术分析、推荐动作、PoC 验证记录和日报的技术决策支持系统。

项目核心问题是：

> 在海量 AI 技术动态中，哪些技术真正值得投入资源进行验证和落地？

---

## 项目定位

AI Radar 的第一版定位是个人使用的 AI 技术情报工作台，主要用于跟踪正在开发的 AI 项目相关技术，例如：

* AI Sales Agent
* AI 客服系统
* Coding Agent
* 智能衣橱 Agent
* 企业知识库与 RAG 应用
* AI 产品原型与工程化验证

系统以 Radar 为核心对象。每个 Radar 代表一个具体业务场景观察器，而不是传统意义上的技术分类或技术象限图。

一个 Radar 会持续沉淀：

* 技术情报
* 技术分析
* 推荐动作
* PoC 验证
* 日报总结
* 技术关系与经验记录

最终形成从技术发现到技术验证，再到技术沉淀的闭环。

---

## 核心价值

### 1. 技术分析｜Technology Analysis

传统技术资讯产品主要回答：

> 最近发生了什么？

AI Radar 重点回答：

> 这项技术为什么值得关注？
> 它是否适合当前业务？
> 它是否优于现有方案？
> 是否值得投入时间做 PoC？

系统通过结构化分析，将技术动态转化为可理解、可比较、可决策的技术判断。

---

### 2. 快速验证｜Rapid Validation

AI Radar 不止于推荐技术，而是推动技术验证。

当某项技术被判断为值得尝试时，系统会进一步沉淀：

* PoC 目标
* 验证假设
* 成功标准
* 实施计划
* 风险记录
* 验证结论
* 后续推荐动作

形成：

```text
Recommendation
→ PoC
→ Validation
→ Conclusion
```

这使项目从“看技术”进一步走向“验证技术”。

---

### 3. 技术图谱｜Technology Graph

AI Radar 的长期目标是沉淀个人或团队内部的技术知识网络。

系统希望逐步建立以下关系：

```text
技术
→ 能力
→ 工具
→ 框架
→ 应用场景
→ 验证记录
```

第一版采用轻量关联方式实现，后续可扩展为正式的 Technology Graph。

---

## 产品工作流

AI Radar 的核心工作流如下：

```text
技术发现
→ AI 分析
→ 推荐动作
→ PoC 验证
→ 日报总结
→ 技术沉淀
```

系统采用双层结构：

```text
Industry Highlights
+
Radar Intelligence
```

### Industry Highlights

用于展示行业热点，例如：

* 重要模型发布
* 重要论文
* 热门开源项目
* 关键工具更新
* 重大技术趋势

这一层主要用于快速发现信息，不做过重分析。

### Radar Intelligence

这是系统核心层。

每个 Radar 围绕具体业务场景持续跟踪技术动态，并生成：

* 技术情报列表
* 技术分析报告
* 推荐动作
* PoC 记录
* 日报
* 活动日志

---

## TERA 技术评估模型

AI Radar 使用 TERA 技术评估思路，对技术进行结构化判断。

TERA 包括：

* **T｜Technical Value：技术价值**
* **E｜Engineering Readiness：工程成熟度**
* **R｜Relevance to Business：业务相关性**
* **A｜Adoption Risk：采用风险**

同时结合 Source Trust 来源可信度，形成：

```text
Source Trust
→ TERA Score
→ Recommendation Action
```

系统最终不只输出分数，而是输出可执行的推荐动作。

---

## 推荐动作体系

系统支持以下推荐动作：

* `WATCH`：持续观察
* `VALIDATE_BY_POC`：建议进行 PoC 验证
* `ADOPT_INCREMENTALLY`：建议渐进式采用
* `REJECT_FOR_NOW`：当前暂不推荐
* `NEED_MORE_INFO`：需要补充信息后再判断

这样可以让技术判断直接服务于产品与工程决策。

---

## 当前已实现模块

当前项目已完成或正在完善的核心模块包括：

* Dashboard 首页
* Radar Workspace 工作台
* 技术情报列表
* AI 分析模块
* 推荐动作模块
* PoC 工作流模块
* 日报模块
* 活动记录模块
* Prisma 数据模型
* Supabase PostgreSQL 数据库接入
* Seed 示例数据

---

## 技术栈

### 前端与全栈框架

* Next.js App Router
* React
* TypeScript
* Tailwind CSS

### 后端与数据层

* Prisma ORM
* PostgreSQL
* Supabase

### 部署

* Vercel
* Supabase

### AI 能力预留

* OpenAI Compatible API
* 后续可切换 OpenAI、DeepSeek、Qwen、OpenRouter 等模型服务

---

## 数据模型概览

当前 MVP 核心数据模型包括：

* `User`
* `Radar`
* `IntelligenceItem`
* `TechnologyAnalysis`
* `AnalysisSourceRef`
* `Recommendation`
* `PoC`
* `DailyReport`
* `ActivityLog`

这些模型共同支撑技术情报、技术分析、推荐动作、PoC 验证与日报沉淀。

---

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
DATABASE_URL="your_supabase_database_url"
SHADOW_DATABASE_URL="your_supabase_shadow_database_url"
```

如果后续接入 AI 能力，可继续增加：

```bash
OPENAI_API_KEY="your_openai_compatible_api_key"
OPENAI_BASE_URL="your_openai_compatible_base_url"
```

### 3. 生成 Prisma Client

```bash
npx prisma generate
```

### 4. 执行数据库迁移

```bash
npx prisma migrate dev --name init_ai_radar_schema
```

### 5. 写入示例数据

```bash
npm run prisma:seed
```

### 6. 启动开发环境

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

---

## Vercel 部署说明

### 1. 导入 GitHub 仓库

在 Vercel 中选择：

```text
Add New Project
→ Import Git Repository
→ 选择 ai-radar 仓库
```

### 2. 配置环境变量

在 Vercel 项目设置中添加：

```bash
DATABASE_URL
SHADOW_DATABASE_URL
```

如后续接入 AI 分析能力，再添加：

```bash
OPENAI_API_KEY
OPENAI_BASE_URL
```

### 3. 构建命令

默认使用：

```bash
npm run build
```

### 4. 部署后检查

部署完成后建议检查：

* 首页是否正常跳转到 Dashboard
* Radar Workspace 是否能读取数据
* Recommendation 是否正常展示
* PoC 页面是否正常展示
* Daily Report 页面是否正常展示
* Supabase 数据是否被正确读取

---

## 项目状态

当前项目处于 MVP 完善阶段。

第一阶段目标：

* 完成核心页面闭环
* 完成 Vercel 部署
* 完成 Supabase 数据库连接
* 完成 README 文档整理
* 完成项目基础展示材料

后续扩展方向：

* 接入真实 AI 技术扫描源
* 增强 AI 分析生成能力
* 增加技术关系图谱
* 增加多 Radar 对比
* 增加团队协作与权限系统
