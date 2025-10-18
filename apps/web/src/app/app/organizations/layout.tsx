import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Organizations",
  description: "Manage your organizations.",
  path: '/app/organizations',
keywords: ['organizations', 'multi tenant', 'org management', 'workspaces'],
  noIndex: true,
})

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

