'use client';

import { useState } from 'react';
import { SaturnButton } from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Download, FileJson } from 'lucide-react';

interface ExportDataButtonProps {
  variant?: 'download' | 'email';
  className?: string;
}

export function ExportDataButton({ variant = 'download', className }: ExportDataButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      if (variant === 'download') {
        // Direct download
        const response = await fetch('/api/user/export', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to export data');
        }

        const data = await response.json();
        
        // Create download link
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saturn-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Export successful',
          description: 'Your data has been downloaded',
        });
      } else {
        // Email export
        const response = await fetch('/api/user/export', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to request email export');
        }

        toast({
          title: 'Export requested',
          description: 'You will receive an email with your data shortly',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to export data. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SaturnButton
      className={className}
      onClick={handleExport}
      loading={loading}
      disabled={loading}
      variant={variant === 'email' ? 'secondary' : 'primary'}
    >
      {variant === 'download' ? (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download Data (JSON)
        </>
      ) : (
        <>
          <FileJson className="h-4 w-4 mr-2" />
          Request Email Export
        </>
      )}
    </SaturnButton>
  );
}


