// 页面 Shell 组件：统一 AI 技术雷达页面背景、内容宽度与顶部导航。
import type { ReactNode } from "react";
import { RadarTopNav, type RadarNavKey } from "@/components/radar/radar-top-nav";

type RadarAppShellProps = {
  activeKey?: RadarNavKey;
  children: ReactNode;
};

export function RadarAppShell({ activeKey, children }: RadarAppShellProps) {
  return (
    <main className="min-h-screen bg-[#EEF0EC] px-4 py-6 text-[#101510] md:px-8 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <RadarTopNav activeKey={activeKey} />
        {children}
      </div>
    </main>
  );
}