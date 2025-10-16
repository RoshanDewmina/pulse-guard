'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnInput,
  SaturnLabel,
  SaturnBadge,
} from '@/components/saturn';
import { Plus, Trash2, Save, Eye, Copy, Check } from 'lucide-react';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { useToast } from '@/components/ui/use-toast';

interface Component {
  id: string;
  name: string;
  description?: string;
  monitorIds: string[];
}

interface Theme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string | null;
}

interface StatusPage {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  customDomain: string | null;
  components: Component[];
  theme: Theme;
}

interface Monitor {
  id: string;
  name: string;
  status: string;
}

export default function EditStatusPagePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusPage, setStatusPage] = useState<StatusPage | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      // Fetch status page
      const pageRes = await fetch(`/api/status-pages/${params.id}`);
      if (!pageRes.ok) throw new Error('Failed to fetch status page');
      const pageData = await pageRes.json();
      setStatusPage(pageData);

      // Fetch monitors
      const monitorsRes = await fetch('/api/monitors');
      if (!monitorsRes.ok) throw new Error('Failed to fetch monitors');
      const monitorsData = await monitorsRes.json();
      setMonitors(monitorsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load status page',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!statusPage) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/status-pages/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: statusPage.title,
          isPublic: statusPage.isPublic,
          customDomain: statusPage.customDomain,
          components: statusPage.components,
          theme: statusPage.theme,
        }),
      });

      if (!res.ok) throw new Error('Failed to save status page');

      toast({
        title: 'Success',
        description: 'Status page saved successfully',
      });
    } catch (error) {
      console.error('Failed to save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save status page',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function addComponent() {
    if (!statusPage) return;

    const newComponent: Component = {
      id: crypto.randomUUID(),
      name: 'New Component',
      description: '',
      monitorIds: [],
    };

    setStatusPage({
      ...statusPage,
      components: [...statusPage.components, newComponent],
    });
  }

  function updateComponent(index: number, updates: Partial<Component>) {
    if (!statusPage) return;

    const newComponents = [...statusPage.components];
    newComponents[index] = { ...newComponents[index], ...updates };

    setStatusPage({
      ...statusPage,
      components: newComponents,
    });
  }

  function removeComponent(index: number) {
    if (!statusPage) return;

    setStatusPage({
      ...statusPage,
      components: statusPage.components.filter((_, i) => i !== index),
    });
  }

  function toggleMonitor(componentIndex: number, monitorId: string) {
    if (!statusPage) return;

    const component = statusPage.components[componentIndex];
    const monitorIds = component.monitorIds.includes(monitorId)
      ? component.monitorIds.filter((id) => id !== monitorId)
      : [...component.monitorIds, monitorId];

    updateComponent(componentIndex, { monitorIds });
  }

  function copyUrl() {
    if (!statusPage) return;

    const url = `${window.location.origin}/status/${statusPage.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: 'Copied!',
      description: 'Status page URL copied to clipboard',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#37322F] font-sans">Loading...</div>
      </div>
    );
  }

  if (!statusPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#37322F] font-sans">Status page not found</div>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/status/${statusPage.slug}`;

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Edit Status Page"
        description="Configure your public status page"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Status Pages', href: '/app/status-pages' },
          { label: statusPage.title },
        ]}
      />

      {/* Actions Bar */}
      <div className="flex gap-3 flex-wrap">
        <SaturnButton onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </SaturnButton>
        <SaturnButton
          variant="secondary"
          onClick={() => window.open(publicUrl, '_blank')}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </SaturnButton>
        <SaturnButton variant="secondary" onClick={copyUrl}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          Copy URL
        </SaturnButton>
      </div>

      {/* General Settings */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">General Settings</SaturnCardTitle>
          <SaturnCardDescription>Basic information about your status page</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            <div>
              <SaturnLabel htmlFor="title">Title</SaturnLabel>
              <SaturnInput
                id="title"
                value={statusPage.title}
                onChange={(e) => setStatusPage({ ...statusPage, title: e.target.value })}
                placeholder="My Service Status"
              />
            </div>

            <div>
              <SaturnLabel htmlFor="slug">Slug (URL)</SaturnLabel>
              <div className="flex gap-2">
                <SaturnInput
                  id="slug"
                  value={statusPage.slug}
                  disabled
                  className="flex-1"
                />
                <SaturnBadge variant="default" className="self-center">
                  Read-only
                </SaturnBadge>
              </div>
              <p className="text-sm text-[rgba(55,50,47,0.60)] mt-1 font-sans">
                {publicUrl}
              </p>
            </div>

            <div>
              <SaturnLabel htmlFor="customDomain">Custom Domain (Optional)</SaturnLabel>
              <SaturnInput
                id="customDomain"
                value={statusPage.customDomain || ''}
                onChange={(e) =>
                  setStatusPage({ ...statusPage, customDomain: e.target.value || null })
                }
                placeholder="status.yourdomain.com"
              />
              <p className="text-sm text-[rgba(55,50,47,0.60)] mt-1 font-sans">
                Configure DNS CNAME record pointing to saturn.co
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={statusPage.isPublic}
                onChange={(e) =>
                  setStatusPage({ ...statusPage, isPublic: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <SaturnLabel htmlFor="isPublic" className="cursor-pointer">
                Public Status Page
              </SaturnLabel>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Theme Customization */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">Theme</SaturnCardTitle>
          <SaturnCardDescription>Customize the look and feel</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SaturnLabel htmlFor="primaryColor">Primary Color</SaturnLabel>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={statusPage.theme.primaryColor}
                  onChange={(e) =>
                    setStatusPage({
                      ...statusPage,
                      theme: { ...statusPage.theme, primaryColor: e.target.value },
                    })
                  }
                  className="h-10 w-16 rounded border border-gray-300"
                />
                <SaturnInput
                  value={statusPage.theme.primaryColor}
                  onChange={(e) =>
                    setStatusPage({
                      ...statusPage,
                      theme: { ...statusPage.theme, primaryColor: e.target.value },
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <SaturnLabel htmlFor="backgroundColor">Background Color</SaturnLabel>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="backgroundColor"
                  value={statusPage.theme.backgroundColor}
                  onChange={(e) =>
                    setStatusPage({
                      ...statusPage,
                      theme: { ...statusPage.theme, backgroundColor: e.target.value },
                    })
                  }
                  className="h-10 w-16 rounded border border-gray-300"
                />
                <SaturnInput
                  value={statusPage.theme.backgroundColor}
                  onChange={(e) =>
                    setStatusPage({
                      ...statusPage,
                      theme: { ...statusPage.theme, backgroundColor: e.target.value },
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <SaturnLabel htmlFor="textColor">Text Color</SaturnLabel>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="textColor"
                  value={statusPage.theme.textColor}
                  onChange={(e) =>
                    setStatusPage({
                      ...statusPage,
                      theme: { ...statusPage.theme, textColor: e.target.value },
                    })
                  }
                  className="h-10 w-16 rounded border border-gray-300"
                />
                <SaturnInput
                  value={statusPage.theme.textColor}
                  onChange={(e) =>
                    setStatusPage({
                      ...statusPage,
                      theme: { ...statusPage.theme, textColor: e.target.value },
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <SaturnLabel htmlFor="logoUrl">Logo URL (Optional)</SaturnLabel>
            <SaturnInput
              id="logoUrl"
              value={statusPage.theme.logoUrl || ''}
              onChange={(e) =>
                setStatusPage({
                  ...statusPage,
                  theme: { ...statusPage.theme, logoUrl: e.target.value || null },
                })
              }
              placeholder="https://example.com/logo.png"
            />
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Components */}
      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex justify-between items-start">
            <div>
              <SaturnCardTitle as="h2">Components</SaturnCardTitle>
              <SaturnCardDescription>
                Group monitors into logical components for your status page
              </SaturnCardDescription>
            </div>
            <SaturnButton onClick={addComponent}>
              <Plus className="w-4 h-4 mr-2" />
              Add Component
            </SaturnButton>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          {statusPage.components.length === 0 ? (
            <div className="text-center py-8 text-[rgba(55,50,47,0.80)] font-sans">
              <p className="mb-4">No components added yet.</p>
              <p className="text-sm text-[rgba(55,50,47,0.60)]">
                Components help organize your monitors into logical groups on the status page.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {statusPage.components.map((component, index) => (
                <div
                  key={component.id}
                  className="p-4 border border-gray-200 rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div>
                        <SaturnLabel>Component Name</SaturnLabel>
                        <SaturnInput
                          value={component.name}
                          onChange={(e) =>
                            updateComponent(index, { name: e.target.value })
                          }
                          placeholder="API Service"
                        />
                      </div>

                      <div>
                        <SaturnLabel>Description (Optional)</SaturnLabel>
                        <SaturnInput
                          value={component.description || ''}
                          onChange={(e) =>
                            updateComponent(index, { description: e.target.value })
                          }
                          placeholder="Core API endpoints"
                        />
                      </div>

                      <div>
                        <SaturnLabel>Monitors</SaturnLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {monitors.map((monitor) => {
                            const isSelected = component.monitorIds.includes(monitor.id);
                            return (
                              <button
                                key={monitor.id}
                                onClick={() => toggleMonitor(index, monitor.id)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-[#37322F] text-white'
                                    : 'bg-gray-100 text-[#37322F] hover:bg-gray-200'
                                }`}
                              >
                                {monitor.name}
                              </button>
                            );
                          })}
                        </div>
                        {component.monitorIds.length === 0 && (
                          <p className="text-sm text-[rgba(55,50,47,0.60)] mt-2 font-sans">
                            Select monitors to include in this component
                          </p>
                        )}
                      </div>
                    </div>

                    <SaturnButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(index)}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </SaturnButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

