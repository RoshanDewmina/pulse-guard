import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Post-Mortems",
  description: "Create and manage incident post-mortems.",
  path: '/app/postmortems',
keywords: ['postmortems', 'incident reports', 'root cause analysis', 'post incident'],
  noIndex: true,
})

export default function PostMortemsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

