import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Device Authorization | Saturn",
  description: "Authorize your device to access Saturn.",
  path: '/auth/device',
  noIndex: true,
})

export default function DeviceAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

