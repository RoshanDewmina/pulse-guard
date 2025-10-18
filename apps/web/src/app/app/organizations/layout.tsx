import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Organizations",
  description: "Manage your organizations.",
  path: '/app/organizations',
  noIndex: true,
})

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

