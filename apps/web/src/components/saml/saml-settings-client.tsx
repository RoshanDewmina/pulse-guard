'use client';

import { useState } from 'react';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnInput,
  SaturnLabel,
  SaturnTextarea,
  SaturnBadge,
} from '@/components/saturn';
import {
  Shield,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Key,
  Globe,
  User,
  Mail,
} from 'lucide-react';

interface SAMLConfig {
  id: string;
  name: string;
  idpUrl: string;
  spEntityId: string;
  acsUrl: string;
  sloUrl?: string | null;
  nameIdFormat: string;
  attributeMapping?: any;
  isEnabled: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface SAMLSettingsClientProps {
  initialConfig: SAMLConfig | null;
  orgId: string;
}

export function SAMLSettingsClient({ initialConfig, orgId }: SAMLSettingsClientProps) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: config?.name || '',
    idpUrl: config?.idpUrl || '',
    idpCert: '',
    spCert: '',
    spKey: '',
    spEntityId: config?.spEntityId || '',
    acsUrl: config?.acsUrl || '',
    sloUrl: config?.sloUrl || '',
    nameIdFormat: config?.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    attributeMapping: {
      email: config?.attributeMapping?.email || 'email',
      name: config?.attributeMapping?.name || 'name',
      firstName: config?.attributeMapping?.firstName || 'given_name',
      lastName: config?.attributeMapping?.lastName || 'family_name',
    },
    isEnabled: config?.isEnabled || false,
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('attributeMapping.')) {
      const attrField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        attributeMapping: {
          ...prev.attributeMapping,
          [attrField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/saml/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          ...formData,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setConfig(data);
        setTestResults(null);
      } else {
        console.error('Error saving SAML config:', data.error);
      }
    } catch (error) {
      console.error('Error saving SAML config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/saml/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          ...formData,
        }),
      });

      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Error testing SAML config:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the SAML configuration? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/saml/config?orgId=${orgId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConfig(null);
        setFormData({
          name: '',
          idpUrl: '',
          idpCert: '',
          spCert: '',
          spKey: '',
          spEntityId: '',
          acsUrl: '',
          sloUrl: '',
          nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          attributeMapping: {
            email: 'email',
            name: 'name',
            firstName: 'given_name',
            lastName: 'family_name',
          },
          isEnabled: false,
        });
      }
    } catch (error) {
      console.error('Error deleting SAML config:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            SAML SSO Status
          </SaturnCardTitle>
          <SaturnCardDescription>
            Current SAML configuration status for your organization
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#37322F] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold text-[#37322F] font-sans">
                  {config ? config.name : 'Not Configured'}
                </div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">
                  {config ? (
                    <div className="flex items-center gap-2">
                      <SaturnBadge variant={config.isEnabled ? 'success' : 'warning'}>
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </SaturnBadge>
                      <span>•</span>
                      <span>Last updated: {new Date(config.updatedAt).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    'SAML SSO is not configured for this organization'
                  )}
                </div>
              </div>
            </div>
            {config && (
              <div className="flex items-center gap-2">
                <SaturnButton
                  variant="secondary"
                  onClick={handleTest}
                  disabled={testing}
                >
                  <TestTube className="w-4 h-4" />
                  Test Configuration
                </SaturnButton>
                <SaturnButton
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </SaturnButton>
              </div>
            )}
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Test Results */}
      {testResults && (
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle className="flex items-center gap-2">
              {testResults.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Test Results
            </SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-3">
              <div className="text-sm font-medium text-[#37322F]">
                {testResults.message}
              </div>
              {testResults.validation && (
                <div className="space-y-2">
                  {Object.entries(testResults.validation).map(([key, result]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2">
                      {result.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium capitalize">{key}:</span>
                      <span className="text-sm text-[rgba(55,50,47,0.70)]">{result.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SaturnCardContent>
        </SaturnCard>
      )}

      {/* Configuration Form */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            SAML Configuration
          </SaturnCardTitle>
          <SaturnCardDescription>
            Configure your SAML 2.0 identity provider settings
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#37322F] flex items-center gap-2">
              <Info className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SaturnLabel htmlFor="name" required>Configuration Name</SaturnLabel>
                <SaturnInput
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Company SAML SSO"
                  fullWidth
                />
              </div>
              <div>
                <SaturnLabel htmlFor="isEnabled">Status</SaturnLabel>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isEnabled"
                    checked={formData.isEnabled}
                    onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                    className="w-4 h-4 rounded border-[rgba(55,50,47,0.16)]"
                  />
                  <label htmlFor="isEnabled" className="text-sm font-medium text-[#37322F]">
                    Enable SAML SSO
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Identity Provider Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#37322F] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Identity Provider Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <SaturnLabel htmlFor="idpUrl" required>IDP URL</SaturnLabel>
                <SaturnInput
                  id="idpUrl"
                  value={formData.idpUrl}
                  onChange={(e) => handleInputChange('idpUrl', e.target.value)}
                  placeholder="https://your-idp.com/sso/saml"
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="idpCert" required>IDP Certificate (PEM format)</SaturnLabel>
                <SaturnTextarea
                  id="idpCert"
                  value={formData.idpCert}
                  onChange={(e) => handleInputChange('idpCert', e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={6}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Service Provider Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#37322F] flex items-center gap-2">
              <Key className="w-5 h-5" />
              Service Provider Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <SaturnLabel htmlFor="spEntityId" required>Entity ID</SaturnLabel>
                <SaturnInput
                  id="spEntityId"
                  value={formData.spEntityId}
                  onChange={(e) => handleInputChange('spEntityId', e.target.value)}
                  placeholder="urn:example:sp"
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="acsUrl" required>ACS URL</SaturnLabel>
                <SaturnInput
                  id="acsUrl"
                  value={formData.acsUrl}
                  onChange={(e) => handleInputChange('acsUrl', e.target.value)}
                  placeholder="https://your-app.com/api/auth/callback/saml"
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="sloUrl">SLO URL (Optional)</SaturnLabel>
                <SaturnInput
                  id="sloUrl"
                  value={formData.sloUrl}
                  onChange={(e) => handleInputChange('sloUrl', e.target.value)}
                  placeholder="https://your-app.com/api/auth/signout/saml"
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="spCert" required>SP Certificate (PEM format)</SaturnLabel>
                <SaturnTextarea
                  id="spCert"
                  value={formData.spCert}
                  onChange={(e) => handleInputChange('spCert', e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={6}
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="spKey" required>SP Private Key (PEM format)</SaturnLabel>
                <SaturnTextarea
                  id="spKey"
                  value={formData.spKey}
                  onChange={(e) => handleInputChange('spKey', e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  rows={6}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Attribute Mapping */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#37322F] flex items-center gap-2">
              <User className="w-5 h-5" />
              Attribute Mapping
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SaturnLabel htmlFor="emailAttr">Email Attribute</SaturnLabel>
                <SaturnInput
                  id="emailAttr"
                  value={formData.attributeMapping.email}
                  onChange={(e) => handleInputChange('attributeMapping.email', e.target.value)}
                  placeholder="email"
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="nameAttr">Name Attribute</SaturnLabel>
                <SaturnInput
                  id="nameAttr"
                  value={formData.attributeMapping.name}
                  onChange={(e) => handleInputChange('attributeMapping.name', e.target.value)}
                  placeholder="name"
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="firstNameAttr">First Name Attribute</SaturnLabel>
                <SaturnInput
                  id="firstNameAttr"
                  value={formData.attributeMapping.firstName}
                  onChange={(e) => handleInputChange('attributeMapping.firstName', e.target.value)}
                  placeholder="given_name"
                  fullWidth
                />
              </div>
              
              <div>
                <SaturnLabel htmlFor="lastNameAttr">Last Name Attribute</SaturnLabel>
                <SaturnInput
                  id="lastNameAttr"
                  value={formData.attributeMapping.lastName}
                  onChange={(e) => handleInputChange('attributeMapping.lastName', e.target.value)}
                  placeholder="family_name"
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-sm text-[rgba(55,50,47,0.70)]">
              {config ? 'Update your SAML configuration' : 'Create a new SAML configuration'}
            </div>
            <div className="flex items-center gap-2">
              <SaturnButton
                variant="secondary"
                onClick={handleTest}
                disabled={testing || loading}
              >
                <TestTube className="w-4 h-4" />
                Test Configuration
              </SaturnButton>
              <SaturnButton
                onClick={handleSave}
                disabled={loading || testing}
              >
                {loading ? 'Saving...' : config ? 'Update Configuration' : 'Save Configuration'}
              </SaturnButton>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}
