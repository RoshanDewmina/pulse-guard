import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generatePageMetadata({
    title: "Status Page Settings",
    description: "Manage your status page configuration.",
    path: `/app/status-pages/${(await params).id}`,
    noIndex: true,
  })
}

export default function StatusPageDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

