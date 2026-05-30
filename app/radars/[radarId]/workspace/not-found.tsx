import Link from "next/link";

export default function RadarWorkspaceNotFound() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white shadow-[var(--shadow)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">Not Found</p>
        <h1 className="mt-3 text-3xl font-semibold">Radar 不存在</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          当前链接中的 radarId 没有对应记录，可能是数据已删除，或者 URL 不正确。
        </p>
        <Link
          className="mt-6 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium transition hover:bg-white/15"
          href="/dashboard"
        >
          返回 Dashboard
        </Link>
      </div>
    </main>
  );
}
