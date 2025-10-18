import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generatePageMetadata({
    title: "Postmortem Details",
    description: "View postmortem details and analysis.",
    path: `/app/postmortems/${(await params).id}`,
    noIndex: true,
  })
}

export default function PostmortemDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

