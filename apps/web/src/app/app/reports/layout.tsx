import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "SLA Reports",
  description: "Generate and view SLA reports.",
  path: '/app/reports',
  noIndex: true,
})

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

