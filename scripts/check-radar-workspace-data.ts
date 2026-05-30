/**
 * 文件作用：
 * 从数据库读取一个真实 Radar，并输出 Workspace 首页所需的核心数据摘要，用于终端验证。
 */

import { prisma } from "../lib/prisma";
import { getRadarWorkspaceData } from "../lib/data/radar-workspace";

async function main() {
  const radar = await prisma.radar.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  if (!radar) {
    console.log("数据库中没有 Radar，跳过检查。");
    return;
  }

  const workspaceData = await getRadarWorkspaceData(radar.id);

  if (!workspaceData) {
    console.log(`未找到 Radar: ${radar.id}`);
    return;
  }

  console.log(`Radar 名称: ${workspaceData.radar.name}`);
  console.log("统计数据:", workspaceData.stats);
  console.log(
    "最近情报标题:",
    workspaceData.recentIntelligence.map((item) => item.title),
  );
  console.log(
    "最近推荐动作:",
    workspaceData.recentRecommendations.map((item) => item.title),
  );
  console.log(
    "最近 PoC 标题:",
    workspaceData.recentPocs.map((item) => item.title),
  );
  console.log(
    "最近日报标题或日期:",
    workspaceData.recentDailyReports.map((item) => item.title || item.reportDate.toISOString()),
  );
}

main()
  .catch((error) => {
    console.error("Radar Workspace 数据检查失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
