import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Sign Up for Free | Saturn",
  description: "Create your free Saturn account and start monitoring cron jobs with anomaly detection. Get 5 monitors free, no credit card required.",
  keywords: ['sign up', 'create account', 'free trial', 'register'],
  path: '/auth/signup',
  noIndex: false,
})

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

