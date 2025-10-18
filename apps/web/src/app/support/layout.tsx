import { generatePageMetadata } from "@/lib/seo/metadata"
import { getContactPageSchema, getBreadcrumbSchema } from "@/lib/seo/schema"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = generatePageMetadata({
  title: "Support & Contact | Saturn",
  description: "Get help with Saturn cron monitoring. Contact our support team for technical assistance, billing questions, or general inquiries.",
  keywords: ['support', 'contact', 'help', 'customer service', 'technical support'],
  path: '/support',
})

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const contactSchema = getContactPageSchema({
    name: 'Support & Contact',
    description: 'Get help with Saturn cron monitoring.',
    url: 'https://saturnmonitor.com/support',
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://saturnmonitor.com' },
    { name: 'Support', url: 'https://saturnmonitor.com/support' },
  ]);

  return (
    <>
      <JsonLd data={contactSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  )
}

