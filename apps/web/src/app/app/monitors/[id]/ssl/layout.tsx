import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generatePageMetadata({
    title: "SSL Monitoring",
    description: "View SSL certificate status and expiration details.",
    path: `/app/monitors/${(await params).id}/ssl`,
    noIndex: true,
  })
}

export default function MonitorSSLLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

