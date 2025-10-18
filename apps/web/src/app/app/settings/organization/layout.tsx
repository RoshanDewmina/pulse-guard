import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Settings - Organization",
  description: "Manage organization settings and preferences.",
  path: '/app/settings/organization',
  noIndex: true,
})

export default function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

