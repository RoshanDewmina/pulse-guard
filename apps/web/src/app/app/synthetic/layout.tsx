import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Synthetic Monitoring",
  description: "Monitor your APIs and websites with synthetic checks.",
  path: '/app/synthetic',
keywords: ['synthetic monitoring', 'synthetic tests', 'automated testing', 'synthetic checks'],
  noIndex: true,
})

export default function SyntheticLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

