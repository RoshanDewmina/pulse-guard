import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string; runId: string }> }): Promise<Metadata> {
  const { id, runId } = await params;
  
  return generatePageMetadata({
    title: "Run Details",
    description: "View detailed information about this monitor run.",
    path: `/app/monitors/${id}/runs/${runId}`,
    noIndex: true,
  })
}

export default function MonitorRunDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

