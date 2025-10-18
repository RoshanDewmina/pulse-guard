import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generatePageMetadata({
    title: "Monitor Analytics",
    description: "View monitor analytics and performance metrics.",
    path: `/app/monitors/${(await params).id}/analytics`,
    noIndex: true,
  })
}

export default function MonitorAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

