"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen px-6 py-10 text-white md:px-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-300">Dashboard Error</p>
          <h1 className="text-3xl font-semibold">数据暂时无法加载</h1>
          <p className="text-sm text-slate-300">
            Prisma 查询失败或数据库暂时不可用。可先检查 DATABASE_URL、迁移和 seed 状态。
          </p>
        </div>
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
          {error.message || "Unknown error"}
        </div>
        <button
          className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20"
          onClick={reset}
          type="button"
        >
          重新加载
        </button>
      </div>
    </main>
  );
}
