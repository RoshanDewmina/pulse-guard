import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generatePageMetadata({
    title: "Report Details",
    description: "View report details and metrics.",
    path: `/app/reports/${(await params).id}`,
    noIndex: true,
  })
}

export default function ReportDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

