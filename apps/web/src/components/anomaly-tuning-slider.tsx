'use client';

import { useState } from 'react';
import { SaturnButton } from './saturn';
import { Info } from 'lucide-react';

interface AnomalyTuningSliderProps {
  monitorId: string;
  initialValues?: {
    zScoreThreshold?: number;
    medianMultiplier?: number;
    outputDropFraction?: number;
  };
  onSave?: () => void;
}

export function AnomalyTuningSlider({
  monitorId,
  initialValues = {},
  onSave,
}: AnomalyTuningSliderProps) {
  const [zScoreThreshold, setZScoreThreshold] = useState(
    initialValues.zScoreThreshold ?? 3.0
  );
  const [medianMultiplier, setMedianMultiplier] = useState(
    initialValues.medianMultiplier ?? 5.0
  );
  const [outputDropFraction, setOutputDropFraction] = useState(
    initialValues.outputDropFraction ?? 0.5
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`/api/monitors/${monitorId}/anomaly`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomalyZScoreThreshold: zScoreThreshold,
          anomalyMedianMultiplier: medianMultiplier,
          anomalyOutputDropFraction: outputDropFraction,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update anomaly settings');
      }

      setSuccess(true);
      onSave?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setZScoreThreshold(3.0);
    setMedianMultiplier(5.0);
    setOutputDropFraction(0.5);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Z-Score Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#37322F] flex items-center gap-2">
              Z-Score Threshold
              <div className="group relative">
                <Info className="w-4 h-4 text-[rgba(55,50,47,0.40)] cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-[#37322F] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Number of standard deviations from the mean to consider anomalous. Lower = more sensitive.
                </div>
              </div>
            </label>
            <span className="text-sm font-mono text-[rgba(55,50,47,0.60)]">
              {zScoreThreshold.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={zScoreThreshold}
            onChange={(e) => setZScoreThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-[rgba(55,50,47,0.12)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#37322F]"
          />
          <div className="flex justify-between text-xs text-[rgba(55,50,47,0.60)] font-sans">
            <span>More sensitive (1.0)</span>
            <span>Less sensitive (5.0)</span>
          </div>
        </div>

        {/* Median Multiplier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#37322F] flex items-center gap-2">
              Median Multiplier
              <div className="group relative">
                <Info className="w-4 h-4 text-[rgba(55,50,47,0.40)] cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-[#37322F] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Multiplier for median-based anomaly detection. Higher values = less sensitive.
                </div>
              </div>
            </label>
            <span className="text-sm font-mono text-[rgba(55,50,47,0.60)]">
              {medianMultiplier.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="2.0"
            max="10.0"
            step="0.5"
            value={medianMultiplier}
            onChange={(e) => setMedianMultiplier(parseFloat(e.target.value))}
            className="w-full h-2 bg-[rgba(55,50,47,0.12)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#37322F]"
          />
          <div className="flex justify-between text-xs text-[rgba(55,50,47,0.60)] font-sans">
            <span>More sensitive (2.0)</span>
            <span>Less sensitive (10.0)</span>
          </div>
        </div>

        {/* Output Drop Fraction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#37322F] flex items-center gap-2">
              Output Drop Threshold
              <div className="group relative">
                <Info className="w-4 h-4 text-[rgba(55,50,47,0.40)] cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-[#37322F] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Fraction of output drop to trigger an anomaly alert. 0.5 = 50% drop.
                </div>
              </div>
            </label>
            <span className="text-sm font-mono text-[rgba(55,50,47,0.60)]">
              {(outputDropFraction * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={outputDropFraction}
            onChange={(e) => setOutputDropFraction(parseFloat(e.target.value))}
            className="w-full h-2 bg-[rgba(55,50,47,0.12)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#37322F]"
          />
          <div className="flex justify-between text-xs text-[rgba(55,50,47,0.60)] font-sans">
            <span>More sensitive (10%)</span>
            <span>Less sensitive (90%)</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgba(55,50,47,0.12)]">
        <SaturnButton
          variant="secondary"
          onClick={handleReset}
          disabled={saving}
        >
          Reset to Defaults
        </SaturnButton>

        <SaturnButton
          onClick={handleSave}
          loading={saving}
        >
          Save Settings
        </SaturnButton>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-sans">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-sans">
            Anomaly settings saved successfully!
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-[rgba(55,50,47,0.04)] rounded-lg border border-[rgba(55,50,47,0.08)]">
        <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
          <strong>Note:</strong> These settings override the global anomaly detection thresholds for this monitor only. 
          Adjusting these values affects how sensitive the anomaly detector is to unusual patterns in your monitor's output.
        </p>
      </div>
    </div>
  );
}

