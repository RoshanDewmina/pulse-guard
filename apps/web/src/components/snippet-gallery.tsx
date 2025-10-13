'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface SnippetGalleryProps {
  monitorToken: string;
  apiUrl?: string;
}

export function SnippetGallery({ monitorToken, apiUrl = 'https://tokiflow.co' }: SnippetGalleryProps) {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const snippets = {
    bash: {
      simple: `# Simple ping
curl "${apiUrl}/api/ping/${monitorToken}"`,
      
      withState: `# Start-Success pattern
curl "${apiUrl}/api/ping/${monitorToken}?state=start"
# ... run your job ...
curl "${apiUrl}/api/ping/${monitorToken}?state=success"`,
      
      withOutput: `# With output capture
curl -X POST "${apiUrl}/api/ping/${monitorToken}?state=success" \\
  -H "Content-Type: text/plain" \\
  -d "Job completed successfully at $(date)"`,
      
      errorHandling: `# With error handling
#!/bin/bash
set -e

# Start ping
curl -X POST "${apiUrl}/api/ping/${monitorToken}?state=start"

# Run job
if ./your-job.sh; then
  # Success
  curl -X POST "${apiUrl}/api/ping/${monitorToken}?state=success" \\
    -H "Content-Type: text/plain" \\
    -d "$(./your-job.sh 2>&1)"
else
  # Failure
  EXIT_CODE=$?
  curl -X POST "${apiUrl}/api/ping/${monitorToken}?state=fail&exitCode=$EXIT_CODE" \\
    -H "Content-Type: text/plain" \\
    -d "Job failed with exit code $EXIT_CODE"
fi`,
    },
    
    python: {
      simple: `import requests

# Simple ping
requests.get("${apiUrl}/api/ping/${monitorToken}")`,
      
      withState: `import requests

# Start-Success pattern
requests.get("${apiUrl}/api/ping/${monitorToken}?state=start")

# Run your job
result = run_your_job()

# Success ping
requests.post(
    "${apiUrl}/api/ping/${monitorToken}?state=success",
    headers={"Content-Type": "text/plain"},
    data=f"Job completed: {result}"
)`,
      
      contextManager: `import requests
from contextlib import contextmanager

@contextmanager
def tokiflow_monitor(token: str):
    """Context manager for automatic monitoring"""
    url = "${apiUrl}/api/ping"
    requests.get(f"{url}/{token}?state=start")
    try:
        yield
        requests.get(f"{url}/{token}?state=success")
    except Exception as e:
        requests.post(
            f"{url}/{token}?state=fail",
            headers={"Content-Type": "text/plain"},
            data=str(e)
        )
        raise

# Usage
with tokiflow_monitor("${monitorToken}"):
    run_your_job()`,
      
      advanced: `import requests
import sys
from datetime import datetime

def ping_tokiflow(state: str, output: str = None, exit_code: int = 0):
    """Send ping with optional output"""
    url = "${apiUrl}/api/ping/${monitorToken}"
    params = {"state": state}
    
    if exit_code != 0:
        params["exitCode"] = exit_code
    
    if output:
        response = requests.post(
            url,
            params=params,
            headers={"Content-Type": "text/plain"},
            data=output,
            timeout=10
        )
    else:
        response = requests.get(url, params=params, timeout=10)
    
    response.raise_for_status()
    return response.json()

# Usage
try:
    ping_tokiflow("start")
    result = run_your_job()
    ping_tokiflow("success", output=f"Completed at {datetime.now()}")
except Exception as e:
    ping_tokiflow("fail", output=str(e), exit_code=1)
    sys.exit(1)`,
    },
    
    node: {
      simple: `// Simple ping
await fetch('${apiUrl}/api/ping/${monitorToken}');`,
      
      withState: `// Start-Success pattern
await fetch('${apiUrl}/api/ping/${monitorToken}?state=start');

// Run your job
const result = await runYourJob();

// Success ping
await fetch('${apiUrl}/api/ping/${monitorToken}?state=success', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: \`Job completed: \${result}\`
});`,
      
      wrapper: `async function withMonitoring(fn) {
  const url = '${apiUrl}/api/ping/${monitorToken}';
  
  await fetch(\`\${url}?state=start\`);
  
  try {
    const result = await fn();
    await fetch(\`\${url}?state=success\`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: \`Success: \${JSON.stringify(result)}\`
    });
    return result;
  } catch (error) {
    await fetch(\`\${url}?state=fail\`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: error.message
    });
    throw error;
  }
}

// Usage
await withMonitoring(async () => {
  await runYourJob();
});`,
    },
    
    go: {
      simple: `// Simple ping
resp, err := http.Get("${apiUrl}/api/ping/${monitorToken}")
if err != nil {
    log.Fatal(err)
}
defer resp.Body.Close()`,
      
      withState: `package main

import (
    "bytes"
    "fmt"
    "net/http"
)

func pingTokiflow(state string, output string) error {
    url := fmt.Sprintf("${apiUrl}/api/ping/${monitorToken}?state=%s", state)
    
    if output != "" {
        resp, err := http.Post(url, "text/plain", bytes.NewBufferString(output))
        if err != nil {
            return err
        }
        defer resp.Body.Close()
    } else {
        resp, err := http.Get(url)
        if err != nil {
            return err
        }
        defer resp.Body.Close()
    }
    
    return nil
}

func main() {
    pingTokiflow("start", "")
    
    if err := runYourJob(); err != nil {
        pingTokiflow("fail", err.Error())
        return
    }
    
    pingTokiflow("success", "Job completed")
}`,
    },
    
    php: {
      simple: `<?php
// Simple ping
file_get_contents('${apiUrl}/api/ping/${monitorToken}');`,
      
      withCurl: `<?php
function pingTokiflow($state, $output = null) {
    $url = '${apiUrl}/api/ping/${monitorToken}?state=' . $state;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    if ($output) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $output);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain']);
    }
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return $response;
}

// Usage
pingTokiflow('start');

try {
    $result = runYourJob();
    pingTokiflow('success', "Job completed: " . $result);
} catch (Exception $e) {
    pingTokiflow('fail', $e->getMessage());
    exit(1);
}`,
    },
    
    ruby: {
      simple: `require 'net/http'

# Simple ping
uri = URI('${apiUrl}/api/ping/${monitorToken}')
Net::HTTP.get(uri)`,
      
      withState: `require 'net/http'
require 'uri'

def ping_tokiflow(state, output = nil)
  uri = URI("${apiUrl}/api/ping/${monitorToken}?state=\#{state}")
  
  if output
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'text/plain'
    request.body = output
    Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
  else
    Net::HTTP.get(uri)
  end
end

# Usage
ping_tokiflow('start')

begin
  result = run_your_job
  ping_tokiflow('success', "Job completed: \#{result}")
rescue StandardError => e
  ping_tokiflow('fail', e.message)
  raise
end`,
    },
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="bash" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="bash">Bash</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="node">Node.js</TabsTrigger>
          <TabsTrigger value="go">Go</TabsTrigger>
          <TabsTrigger value="php">PHP</TabsTrigger>
          <TabsTrigger value="ruby">Ruby</TabsTrigger>
        </TabsList>

        {Object.entries(snippets).map(([lang, examples]) => (
          <TabsContent key={lang} value={lang} className="space-y-4">
            {Object.entries(examples).map(([name, code]) => (
              <div key={name} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code, `${lang}-${name}`)}
                  >
                    {copiedSnippet === `${lang}-${name}` ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{code}</code>
                </pre>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

