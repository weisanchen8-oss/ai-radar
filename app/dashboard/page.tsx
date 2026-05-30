import Link from "next/link";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null) {
  if (!value) {
    return "尚未扫描";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(value);
}

function intensityTone(intensity: string) {
  switch (intensity) {
    case "HIGH":
      return "text-amber-200 border-amber-300/25 bg-amber-300/10";
    case "LOW":
      return "text-sky-200 border-sky-300/25 bg-sky-300/10";
    default:
      return "text-emerald-200 border-emerald-300/25 bg-emerald-300/10";
  }
}

function formatScanIntensity(intensity: string) {
  const map: Record<string, string> = {
    LOW: "低频扫描",
    MEDIUM: "中频扫描",
    HIGH: "高频扫描",
  };

  return map[intensity] ?? intensity;
}

export default async function DashboardPage() {
  const [radarTotal, activeRadarTotal, intelligenceTotal, pocTotal, dailyReportTotal, radars] =
    await prisma.$transaction([
      prisma.radar.count(),
      prisma.radar.count({ where: { isActive: true } }),
      prisma.intelligenceItem.count(),
      prisma.poC.count(),
      prisma.dailyReport.count(),
      prisma.radar.findMany({
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        include: {
          _count: {
            select: {
              intelligenceItems: true,
              recommendations: true,
              pocs: true,
            },
          },
        },
      }),
    ]);

  const stats = [
    {
      label: "Radar 总数",
      value: radarTotal,
      note: "全部观察主题",
      span: "md:col-span-2 lg:col-span-1",
    },
    {
      label: "已启用 Radar",
      value: activeRadarTotal,
      note: "当前参与扫描",
      span: "md:col-span-2 lg:col-span-1",
    },
    {
      label: "技术情报总量",
      value: intelligenceTotal,
      note: "已入库情报",
      span: "md:col-span-2 lg:col-span-1",
    },
    {
      label: "PoC 总数",
      value: pocTotal,
      note: "验证任务沉淀",
      span: "md:col-span-3 lg:col-span-1",
    },
    {
      label: "日报总数",
      value: dailyReportTotal,
      note: "阶段性日报",
      span: "md:col-span-3 lg:col-span-1",
    },
  ];

  return (
    <RadarAppShell activeKey="dashboard">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[var(--background-elevated)] p-8 shadow-[var(--shadow)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
                AI Workspace Dashboard
              </p>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  Radar 总览工作台
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  直接读取 Prisma 当前数据库，展示 Radar 规模、扫描状态与关联资产分布。
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/10 px-5 py-4 text-sm text-emerald-100">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                Snapshot
              </div>
              <div className="mt-2 text-2xl font-semibold">{radarTotal}</div>
              <div className="text-slate-300">active domains under watch</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[var(--background-soft)] p-8 shadow-[var(--shadow)] backdrop-blur-xl">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/80">Data Source</p>
            <h2 className="text-2xl font-semibold text-white">真实数据库视图</h2>
            <p className="text-sm leading-6 text-slate-300">
              页面不使用写死的假数据。所有数字和卡片内容都来自 Prisma 查询结果。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-6 xl:grid-cols-5">
        {stats.map((stat) => (
          <article
            className={`rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl ${stat.span}`}
            key={stat.label}
          >
            <p className="text-sm text-slate-300">{stat.label}</p>
            <div className="mt-4 text-4xl font-semibold tracking-tight text-white">
              {stat.value}
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              {stat.note}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Radar 卡片</h2>
            <p className="mt-1 text-sm text-slate-300">按启用状态和最近更新时间排序</p>
          </div>
        </div>

        {radars.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center shadow-[var(--shadow)] backdrop-blur-xl">
            <h3 className="text-2xl font-medium text-white">暂无 Radar 数据</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
              当前数据库中没有 Radar 记录。请先执行迁移和 seed，再刷新 `/dashboard`。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {radars.map((radar) => (
              <article
                className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[var(--shadow)] backdrop-blur-xl"
                key={radar.id}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-white">{radar.name}</h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] ${
                          radar.isActive
                            ? "border-emerald-300/30 bg-emerald-300/12 text-emerald-100"
                            : "border-rose-300/30 bg-rose-300/12 text-rose-100"
                        }`}
                      >
                        {radar.isActive ? "启用中" : "已暂停"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {radar.businessDomain || "未配置业务领域"}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] ${intensityTone(
                      radar.scanIntensity,
                    )}`}
                  >
                    {formatScanIntensity(radar.scanIntensity)}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      最近扫描
                    </div>
                    <div className="mt-3 text-sm text-white">
                      {formatDateTime(radar.lastScannedAt)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Intelligence
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                      {radar._count.intelligenceItems}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Recommendations
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                      {radar._count.recommendations}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">PoC</div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                      {radar._count.pocs}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <p className="text-sm text-slate-400">ID: {radar.id}</p>
                  <Link
                    className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20"
                    href={`/radars/${radar.id}/workspace`}
                  >
                    进入工作台
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </RadarAppShell>
  );
}
