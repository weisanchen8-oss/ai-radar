/**
 * 文件作用：
 * 测试 Technology Graph 1.0 数据读取函数是否正常工作。
 *
 * 使用方式：
 * npx tsx scripts/check-technology-graph-data.ts
 */

import {
  getRadarTechnologyNetworkData,
  getTopConnectedTechnologies,
} from "../lib/data/technology-graph";
import { prisma } from "../lib/prisma";

function printRelation(
  relation: {
    sourceNode: { name: string };
    targetNode: { name: string };
    relationType: string;
    strength: number;
    note: string | null;
  },
  index: number,
) {
  console.log(
    `${index + 1}. ${relation.sourceNode.name} -> ${relation.targetNode.name} | ${relation.relationType} | strength=${relation.strength}`,
  );

  if (relation.note) {
    console.log(`   note: ${relation.note}`);
  }
}

async function main() {
  const radar = await prisma.radar.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!radar) {
    console.log("当前数据库中没有 Radar，无法检查 Technology Graph 数据。");
    return;
  }

  console.log(`正在检查 Radar 的 Technology Graph 数据：${radar.name}\n`);

  const networkData = await getRadarTechnologyNetworkData(radar.id);

  if (!networkData) {
    console.log("没有读取到 Technology Graph 数据。");
    return;
  }

  console.log("统计数据：");
  console.log(networkData.stats);

  console.log("\nRelated Technologies:");
  if (networkData.relatedRelations.length === 0) {
    console.log("- 暂无 related / enables 关系");
  } else {
    networkData.relatedRelations.forEach(printRelation);
  }

  console.log("\nAlternative Technologies:");
  if (networkData.alternativeRelations.length === 0) {
    console.log("- 暂无 alternative 关系");
  } else {
    networkData.alternativeRelations.forEach(printRelation);
  }

  console.log("\nDependencies:");
  if (networkData.dependencyRelations.length === 0) {
    console.log("- 暂无 dependency / part_of 关系");
  } else {
    networkData.dependencyRelations.forEach(printRelation);
  }

  console.log("\nTop Connected Technologies:");
  const topTechnologies = await getTopConnectedTechnologies(6);

  if (topTechnologies.length === 0) {
    console.log("- 暂无技术节点数据");
  } else {
    for (const item of topTechnologies) {
      console.log(
        `- ${item.name} | radar=${item.radar.name} | connected=${item.connectedCount} | in=${item.incomingCount} | out=${item.outgoingCount}`,
      );
    }
  }

  console.log("\nTechnology Graph 数据读取检查完成。");
}

main()
  .catch((error) => {
    console.error("Technology Graph 数据读取检查失败：");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });