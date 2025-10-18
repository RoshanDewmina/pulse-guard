import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generatePageMetadata({
    title: "Domain Monitoring",
    description: "View domain monitoring status and DNS records.",
    path: `/app/monitors/${(await params).id}/domain`,
    noIndex: true,
  })
}

export default function MonitorDomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

