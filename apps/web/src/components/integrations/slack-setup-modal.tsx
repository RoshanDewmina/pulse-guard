'use client';

import { useState } from 'react';
import { X, ExternalLink, AlertCircle, CheckCircle2, Slack } from 'lucide-react';

interface SlackSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  isConnected?: boolean;
}

export function SlackSetupModal({ isOpen, onClose, orgId, isConnected }: SlackSetupModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConnectSlack = () => {
    setIsLoading(true);
    // Redirect to Slack OAuth
    window.location.href = `/api/slack/install?orgId=${orgId}`;
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(55,50,47,0.16)]">
          <h2 className="text-xl font-semibold text-[#37322F] font-sans flex items-center gap-2">
            <Slack className="w-6 h-6" />
            Connect Slack
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-[rgba(55,50,47,0.60)] hover:text-[#37322F] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 font-sans">Slack Connected</p>
                <p className="text-sm text-green-700 font-sans">
                  Your Slack workspace is already connected. You can manage alert channels in Settings → Alerts.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="space-y-4">
                <p className="text-[rgba(55,50,47,0.80)] font-sans">
                  Connect your Slack workspace to receive incident alerts and updates directly in your Slack channels.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-[#37322F] font-sans mb-3">
                    What you'll get:
                  </h3>
                  <ul className="space-y-2 text-sm text-[rgba(55,50,47,0.80)] font-sans">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>Real-time incident alerts in your chosen Slack channels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>Interactive buttons to acknowledge, mute, or view incidents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>Slash commands like <code className="bg-white px-1 rounded">/pulse</code> for quick actions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>Rich message formatting with incident context and monitor details</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-[#37322F] font-sans mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    Required Slack App Setup
                  </h3>
                  <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mb-3">
                    Before connecting, you need to create a Slack app. Follow these steps:
                  </p>
                  <ol className="text-sm text-[rgba(55,50,47,0.80)] space-y-2 ml-6 list-decimal font-sans">
                    <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">api.slack.com/apps</a></li>
                    <li>Click "Create New App" → "From scratch"</li>
                    <li>Name: "Saturn Monitor" and select your workspace</li>
                    <li>
                      <strong>OAuth & Permissions:</strong> Add these scopes:
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• <code className="bg-white px-1 rounded">chat:write</code></li>
                        <li>• <code className="bg-white px-1 rounded">channels:read</code></li>
                        <li>• <code className="bg-white px-1 rounded">commands</code></li>
                        <li>• <code className="bg-white px-1 rounded">users:read</code></li>
                      </ul>
                    </li>
                    <li>
                      <strong>OAuth Redirect URL:</strong> Add<br />
                      <code className="bg-white px-2 py-1 rounded text-xs block mt-1 break-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/api/slack/callback
                      </code>
                    </li>
                    <li>
                      <strong>Interactive Components:</strong> Enable with URL<br />
                      <code className="bg-white px-2 py-1 rounded text-xs block mt-1 break-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/api/slack/actions
                      </code>
                    </li>
                    <li>
                      <strong>Slash Commands:</strong> Create <code className="bg-white px-1 rounded">/pulse</code> with URL<br />
                      <code className="bg-white px-2 py-1 rounded text-xs block mt-1 break-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/api/slack/commands
                      </code>
                    </li>
                    <li>Copy the Client ID, Client Secret, and Signing Secret to your environment variables</li>
                  </ol>
                  <a
                    href="https://api.slack.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-sans mt-3 inline-flex items-center gap-1"
                  >
                    Open Slack API Dashboard
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-white text-[#37322F] border border-[rgba(55,50,47,0.20)] rounded-lg hover:bg-[#F7F5F3] transition-colors font-sans text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
            {!isConnected && (
              <button
                type="button"
                onClick={handleConnectSlack}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-[#4A154B] text-white rounded-lg hover:bg-[#3d1140] transition-colors font-sans text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  'Connecting...'
                ) : (
                  <>
                    <Slack className="w-4 h-4" />
                    Connect to Slack
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


