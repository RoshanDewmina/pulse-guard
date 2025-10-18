import { redirect } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Settings",
  description: "Manage your organization settings.",
  path: '/app/settings',
  noIndex: true,
})

export default function SettingsPage() {
  redirect('/app/settings/organization');
}

