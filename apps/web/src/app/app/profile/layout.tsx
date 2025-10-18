import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Profile",
  description: "Manage your profile settings.",
  path: '/app/profile',
keywords: ['profile', 'user profile', 'account profile', 'personal settings'],
  noIndex: true,
})

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

