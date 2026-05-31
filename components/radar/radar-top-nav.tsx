// 顶部导航组件：统一 AI 技术雷达产品标识与基础导航入口。
import Link from "next/link";

export type RadarNavKey =
  | "dashboard"
  | "workspace"
  | "radars"
  | "reports"
  | "knowledge";

type RadarTopNavProps = {
  activeKey?: RadarNavKey;
};

const navItems: Array<{ key: RadarNavKey; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "radars", label: "Radars", href: "/dashboard" },
  { key: "reports", label: "Reports", href: "/dashboard" },
  { key: "knowledge", label: "Knowledge", href: "/knowledge" },
];

export function RadarTopNav({ activeKey }: RadarTopNavProps) {
  return (
    <header className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] px-5 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.32)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-[220px]">
          <p className="text-lg font-semibold tracking-tight text-white">AI 技术情报雷达</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
            Technology Intelligence Workspace
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const isActive =
              activeKey === item.key || (activeKey === "workspace" && item.key === "radars");

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
                    : "border-white/10 bg-black/10 text-slate-200 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
