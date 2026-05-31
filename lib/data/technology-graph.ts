/**
 * 文件作用：
 * 封装 Technology Graph 1.0 的数据读取逻辑。
 *
 * 当前版本只负责结构化技术节点和技术关系读取，
 * 暂不做图谱可视化，不接入外部图数据库。
 */

import { TechnologyRelationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getDependencyRelationTypes() {
  return [TechnologyRelationType.DEPENDENCY, TechnologyRelationType.PART_OF];
}

function getRelatedRelationTypes() {
  return [TechnologyRelationType.RELATED, TechnologyRelationType.ENABLES];
}

export async function getRadarTechnologyNetworkData(radarId: string) {
  const radar = await prisma.radar.findUnique({
    where: {
      id: radarId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!radar) {
    return null;
  }

  const relatedTypes = getRelatedRelationTypes();
  const dependencyTypes = getDependencyRelationTypes();

  const [
    nodes,
    relatedRelations,
    alternativeRelations,
    dependencyRelations,
    nodeCount,
    relationCount,
    relatedCount,
    alternativeCount,
    dependencyCount,
  ] = await Promise.all([
    prisma.technologyNode.findMany({
      where: {
        radarId,
      },
      orderBy: [
        {
          updatedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 20,
      include: {
        _count: {
          select: {
            incomingRelations: true,
            outgoingRelations: true,
          },
        },
      },
    }),

    prisma.technologyRelation.findMany({
      where: {
        radarId,
        relationType: {
          in: relatedTypes,
        },
      },
      orderBy: [
        {
          strength: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 10,
      include: {
        sourceNode: true,
        targetNode: true,
      },
    }),

    prisma.technologyRelation.findMany({
      where: {
        radarId,
        relationType: TechnologyRelationType.ALTERNATIVE,
      },
      orderBy: [
        {
          strength: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 10,
      include: {
        sourceNode: true,
        targetNode: true,
      },
    }),

    prisma.technologyRelation.findMany({
      where: {
        radarId,
        relationType: {
          in: dependencyTypes,
        },
      },
      orderBy: [
        {
          strength: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 10,
      include: {
        sourceNode: true,
        targetNode: true,
      },
    }),

    prisma.technologyNode.count({
      where: {
        radarId,
      },
    }),

    prisma.technologyRelation.count({
      where: {
        radarId,
      },
    }),

    prisma.technologyRelation.count({
      where: {
        radarId,
        relationType: {
          in: relatedTypes,
        },
      },
    }),

    prisma.technologyRelation.count({
      where: {
        radarId,
        relationType: TechnologyRelationType.ALTERNATIVE,
      },
    }),

    prisma.technologyRelation.count({
      where: {
        radarId,
        relationType: {
          in: dependencyTypes,
        },
      },
    }),
  ]);

  return {
    radar,
    nodes,
    relatedRelations,
    alternativeRelations,
    dependencyRelations,
    stats: {
      nodeCount,
      relationCount,
      relatedCount,
      alternativeCount,
      dependencyCount,
    },
  };
}

export async function getTopConnectedTechnologies(limit = 6) {
  const nodes = await prisma.technologyNode.findMany({
    take: 50,
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      radar: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          incomingRelations: true,
          outgoingRelations: true,
        },
      },
    },
  });

  return nodes
    .map((node) => {
      const incomingCount = node._count.incomingRelations;
      const outgoingCount = node._count.outgoingRelations;
      const connectedCount = incomingCount + outgoingCount;

      return {
        id: node.id,
        name: node.name,
        description: node.description,
        category: node.category,
        radar: node.radar,
        incomingCount,
        outgoingCount,
        connectedCount,
      };
    })
    .sort((a, b) => {
      if (b.connectedCount !== a.connectedCount) {
        return b.connectedCount - a.connectedCount;
      }

      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}