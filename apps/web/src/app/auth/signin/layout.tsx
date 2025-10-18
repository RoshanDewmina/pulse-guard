import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Sign In | Saturn",
  description: "Sign in to your Saturn account to monitor your cron jobs and scheduled tasks.",
  path: '/auth/signin',
  noIndex: true,
})

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

