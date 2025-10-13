'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface OutputViewerProps {
  outputKey: string;
  sizeBytes?: number | null;
  exitCode?: number | null;
  timestamp?: Date;
}

export function OutputViewer({ outputKey, sizeBytes, exitCode, timestamp }: OutputViewerProps) {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchOutput() {
      try {
        const response = await fetch(`/api/outputs/${encodeURIComponent(outputKey)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch output');
        }
        const text = await response.text();
        setOutput(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load output');
      } finally {
        setLoading(false);
      }
    }

    if (outputKey) {
      fetchOutput();
    } else {
      setLoading(false);
      setError('No output available');
    }
  }, [outputKey]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: 'Copied to clipboard',
        description: 'Output has been copied to your clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy output to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output-${outputKey.split('/').pop() || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download started',
      description: 'Output file is being downloaded.',
    });
  };

  // Simple syntax detection for highlighting
  const detectFormat = (text: string): 'json' | 'log' | 'plain' => {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        return 'plain';
      }
    }
    if (/^\[?\d{4}-\d{2}-\d{2}/.test(trimmed) || /ERROR|WARN|INFO|DEBUG/.test(text)) {
      return 'log';
    }
    return 'plain';
  };

  const formatOutput = (text: string): string => {
    const format = detectFormat(text);
    if (format === 'json') {
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        return text;
      }
    }
    return text;
  };

  const getOutputClass = (): string => {
    const format = detectFormat(output);
    const baseClass = 'font-mono text-sm whitespace-pre-wrap break-words p-4 bg-gray-950 text-gray-100 rounded-md overflow-x-auto max-h-[600px] overflow-y-auto';
    
    if (format === 'json') {
      return `${baseClass} text-green-400`;
    }
    if (format === 'log') {
      return `${baseClass}`;
    }
    return baseClass;
  };

  // Highlight [REDACTED] markers
  const highlightRedacted = (text: string): React.ReactNode => {
    if (!text.includes('[REDACTED]')) {
      return text;
    }

    const parts = text.split(/(\[REDACTED\])/g);
    return parts.map((part, index) => {
      if (part === '[REDACTED]') {
        return (
          <span key={index} className="bg-red-900/50 text-red-300 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Output not available</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Job Output</CardTitle>
            <div className="flex items-center gap-3 mt-2">
              {sizeBytes !== null && sizeBytes !== undefined && (
                <Badge variant="outline">
                  {sizeBytes < 1024
                    ? `${sizeBytes} B`
                    : sizeBytes < 1024 * 1024
                    ? `${(sizeBytes / 1024).toFixed(1)} KB`
                    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                </Badge>
              )}
              {exitCode !== null && exitCode !== undefined && (
                <Badge variant={exitCode === 0 ? 'default' : 'destructive'}>
                  Exit Code: {exitCode}
                </Badge>
              )}
              {timestamp && (
                <span className="text-sm text-gray-500">
                  {new Date(timestamp).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={getOutputClass()}>
          {highlightRedacted(formatOutput(output))}
        </div>
        {output.includes('[REDACTED]') && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Sensitive data redacted:</strong> Some potentially sensitive information (API keys, tokens, passwords) has been automatically removed from this output.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





