import { notFound } from "next/navigation";
import { RadarAppShell } from "@/components/radar/radar-app-shell";
import { RadarWorkspaceView } from "@/components/radar/radar-workspace-view";
import { getRadarWorkspaceData } from "@/lib/data/radar-workspace";

export const dynamic = "force-dynamic";

export default async function RadarWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ radarId: string }>;
  searchParams?: Promise<{ action?: string }>;
}) {
  const { radarId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const workspaceData = await getRadarWorkspaceData(radarId);

  if (!workspaceData) {
    notFound();
  }

  return (
    <RadarAppShell activeKey="workspace">
      <RadarWorkspaceView
        actionMessage={resolvedSearchParams.action}
        data={workspaceData}
      />
    </RadarAppShell>
  );
}