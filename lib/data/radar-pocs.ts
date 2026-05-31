import { prisma } from "@/lib/prisma";

export async function getRadarPocListData(radarId: string) {
  const radar = await prisma.radar.findUnique({
    where: { id: radarId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
    },
  });

  if (!radar) {
    return null;
  }

  const [pocs, recommendations] = await Promise.all([
    prisma.poC.findMany({
      where: { radarId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        objective: true,
        hypothesis: true,
        successCriteria: true,
        risks: true,
        outcome: true,
        findings: true,
        recommendationBack: true,
        startDate: true,
        endDate: true,
        timeSpentHours: true,
        createdAt: true,
        updatedAt: true,
        recommendation: {
          select: {
            id: true,
            title: true,
            actionType: true,
            status: true,
            priority: true,
          },
        },
      },
    }),

    prisma.recommendation.findMany({
      where: { radarId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        actionType: true,
        status: true,
        summary: true,
        rationale: true,
        priority: true,
        createdAt: true,
        pocs: {
          select: {
            id: true,
            title: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  return {
    radar,
    pocs,
    recommendations,
  };
}

export async function getRadarPocCreateData(radarId: string) {
  const radar = await prisma.radar.findUnique({
    where: { id: radarId },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!radar) {
    return null;
  }

  const recommendations = await prisma.recommendation.findMany({
    where: { radarId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      actionType: true,
      status: true,
      summary: true,
      rationale: true,
      expectedOutcome: true,
      riskNote: true,
      priority: true,
      createdAt: true,
      analysis: {
        select: {
          id: true,
          title: true,
          executiveSummary: true,
          conclusion: true,
        },
      },
      pocs: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  return {
    radar,
    recommendations,
  };
}

export async function getRadarPocDetailData(radarId: string, pocId: string) {
  const poc = await prisma.poC.findFirst({
    where: {
      id: pocId,
      radarId,
    },
    select: {
      id: true,
      ownerId: true,
      radarId: true,
      title: true,
      status: true,
      objective: true,
      hypothesis: true,
      successCriteria: true,
      outcome: true,
      plan: true,
      findings: true,
      risks: true,
      recommendationBack: true,
      repoUrl: true,
      demoUrl: true,
      artifactUrl: true,
      startDate: true,
      endDate: true,
      timeSpentHours: true,
      createdAt: true,
      updatedAt: true,
      radar: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      recommendation: {
        select: {
          id: true,
          title: true,
          actionType: true,
          status: true,
          summary: true,
          rationale: true,
          expectedOutcome: true,
          riskNote: true,
          priority: true,
          analysis: {
            select: {
              id: true,
              title: true,
              executiveSummary: true,
              conclusion: true,
              opportunity: true,
              risk: true,
            },
          },
        },
      },
    },
  });

  if (!poc) {
    return null;
  }

  return poc;
}