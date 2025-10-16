'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnInput,
  SaturnLabel,
} from '@/components/saturn';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { useToast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';

export default function NewStatusPagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    isPublic: true,
  });

  function handleTitleChange(title: string) {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
    });
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  async function handleCreate() {
    if (!formData.title || !formData.slug) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/status-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create status page');
      }

      const statusPage = await res.json();

      toast({
        title: 'Success',
        description: 'Status page created successfully',
      });

      router.push(`/app/status-pages/${statusPage.id}/edit`);
    } catch (error: any) {
      console.error('Failed to create:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create status page',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Create Status Page"
        description="Set up a new public status page for your services"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Status Pages', href: '/app/status-pages' },
          { label: 'New' },
        ]}
      />

      <div className="max-w-2xl">
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h2">Basic Information</SaturnCardTitle>
            <SaturnCardDescription>
              Start by giving your status page a title and URL
            </SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-6">
              <div>
                <SaturnLabel htmlFor="title">
                  Title <span className="text-red-600">*</span>
                </SaturnLabel>
                <SaturnInput
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="My Service Status"
                  autoFocus
                />
                <p className="text-sm text-[rgba(55,50,47,0.60)] mt-1 font-sans">
                  This will be displayed as the main heading on your status page
                </p>
              </div>

              <div>
                <SaturnLabel htmlFor="slug">
                  URL Slug <span className="text-red-600">*</span>
                </SaturnLabel>
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(55,50,47,0.80)] font-sans text-sm">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/status/
                  </span>
                  <SaturnInput
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: generateSlug(e.target.value) })
                    }
                    placeholder="my-service"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-[rgba(55,50,47,0.60)] mt-1 font-sans">
                  Must be unique, lowercase, and use only letters, numbers, and hyphens
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <SaturnLabel htmlFor="isPublic" className="cursor-pointer">
                  Make this status page public
                </SaturnLabel>
              </div>
              <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                Public status pages are accessible to anyone with the URL. Private pages require
                an access token.
              </p>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <div className="flex gap-3 mt-6">
          <SaturnButton
            onClick={handleCreate}
            disabled={creating || !formData.title || !formData.slug}
          >
            <Save className="w-4 h-4 mr-2" />
            {creating ? 'Creating...' : 'Create Status Page'}
          </SaturnButton>
          <SaturnButton
            variant="secondary"
            onClick={() => router.push('/app/status-pages')}
            disabled={creating}
          >
            Cancel
          </SaturnButton>
        </div>
      </div>

      {/* Preview */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">What's Next?</SaturnCardTitle>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4 text-[rgba(55,50,47,0.80)] font-sans">
            <p>After creating your status page, you'll be able to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Add components to group your monitors</li>
              <li>Customize the theme and colors</li>
              <li>Configure a custom domain</li>
              <li>Preview and publish your status page</li>
            </ul>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

