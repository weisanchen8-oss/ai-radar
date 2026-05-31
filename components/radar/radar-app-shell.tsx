// 页面 Shell 组件：统一 AI 技术雷达页面背景、内容宽度与顶部导航。
import type { ReactNode } from "react";
import { RadarTopNav, type RadarNavKey } from "@/components/radar/radar-top-nav";

type RadarAppShellProps = {
  activeKey?: RadarNavKey;
  children: React.ReactNode;
};

export function RadarAppShell({ activeKey, children }: RadarAppShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] px-6 py-8 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <RadarTopNav activeKey={activeKey} />
        {children}
      </div>
    </main>
  );
}
