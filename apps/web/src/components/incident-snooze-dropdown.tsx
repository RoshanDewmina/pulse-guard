'use client';

import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { SaturnButton } from './saturn';

interface IncidentSnoozeDropdownProps {
  incidentId: string;
  currentlySnoozed?: boolean;
  snoozedUntil?: Date | null;
  onSnooze?: () => void;
}

export function IncidentSnoozeDropdown({
  incidentId,
  currentlySnoozed = false,
  snoozedUntil,
  onSnooze,
}: IncidentSnoozeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [snoozing, setSnoozing] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('60');

  const snoozeOptions = [
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '4 hours', minutes: 240 },
    { label: '24 hours', minutes: 1440 },
  ];

  const handleSnooze = async (minutes: number) => {
    try {
      setSnoozing(true);
      setIsOpen(false);

      const response = await fetch(`/api/incidents/${incidentId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });

      if (!response.ok) {
        throw new Error('Failed to snooze incident');
      }

      onSnooze?.();
    } catch (error) {
      console.error('Snooze error:', error);
      alert('Failed to snooze incident. Please try again.');
    } finally {
      setSnoozing(false);
    }
  };

  const handleCustomSnooze = async () => {
    const minutes = parseInt(customMinutes, 10);
    if (isNaN(minutes) || minutes < 1) {
      alert('Please enter a valid number of minutes');
      return;
    }
    await handleSnooze(minutes);
    setShowCustom(false);
    setCustomMinutes('60');
  };

  const formatSnoozedUntil = () => {
    if (!snoozedUntil) return '';
    const date = new Date(snoozedUntil);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h`;
    } else {
      return `${Math.floor(diffMins / 1440)}d`;
    }
  };

  return (
    <div className="relative inline-block">
      <SaturnButton
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={snoozing}
        className="flex items-center gap-2"
      >
        <Clock className="w-4 h-4" />
        {currentlySnoozed ? `Snoozed (${formatSnoozedUntil()})` : 'Snooze'}
        <ChevronDown className="w-4 h-4" />
      </SaturnButton>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[rgba(55,50,47,0.16)] z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-[rgba(55,50,47,0.60)] px-2 py-1 font-sans">
                Suppress alerts for:
              </div>

              {snoozeOptions.map((option) => (
                <button
                  key={option.minutes}
                  onClick={() => handleSnooze(option.minutes)}
                  className="w-full text-left px-3 py-2 rounded text-sm hover:bg-[rgba(55,50,47,0.04)] transition-colors font-sans"
                >
                  {option.label}
                </button>
              ))}

              <div className="border-t border-[rgba(55,50,47,0.12)] my-1" />

              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full text-left px-3 py-2 rounded text-sm hover:bg-[rgba(55,50,47,0.04)] transition-colors font-sans text-[#37322F]"
                >
                  Custom duration...
                </button>
              ) : (
                <div className="p-2 space-y-2">
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Minutes"
                    min="1"
                    className="w-full px-2 py-1 border border-[rgba(55,50,47,0.16)] rounded text-sm font-sans"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleCustomSnooze}
                      className="flex-1 px-2 py-1 bg-[#37322F] text-white rounded text-xs hover:bg-[#2A2724] transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        setShowCustom(false);
                        setCustomMinutes('60');
                      }}
                      className="flex-1 px-2 py-1 bg-[rgba(55,50,47,0.08)] text-[#37322F] rounded text-xs hover:bg-[rgba(55,50,47,0.12)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {currentlySnoozed && (
              <>
                <div className="border-t border-[rgba(55,50,47,0.12)]" />
                <div className="p-2">
                  <button
                    onClick={() => handleSnooze(0)}
                    className="w-full text-left px-3 py-2 rounded text-sm hover:bg-red-50 transition-colors font-sans text-red-600"
                  >
                    Un-snooze (resume alerts)
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

