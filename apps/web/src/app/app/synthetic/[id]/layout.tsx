import { generatePageMetadata } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generatePageMetadata({
    title: "Synthetic Monitor Details",
    description: "View synthetic monitor details and test runs.",
    path: `/app/synthetic/${(await params).id}`,
    noIndex: true,
  })
}

export default function SyntheticMonitorDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

