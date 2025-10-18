import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Synthetic Monitoring",
  description: "Monitor your APIs and websites with synthetic checks.",
  path: '/app/synthetic',
  noIndex: true,
})

export default function SyntheticLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

