import {
  ActivityActionType,
  ActivityEntityType,
  AnalysisSourceRelationType,
  AnalysisStatus,
  AnalysisType,
  DailyReportStatus,
  IntelligenceLifecycleStatus,
  IntelligenceSourceType,
  PocOutcome,
  PocStatus,
  PrismaClient,
  PriorityLevel,
  RadarStatus,
  RecommendationActionType,
  RecommendationStatus,
  ScanIntensity,
  UserStatus,
  Visibility,
} from '@prisma/client'

const prisma = new PrismaClient()

type SeedIntelligenceItem = {
  title: string
  summary: string
  rawContent: string
  sourceType: IntelligenceSourceType
  sourceUrl: string
  sourceName: string
  sourceAuthor: string
  sourcePublishedAt: Date
  technologyName: string
  vendor: string
  topic: string
  keywords: string[]
  lifecycleStatus: IntelligenceLifecycleStatus
  capturedAt: Date
}

type SeedAnalysis = {
  title: string
  analysisInputSummary: string
  analysisPromptVersion: string
  executiveSummary: string
  opportunity: string
  risk: string
  adoptionSignals: string
  uncertainties: string
  conclusion: string
  scores: {
    sourceTrustScore: number
    technicalValueScore: number
    engineeringReadinessScore: number
    businessRelevanceScore: number
    adoptionRiskScore: number
    strategicValueScore: number
    communityHeatScore: number
  }
}

type SeedRecommendation = {
  title: string
  actionType: RecommendationActionType
  summary: string
  rationale: string
  expectedOutcome: string
  riskNote: string
  priority: PriorityLevel
  decisionMemo: string
}

type SeedPoc = {
  title: string
  objective: string
  hypothesis: string
  successCriteria: string
  status: PocStatus
  outcome: PocOutcome | null
  plan?: string
  findings?: string
  risks?: string
  recommendationBack?: string
  repoUrl?: string
  demoUrl?: string
  artifactUrl?: string
  startDate?: Date
  endDate?: Date
  timeSpentHours: string
}

type SeedReport = {
  reportDate: Date
  title: string
  summary: string
  highlights: string
  decisions: string
  risks: string
  nextActions: string
}

type SeedActivity = {
  entityType: ActivityEntityType
  actionType: ActivityActionType
  message: string
}

type SeedRadarInput = {
  name: string
  slug: string
  description: string
  scanIntensity: ScanIntensity
  businessDomain: string
  focusQuestion: string
  observationScope: string
  targetAudience: string
  summary: string
  decisionContext: string
  lastScannedAt: Date
  nextScanAt: Date
  intelligenceItems: SeedIntelligenceItem[]
  analysis: SeedAnalysis
  recommendation: SeedRecommendation
  poc: SeedPoc
  report: SeedReport
  activities: SeedActivity[]
}

async function main() {
  await prisma.activityLog.deleteMany()
  await prisma.dailyReport.deleteMany()
  await prisma.poC.deleteMany()
  await prisma.recommendation.deleteMany()
  await prisma.analysisSourceRef.deleteMany()
  await prisma.technologyAnalysis.deleteMany()
  await prisma.intelligenceItem.deleteMany()
  await prisma.radar.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      email: 'owner@ai-radar.local',
      name: 'AI Radar Owner',
      status: UserStatus.ACTIVE,
      timezone: 'Asia/Shanghai',
      locale: 'zh-CN',
      metadata: {
        role: 'personal_builder',
        onboardingCompleted: true,
      },
    },
  })

  const radarInputs: SeedRadarInput[] = [
    {
      name: 'AI 技术情报雷达',
      slug: 'ai-tech-intelligence-radar',
      description: '持续跟踪通用 AI 基础设施、模型能力、开发框架和交付模式变化。',
      scanIntensity: ScanIntensity.HIGH,
      businessDomain: 'AI Strategy',
      focusQuestion: '哪些技术变化会在未来 3-6 个月显著影响个人 AI 产品研发效率？',
      observationScope: '模型、Agent 框架、开发工具链、部署能力',
      targetAudience: '个人开发者',
      summary: '用于识别高价值技术信号并转化为可执行实验。',
      decisionContext: '优先选择能够缩短开发周期或提升交付质量的技术方向。',
      lastScannedAt: new Date('2026-05-29T09:00:00+08:00'),
      nextScanAt: new Date('2026-05-30T09:00:00+08:00'),
      intelligenceItems: [
        {
          title: 'OpenAI Responses API 工具调用稳定性提升',
          summary: '多轮工具调用和结构化输出在开发者案例中更稳定，适合复杂 Agent 编排。',
          rawContent:
            '近期开发者实践表明 Responses API 在 tool calling、一致性输出和长链路状态保持方面更适合复杂工作流。',
          sourceType: IntelligenceSourceType.DOCUMENTATION,
          sourceUrl: 'https://platform.openai.com/docs',
          sourceName: 'OpenAI Docs',
          sourceAuthor: 'OpenAI',
          sourcePublishedAt: new Date('2026-05-20T10:00:00+08:00'),
          technologyName: 'OpenAI Responses API',
          vendor: 'OpenAI',
          topic: 'Agent Runtime',
          keywords: ['responses api', 'tool calling', 'agent orchestration'],
          lifecycleStatus: IntelligenceLifecycleStatus.ANALYZED,
          capturedAt: new Date('2026-05-28T21:30:00+08:00'),
        },
        {
          title: 'LangGraph 在长流程 Agent 编排中被更多团队采用',
          summary: '状态图建模比串行链式流程更适合复杂任务恢复与人工介入。',
          rawContent:
            '社区案例显示，LangGraph 在需要中断恢复、节点复用和审计链路的 Agent 系统中比简单链式框架更具可维护性。',
          sourceType: IntelligenceSourceType.ARTICLE,
          sourceUrl: 'https://blog.langchain.dev/langgraph',
          sourceName: 'LangChain Blog',
          sourceAuthor: 'LangChain',
          sourcePublishedAt: new Date('2026-05-18T14:00:00+08:00'),
          technologyName: 'LangGraph',
          vendor: 'LangChain',
          topic: 'Workflow Orchestration',
          keywords: ['langgraph', 'state machine', 'agent workflow'],
          lifecycleStatus: IntelligenceLifecycleStatus.TRACKING,
          capturedAt: new Date('2026-05-28T22:00:00+08:00'),
        },
      ],
      analysis: {
        title: '通用 AI Agent 开发栈收敛分析',
        analysisInputSummary: '结合模型接口稳定性和编排框架趋势，评估个人版 AI 系统的主干技术栈。',
        analysisPromptVersion: 'tera-v1.0',
        executiveSummary:
          '模型层和编排层正在形成相对清晰的组合：稳定的结构化输出接口 + 可审计状态机工作流，是个人项目可持续演进的更优路径。',
        opportunity: '减少自定义工作流代码，提升后续 Agent 产品开发复用率。',
        risk: '生态仍在快速变化，过早绑定单一框架会带来替换成本。',
        adoptionSignals: '文档成熟度提高、社区案例增多、复杂 Agent 场景逐步标准化。',
        uncertainties: '不同框架在生产级观测和回放上的差异还需实测。',
        conclusion: '应优先搭建可替换模型层接口，并以状态机编排作为实验基线。',
        scores: {
          sourceTrustScore: 88,
          technicalValueScore: 90,
          engineeringReadinessScore: 79,
          businessRelevanceScore: 85,
          adoptionRiskScore: 42,
          strategicValueScore: 91,
          communityHeatScore: 87,
        },
      },
      recommendation: {
        title: '建立统一 Agent Runtime 适配层',
        actionType: RecommendationActionType.VALIDATE_BY_POC,
        summary: '先用统一 runtime 适配层隔离模型接口和工作流编排，再决定是否深度绑定具体框架。',
        rationale: '这样可以降低后续替换模型供应商和编排框架的迁移成本。',
        expectedOutcome: '在 2 周内完成一个可插拔 Agent 基线工程。',
        riskNote: '适配层设计过重会抵消初期效率收益。',
        priority: PriorityLevel.HIGH,
        decisionMemo: '优先验证抽象层是否会显著增加复杂度。',
      },
      poc: {
        title: '统一 Agent Runtime 适配层 PoC',
        objective: '验证可插拔模型接口 + 状态机编排在个人项目中的可用性。',
        hypothesis: '通过适配层可以在不重写业务流程的前提下切换模型供应商。',
        successCriteria: '完成 2 个模型后端切换，并保持同一工作流通过率超过 90%。',
        status: PocStatus.IN_PROGRESS,
        outcome: PocOutcome.INCONCLUSIVE,
        plan: '先实现统一消息协议、工具调用协议，再接入 LangGraph 工作流。',
        findings: '接口层已完成初步抽象，但工具输出规范仍需统一。',
        risks: '状态持久化与重放机制可能受框架实现限制。',
        recommendationBack: '若后续维护成本过高，则回退到单框架实现。',
        repoUrl: 'https://github.com/example/agent-runtime-poc',
        startDate: new Date('2026-05-27T10:00:00+08:00'),
        timeSpentHours: '9.5',
      },
      report: {
        reportDate: new Date('2026-05-29T00:00:00+08:00'),
        title: 'AI 技术情报雷达日报 - 2026-05-29',
        summary: '今天完成了对通用 Agent 开发栈的第一轮结构化判断，并启动统一 runtime 适配层验证。',
        highlights: 'Responses API 与状态机编排是当前最值得优先验证的组合。',
        decisions: '接受 PoC 建议，进入适配层验证阶段。',
        risks: '过度抽象可能导致首版工程复杂度上升。',
        nextActions: '补齐工具协议标准样例，并加入第二个模型后端。',
      },
      activities: [
        {
          entityType: ActivityEntityType.RADAR,
          actionType: ActivityActionType.CREATED,
          message: '创建 AI 技术情报雷达并配置高强度扫描。',
        },
        {
          entityType: ActivityEntityType.TECHNOLOGY_ANALYSIS,
          actionType: ActivityActionType.GENERATED,
          message: '生成通用 AI Agent 开发栈的结构化分析结论。',
        },
        {
          entityType: ActivityEntityType.POC,
          actionType: ActivityActionType.CREATED,
          message: '发起统一 Agent Runtime 适配层 PoC。',
        },
      ],
    },
    {
      name: 'AI Sales & Service Agent',
      slug: 'ai-sales-service-agent',
      description: '观察面向销售与客户服务场景的 Agent 产品能力与交付路径。',
      scanIntensity: ScanIntensity.HIGH,
      businessDomain: 'AI Business Application',
      focusQuestion: '哪些能力组合最适合支撑销售获客、线索跟进和售后服务自动化？',
      observationScope: '语音/文本 Agent、CRM 集成、知识库检索、工单闭环',
      targetAudience: '中小企业业务自动化场景',
      summary: '重点关注前台业务转化效率和客服闭环能力。',
      decisionContext: '优先选择能直接缩短响应时间并提升线索转化率的技术能力。',
      lastScannedAt: new Date('2026-05-29T08:30:00+08:00'),
      nextScanAt: new Date('2026-05-30T08:30:00+08:00'),
      intelligenceItems: [
        {
          title: '多渠道客服 Agent 开始强调 CRM 与工单系统双向同步',
          summary: '单纯回答问题已不足够，业务系统回写成为竞争点。',
          rawContent:
            '近期多家 SaaS 厂商都在强化客服 Agent 与 CRM、工单系统的双向同步能力，以确保线索和服务记录闭环。',
          sourceType: IntelligenceSourceType.NEWSLETTER,
          sourceUrl: 'https://www.saasweekly.example/customer-agent-sync',
          sourceName: 'SaaS Weekly',
          sourceAuthor: 'Industry Analyst',
          sourcePublishedAt: new Date('2026-05-24T09:00:00+08:00'),
          technologyName: 'CRM Sync Agent',
          vendor: 'Multi-vendor',
          topic: 'Business Workflow Integration',
          keywords: ['crm integration', 'ticket sync', 'service workflow'],
          lifecycleStatus: IntelligenceLifecycleStatus.ANALYZED,
          capturedAt: new Date('2026-05-28T20:00:00+08:00'),
        },
        {
          title: 'RAG 客服方案更重视知识新鲜度与反馈闭环',
          summary: '仅检索命中率高已不够，知识更新速度与答复纠偏成为关键。',
          rawContent:
            '客服场景的 RAG 产品开始把反馈回流、知识库更新 SLA 和人工纠偏闭环作为核心卖点。',
          sourceType: IntelligenceSourceType.ARTICLE,
          sourceUrl: 'https://www.enterprise-ai.example/rag-service-loop',
          sourceName: 'Enterprise AI Review',
          sourceAuthor: 'Megan Li',
          sourcePublishedAt: new Date('2026-05-23T16:00:00+08:00'),
          technologyName: 'RAG Service Stack',
          vendor: 'Multi-vendor',
          topic: 'Customer Support Knowledge',
          keywords: ['rag', 'knowledge freshness', 'feedback loop'],
          lifecycleStatus: IntelligenceLifecycleStatus.TRACKING,
          capturedAt: new Date('2026-05-28T20:30:00+08:00'),
        },
      ],
      analysis: {
        title: '销售与服务一体化 Agent 能力分析',
        analysisInputSummary: '评估客服与销售 Agent 是否应共享同一知识与执行链路。',
        analysisPromptVersion: 'tera-v1.0',
        executiveSummary:
          '对于中小企业场景，销售与服务 Agent 应共享客户上下文和业务回写能力，但知识策略与操作权限必须分层。',
        opportunity: '形成统一客户视图，减少重复配置和上下文割裂。',
        risk: '服务场景的错误操作可能直接影响客户关系与订单状态。',
        adoptionSignals: 'CRM 回写、客服工单闭环和营销自动化集成正在成为标准需求。',
        uncertainties: '小团队是否能承受高质量知识维护和权限治理的成本仍需验证。',
        conclusion: '建议先以“统一客户上下文 + 分层执行权限”方式推进 MVP。',
        scores: {
          sourceTrustScore: 80,
          technicalValueScore: 84,
          engineeringReadinessScore: 72,
          businessRelevanceScore: 93,
          adoptionRiskScore: 55,
          strategicValueScore: 88,
          communityHeatScore: 76,
        },
      },
      recommendation: {
        title: '优先验证 CRM 回写与客服知识闭环',
        actionType: RecommendationActionType.VALIDATE_BY_POC,
        summary: '先不追求全渠道自动化，优先验证 CRM 更新和客服纠偏闭环是否跑通。',
        rationale: '这是销售和服务场景里最接近业务价值兑现的能力。',
        expectedOutcome: '形成一个可记录客户意图、生成建议并回写 CRM 的闭环 Agent。',
        riskNote: '若业务对象模型设计不稳，后续扩展营销链路会返工。',
        priority: PriorityLevel.CRITICAL,
        decisionMemo: '先把业务闭环做窄，再扩功能宽度。',
      },
      poc: {
        title: 'CRM 回写闭环 Agent PoC',
        objective: '验证 Agent 能否根据对话结果自动生成结构化销售/服务记录并安全回写。',
        hypothesis: '在有人审阅兜底的前提下，CRM 回写能显著减少人工录入时间。',
        successCriteria: '完成 10 个样例会话的结构化回写，字段准确率达到 85% 以上。',
        status: PocStatus.PLANNED,
        outcome: null,
        plan: '先定义客户意图、工单状态和 CRM 字段映射，再接入审批流。',
        risks: '字段映射错误可能导致 CRM 数据污染。',
        recommendationBack: '如回写准确率不足，则调整为只生成建议而不自动提交。',
        demoUrl: 'https://demo.example.com/crm-loop',
        startDate: new Date('2026-05-30T09:00:00+08:00'),
        timeSpentHours: '0',
      },
      report: {
        reportDate: new Date('2026-05-29T00:00:00+08:00'),
        title: 'AI Sales & Service Agent 日报 - 2026-05-29',
        summary: '今天完成对销售与服务一体化 Agent 的核心能力判断，确认 CRM 回写是首要验证点。',
        highlights: '统一客户上下文是价值核心，但执行权限必须严格分层。',
        decisions: '启动 CRM 回写闭环 PoC 设计。',
        risks: '若数据回写校验不严，会直接影响业务系统可信度。',
        nextActions: '定义 CRM 字段字典和最小审批流。',
      },
      activities: [
        {
          entityType: ActivityEntityType.RADAR,
          actionType: ActivityActionType.CREATED,
          message: '创建面向销售与客服业务的 Agent 观察器。',
        },
        {
          entityType: ActivityEntityType.RECOMMENDATION,
          actionType: ActivityActionType.CREATED,
          message: '形成“优先验证 CRM 回写闭环”的动作建议。',
        },
        {
          entityType: ActivityEntityType.DAILY_REPORT,
          actionType: ActivityActionType.PUBLISHED,
          message: '发布销售与服务 Agent 每日报告。',
        },
      ],
    },
    {
      name: '智能衣橱 Agent',
      slug: 'smart-wardrobe-agent',
      description: '观察 AI 在穿搭建议、衣物管理和个性化推荐中的落地机会。',
      scanIntensity: ScanIntensity.MEDIUM,
      businessDomain: 'Consumer AI Product',
      focusQuestion: '如何用 Agent 让衣橱管理和每日搭配建议更自然、更可持续使用？',
      observationScope: '多模态识别、用户偏好记忆、天气与场景联动、推荐解释',
      targetAudience: '个人消费者',
      summary: '重点评估多模态输入与长期偏好建模是否足够支撑高频日常使用。',
      decisionContext: '优先验证用户是否愿意持续录入和使用穿搭建议。',
      lastScannedAt: new Date('2026-05-28T19:00:00+08:00'),
      nextScanAt: new Date('2026-05-31T09:00:00+08:00'),
      intelligenceItems: [
        {
          title: '多模态服饰识别在二手时尚和衣橱整理场景中精度提升明显',
          summary: '拍照识别类别、颜色、材质和风格标签的可用性提高。',
          rawContent:
            '图像识别模型在服饰细分类、颜色抽取和风格标签生成上的精度持续提升，降低了用户手工录入成本。',
          sourceType: IntelligenceSourceType.ARTICLE,
          sourceUrl: 'https://www.fashion-ai.example/multimodal-closet',
          sourceName: 'Fashion AI Insight',
          sourceAuthor: 'Yuna Chen',
          sourcePublishedAt: new Date('2026-05-21T11:00:00+08:00'),
          technologyName: 'Multimodal Fashion Recognition',
          vendor: 'Multi-vendor',
          topic: 'Wardrobe Digitization',
          keywords: ['multimodal', 'fashion recognition', 'closet digitization'],
          lifecycleStatus: IntelligenceLifecycleStatus.DISCOVERED,
          capturedAt: new Date('2026-05-27T18:00:00+08:00'),
        },
        {
          title: '天气驱动的穿搭推荐开始强调可解释性与个性化记忆',
          summary: '推荐理由和用户反馈回流决定留存效果。',
          rawContent:
            '不少消费级推荐产品开始加入“为什么推荐这套搭配”的解释，并利用用户反馈逐步修正风格偏好。',
          sourceType: IntelligenceSourceType.SOCIAL,
          sourceUrl: 'https://www.social.example/wardrobe-agent-thread',
          sourceName: 'Product Community Thread',
          sourceAuthor: 'Indie Makers',
          sourcePublishedAt: new Date('2026-05-25T20:00:00+08:00'),
          technologyName: 'Explainable Outfit Recommendation',
          vendor: 'Indie',
          topic: 'Personalization',
          keywords: ['weather', 'preference memory', 'explainability'],
          lifecycleStatus: IntelligenceLifecycleStatus.TRACKING,
          capturedAt: new Date('2026-05-27T18:20:00+08:00'),
        },
      ],
      analysis: {
        title: '智能衣橱 Agent 用户价值分析',
        analysisInputSummary: '评估用户是否愿意为更准确的穿搭建议持续维护数字衣橱。',
        analysisPromptVersion: 'tera-v1.0',
        executiveSummary:
          '智能衣橱 Agent 的关键不在于单次推荐质量，而在于初始建档成本是否足够低，以及推荐结果能否解释并持续学习。',
        opportunity: '若自动识别和偏好记忆效果足够好，可形成高频生活助手入口。',
        risk: '建档成本高或推荐解释不足，会导致用户快速流失。',
        adoptionSignals: '多模态服饰识别和解释型推荐都在成熟，具备试做 MVP 的条件。',
        uncertainties: '日常使用频次和用户耐心仍存在较大不确定性。',
        conclusion: '建议先验证“低录入成本 + 可解释推荐”是否能驱动 7 天连续使用。',
        scores: {
          sourceTrustScore: 72,
          technicalValueScore: 78,
          engineeringReadinessScore: 68,
          businessRelevanceScore: 74,
          adoptionRiskScore: 63,
          strategicValueScore: 79,
          communityHeatScore: 70,
        },
      },
      recommendation: {
        title: '优先验证衣橱建档与推荐解释体验',
        actionType: RecommendationActionType.VALIDATE_BY_POC,
        summary: '先不做复杂社交或电商联动，聚焦拍照建档和可解释搭配建议。',
        rationale: '如果不能解决首次录入和推荐可信度问题，后续功能扩展没有意义。',
        expectedOutcome: '验证用户能否在 30 分钟内完成建档并连续 7 天使用推荐。',
        riskNote: '多模态识别误差会直接影响用户对推荐结果的信任。',
        priority: PriorityLevel.HIGH,
        decisionMemo: '围绕使用留存验证，而不是功能堆叠。',
      },
      poc: {
        title: '衣橱建档与解释型推荐 PoC',
        objective: '验证用户上传衣物照片后，系统是否能快速完成建档并给出可接受的推荐解释。',
        hypothesis: '当建档过程足够轻量且推荐有明确理由时，用户更愿意连续使用。',
        successCriteria: '5 位试用用户中至少 3 位在第 7 天仍保留使用。',
        status: PocStatus.IN_PROGRESS,
        outcome: PocOutcome.PARTIAL,
        plan: '先做基础拍照识别、天气联动和推荐理由展示。',
        findings: '用户对推荐理由较敏感，但对手动修正标签接受度一般。',
        risks: '图像识别偏差会放大推荐误差。',
        recommendationBack: '若留存不足，则缩小目标场景到通勤穿搭。',
        artifactUrl: 'https://docs.example.com/wardrobe-poc-findings',
        startDate: new Date('2026-05-24T14:00:00+08:00'),
        endDate: new Date('2026-05-29T18:00:00+08:00'),
        timeSpentHours: '12.0',
      },
      report: {
        reportDate: new Date('2026-05-29T00:00:00+08:00'),
        title: '智能衣橱 Agent 日报 - 2026-05-29',
        summary: '今天确认了智能衣橱 Agent 的首要验证目标：降低建档成本，并提升推荐解释可信度。',
        highlights: '用户对推荐理由的反馈价值高于单纯推荐结果本身。',
        decisions: '继续保留 PoC，但缩小到通勤穿搭与天气联动场景。',
        risks: '若识别质量不稳定，留存会持续承压。',
        nextActions: '补做标签纠错流程和推荐原因模板。',
      },
      activities: [
        {
          entityType: ActivityEntityType.RADAR,
          actionType: ActivityActionType.CREATED,
          message: '创建智能衣橱 Agent 观察器。',
        },
        {
          entityType: ActivityEntityType.INTELLIGENCE_ITEM,
          actionType: ActivityActionType.CREATED,
          message: '新增多模态服饰识别和解释型推荐相关情报。',
        },
        {
          entityType: ActivityEntityType.POC,
          actionType: ActivityActionType.UPDATED,
          message: '更新衣橱建档与解释型推荐 PoC 的阶段性发现。',
        },
      ],
    },
  ]

  for (const radarInput of radarInputs) {
    const radar = await prisma.radar.create({
      data: {
        ownerId: user.id,
        visibility: Visibility.PRIVATE,
        name: radarInput.name,
        slug: radarInput.slug,
        description: radarInput.description,
        status: RadarStatus.ACTIVE,
        scanIntensity: radarInput.scanIntensity,
        isActive: true,
        businessDomain: radarInput.businessDomain,
        focusQuestion: radarInput.focusQuestion,
        observationScope: radarInput.observationScope,
        targetAudience: radarInput.targetAudience,
        summary: radarInput.summary,
        decisionContext: radarInput.decisionContext,
        lastScannedAt: radarInput.lastScannedAt,
        nextScanAt: radarInput.nextScanAt,
      },
    })

    const intelligenceItems = []
    for (const item of radarInput.intelligenceItems) {
      const intelligenceItem = await prisma.intelligenceItem.create({
        data: {
          ownerId: user.id,
          radarId: radar.id,
          visibility: Visibility.PRIVATE,
          title: item.title,
          summary: item.summary,
          rawContent: item.rawContent,
          sourceType: item.sourceType,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          sourceAuthor: item.sourceAuthor,
          sourcePublishedAt: item.sourcePublishedAt,
          technologyName: item.technologyName,
          vendor: item.vendor,
          topic: item.topic,
          keywords: item.keywords,
          lifecycleStatus: item.lifecycleStatus,
          capturedAt: item.capturedAt,
        },
      })

      intelligenceItems.push(intelligenceItem)
    }

    const analysis = await prisma.technologyAnalysis.create({
      data: {
        ownerId: user.id,
        radarId: radar.id,
        visibility: Visibility.PRIVATE,
        title: radarInput.analysis.title,
        status: AnalysisStatus.APPROVED,
        analysisType: AnalysisType.HYBRID,
        analysisInputSummary: radarInput.analysis.analysisInputSummary,
        analysisPromptVersion: radarInput.analysis.analysisPromptVersion,
        executiveSummary: radarInput.analysis.executiveSummary,
        opportunity: radarInput.analysis.opportunity,
        risk: radarInput.analysis.risk,
        adoptionSignals: radarInput.analysis.adoptionSignals,
        uncertainties: radarInput.analysis.uncertainties,
        conclusion: radarInput.analysis.conclusion,
        sourceTrustScore: radarInput.analysis.scores.sourceTrustScore,
        technicalValueScore: radarInput.analysis.scores.technicalValueScore,
        engineeringReadinessScore: radarInput.analysis.scores.engineeringReadinessScore,
        businessRelevanceScore: radarInput.analysis.scores.businessRelevanceScore,
        adoptionRiskScore: radarInput.analysis.scores.adoptionRiskScore,
        strategicValueScore: radarInput.analysis.scores.strategicValueScore,
        communityHeatScore: radarInput.analysis.scores.communityHeatScore,
      },
    })

    for (const [index, item] of intelligenceItems.entries()) {
      await prisma.analysisSourceRef.create({
        data: {
          analysisId: analysis.id,
          intelligenceItemId: item.id,
          relationType:
            index === 0
              ? AnalysisSourceRelationType.PRIMARY
              : AnalysisSourceRelationType.SUPPORTING,
          weight: index === 0 ? 70 : 30,
          note:
            index === 0
              ? '核心判断来源'
              : '补充趋势与落地背景',
        },
      })
    }

    const recommendation = await prisma.recommendation.create({
      data: {
        ownerId: user.id,
        radarId: radar.id,
        analysisId: analysis.id,
        visibility: Visibility.PRIVATE,
        title: radarInput.recommendation.title,
        actionType: radarInput.recommendation.actionType,
        status: RecommendationStatus.ACCEPTED,
        summary: radarInput.recommendation.summary,
        rationale: radarInput.recommendation.rationale,
        expectedOutcome: radarInput.recommendation.expectedOutcome,
        riskNote: radarInput.recommendation.riskNote,
        priority: radarInput.recommendation.priority,
        decisionMemo: radarInput.recommendation.decisionMemo,
      },
    })

    const poc = await prisma.poC.create({
      data: {
        ownerId: user.id,
        radarId: radar.id,
        recommendationId: recommendation.id,
        visibility: Visibility.PRIVATE,
        title: radarInput.poc.title,
        status: radarInput.poc.status,
        objective: radarInput.poc.objective,
        hypothesis: radarInput.poc.hypothesis,
        successCriteria: radarInput.poc.successCriteria,
        outcome: radarInput.poc.outcome,
        plan: radarInput.poc.plan,
        findings: radarInput.poc.findings,
        risks: radarInput.poc.risks,
        recommendationBack: radarInput.poc.recommendationBack,
        repoUrl: radarInput.poc.repoUrl,
        demoUrl: radarInput.poc.demoUrl,
        artifactUrl: radarInput.poc.artifactUrl,
        startDate: radarInput.poc.startDate,
        endDate: radarInput.poc.endDate,
        timeSpentHours: radarInput.poc.timeSpentHours,
      },
    })

    await prisma.dailyReport.create({
      data: {
        ownerId: user.id,
        radarId: radar.id,
        visibility: Visibility.PRIVATE,
        reportDate: radarInput.report.reportDate,
        title: radarInput.report.title,
        status: DailyReportStatus.PUBLISHED,
        summary: radarInput.report.summary,
        highlights: radarInput.report.highlights,
        decisions: radarInput.report.decisions,
        risks: radarInput.report.risks,
        nextActions: radarInput.report.nextActions,
        newIntelligenceCount: intelligenceItems.length,
        newAnalysisCount: 1,
        newRecommendationCount: 1,
        activePocCount:
          radarInput.poc.status === PocStatus.CANCELLED ||
          radarInput.poc.status === PocStatus.DONE
            ? 0
            : 1,
        publishedAt: new Date('2026-05-29T20:00:00+08:00'),
      },
    })

    for (const activity of radarInput.activities) {
      await prisma.activityLog.create({
        data: {
          ownerId: user.id,
          actorId: user.id,
          radarId: radar.id,
          visibility: Visibility.PRIVATE,
          entityType: activity.entityType,
          entityId:
            activity.entityType === ActivityEntityType.RADAR
              ? radar.id
              : activity.entityType === ActivityEntityType.TECHNOLOGY_ANALYSIS
                ? analysis.id
                : activity.entityType === ActivityEntityType.RECOMMENDATION
                  ? recommendation.id
                  : activity.entityType === ActivityEntityType.POC
                    ? poc.id
                    : activity.entityType === ActivityEntityType.INTELLIGENCE_ITEM
                      ? intelligenceItems[0].id
                      : radar.id,
          actionType: activity.actionType,
          message: activity.message,
        },
      })
    }
  }

  console.log('Seed completed.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
