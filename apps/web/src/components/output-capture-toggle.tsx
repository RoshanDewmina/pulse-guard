'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { FileText } from 'lucide-react';

interface OutputCaptureToggleProps {
  monitorId: string;
  captureOutput: boolean;
  captureLimitKb: number;
}

export function OutputCaptureToggle({
  monitorId,
  captureOutput: initialCaptureOutput,
  captureLimitKb: initialCaptureLimitKb,
}: OutputCaptureToggleProps) {
  const [captureOutput, setCaptureOutput] = useState(initialCaptureOutput);
  const [captureLimitKb, setCaptureLimitKb] = useState(initialCaptureLimitKb);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          captureOutput,
          captureLimitKb: parseInt(captureLimitKb.toString(), 10),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      toast({
        title: 'Settings updated',
        description: 'Output capture settings have been saved.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update output capture settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    captureOutput !== initialCaptureOutput ||
    captureLimitKb !== initialCaptureLimitKb;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Output Capture
        </CardTitle>
        <CardDescription>
          Capture and store job output for debugging. Sensitive data will be automatically redacted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="captureOutput" className="text-base">
              Enable Output Capture
            </Label>
            <p className="text-sm text-gray-500">
              Store stdout/stderr from job executions
            </p>
          </div>
          <Switch
            id="captureOutput"
            checked={captureOutput}
            onCheckedChange={setCaptureOutput}
          />
        </div>

        {captureOutput && (
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="captureLimitKb">Capture Limit (KB)</Label>
            <Input
              id="captureLimitKb"
              type="number"
              min="1"
              max="1024"
              value={captureLimitKb}
              onChange={(e) => setCaptureLimitKb(parseInt(e.target.value, 10) || 32)}
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500">
              Maximum output size to capture per run (1-1024 KB). Default is 32 KB.
            </p>
          </div>
        )}

        {hasChanges && (
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCaptureOutput(initialCaptureOutput);
                setCaptureLimitKb(initialCaptureLimitKb);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        )}

        {captureOutput && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              <strong>Privacy Protection:</strong> API keys, passwords, tokens, and other sensitive data
              will be automatically redacted from captured output.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}






