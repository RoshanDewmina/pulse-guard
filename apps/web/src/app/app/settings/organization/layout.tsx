import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Settings - Organization",
  description: "Manage organization settings and preferences.",
  path: '/app/settings/organization',
keywords: ['organization settings', 'company settings', 'org config', 'team settings'],
  noIndex: true,
})

export default function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

