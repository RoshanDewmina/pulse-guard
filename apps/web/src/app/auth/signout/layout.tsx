import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Sign Out | Saturn",
  description: "Sign out of your Saturn account.",
  path: '/auth/signout',
  noIndex: true,
})

export default function SignOutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

