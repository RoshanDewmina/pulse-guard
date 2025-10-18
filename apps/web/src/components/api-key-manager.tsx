'use client';

import { useState } from 'react';
import {
  SaturnButton,
  SaturnInput,
  SaturnLabel,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
  SaturnCard,
  SaturnCardContent,
} from '@/components/saturn';
import { Plus, Copy, Trash2, Check, Key, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

interface ApiKeyManagerProps {
  initialKeys: ApiKey[];
}

export function ApiKeyManager({ initialKeys }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key');
      }

      setCreatedKey(data.apiKey.key);
      setKeys([...keys, {
        id: data.apiKey.id,
        name: data.apiKey.name,
        key: `sk_****${data.apiKey.key.slice(-4)}`,
        createdAt: new Date(data.apiKey.createdAt),
        lastUsedAt: null,
      }]);
      setNewKeyName('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    setDeleting(keyId);
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete API key');
      }

      setKeys(keys.filter(k => k.id !== keyId));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedKey(null);
    setNewKeyName('');
  };

  if (showCreateModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <SaturnCard className="max-w-md w-full">
          <SaturnCardContent className="p-6">
            {!createdKey ? (
              <>
                <h3 className="text-xl font-semibold text-[#37322F] font-sans mb-4">
                  Create API Key
                </h3>
                <div className="space-y-4">
                  <div>
                    <SaturnLabel htmlFor="keyName" required>
                      Key Name
                    </SaturnLabel>
                    <SaturnInput
                      id="keyName"
                      type="text"
                      placeholder="Production Server"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      disabled={creating}
                      fullWidth
                      className="mt-1"
                    />
                    <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">
                      Give your API key a descriptive name to remember where it's used
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <SaturnButton
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim() || creating}
                      loading={creating}
                      icon={<Key className="w-4 h-4" />}
                    >
                      Create Key
                    </SaturnButton>
                    <SaturnButton
                      variant="secondary"
                      onClick={closeCreateModal}
                      disabled={creating}
                    >
                      Cancel
                    </SaturnButton>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#37322F] font-sans">
                      API Key Created!
                    </h3>
                    <p className="text-sm text-[rgba(55,50,47,0.70)] font-sans">
                      Save this key securely
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 font-sans text-sm">Important!</p>
                      <p className="text-sm text-red-800 font-sans mt-1">
                        This is the only time you'll see this key. Copy it now and store it securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <SaturnLabel>Your API Key</SaturnLabel>
                    <div className="flex gap-2 mt-1">
                      <code className="flex-1 bg-[#F7F5F3] border border-[rgba(55,50,47,0.12)] rounded-lg px-3 py-2 text-sm font-mono text-[#37322F] overflow-x-auto">
                        {createdKey}
                      </code>
                      <SaturnButton
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(createdKey, 'new')}
                        icon={copiedKey === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      >
                        {copiedKey === 'new' ? 'Copied' : 'Copy'}
                      </SaturnButton>
                    </div>
                  </div>

                  <SaturnButton fullWidth onClick={closeCreateModal}>
                    Done
                  </SaturnButton>
                </div>
              </>
            )}
          </SaturnCardContent>
        </SaturnCard>
      </div>
    );
  }

  return (
    <>
      {keys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="h-12 w-12 text-[rgba(55,50,47,0.40)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#37322F] font-sans mb-2">No API keys yet</h3>
          <p className="text-[rgba(55,50,47,0.80)] font-sans mb-4">
            Create your first API key to start using the Saturn API
          </p>
          <SaturnButton onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
            Create API Key
          </SaturnButton>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <SaturnButton onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
              Create API Key
            </SaturnButton>
          </div>
          <SaturnTable>
            <SaturnTableHeader>
              <SaturnTableRow>
                <SaturnTableHead>Name</SaturnTableHead>
                <SaturnTableHead>Key</SaturnTableHead>
                <SaturnTableHead>Created</SaturnTableHead>
                <SaturnTableHead>Last Used</SaturnTableHead>
                <SaturnTableHead>Expires</SaturnTableHead>
                <SaturnTableHead className="text-right">Actions</SaturnTableHead>
              </SaturnTableRow>
            </SaturnTableHeader>
            <SaturnTableBody>
              {keys.map((key) => (
                <SaturnTableRow key={key.id}>
                  <SaturnTableCell className="font-medium text-[#37322F]">{key.name}</SaturnTableCell>
                  <SaturnTableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-[#37322F]">{key.key}</code>
                      <button 
                        className="p-1 hover:bg-[rgba(55,50,47,0.04)] rounded"
                        onClick={() => copyToClipboard(key.key, key.id)}
                      >
                        {copiedKey === key.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-[rgba(55,50,47,0.80)]" />
                        )}
                      </button>
                    </div>
                  </SaturnTableCell>
                  <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                    {format(key.createdAt, 'MMM d, yyyy')}
                  </SaturnTableCell>
                  <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                    {key.lastUsedAt ? format(key.lastUsedAt, 'MMM d, yyyy') : 'Never'}
                  </SaturnTableCell>
                  <SaturnTableCell>
                    <SaturnBadge variant="default" size="sm">Never</SaturnBadge>
                  </SaturnTableCell>
                  <SaturnTableCell className="text-right">
                    <SaturnButton 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={deleting === key.id}
                      loading={deleting === key.id}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      {deleting === key.id ? 'Deleting...' : ''}
                    </SaturnButton>
                  </SaturnTableCell>
                </SaturnTableRow>
              ))}
            </SaturnTableBody>
          </SaturnTable>
        </>
      )}
    </>
  );
}

