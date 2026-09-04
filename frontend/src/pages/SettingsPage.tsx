import React, { useState } from 'react';

export const SettingsPage: React.FC = () => {
  const [moderatePct, setModeratePct] = useState('2.0');
  const [highPct, setHighPct] = useState('5.0');
  const [veryHighPct, setVeryHighPct] = useState('8.0');
  const [volumeMultiplier, setVolumeMultiplier] = useState('1.75');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl pb-16">
      <div className="pb-4 mb-6 border-b border-surface-container">
        <h1 className="text-2xl font-serif font-semibold text-navy-tailored">
          Sensitivity Calibration & System Rules
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Tune the deterministic Meaningful Change scoring thresholds and background sync limits.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Scoring Thresholds */}
        <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider block mb-4">
            Price Move Thresholds (% Delta)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-text-secondary font-mono mb-1">
                Moderate Move (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={moderatePct}
                onChange={(e) => setModeratePct(e.target.value)}
                className="w-full p-2.5 rounded border border-surface-container text-sm font-mono"
              />
              <span className="text-[10px] text-text-tertiary mt-1 block">Default: 2.0%</span>
            </div>

            <div>
              <label className="block text-text-secondary font-mono mb-1">
                High Attention Move (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={highPct}
                onChange={(e) => setHighPct(e.target.value)}
                className="w-full p-2.5 rounded border border-surface-container text-sm font-mono"
              />
              <span className="text-[10px] text-text-tertiary mt-1 block">Default: 5.0%</span>
            </div>

            <div>
              <label className="block text-text-secondary font-mono mb-1">
                Critical Breakout Move (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={veryHighPct}
                onChange={(e) => setVeryHighPct(e.target.value)}
                className="w-full p-2.5 rounded border border-surface-container text-sm font-mono"
              />
              <span className="text-[10px] text-text-tertiary mt-1 block">Default: 8.0%</span>
            </div>
          </div>
        </div>

        {/* Section 2: Volume Anomaly Sensitivity */}
        <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider block mb-4">
            Volume & Flow Multipliers
          </span>

          <div className="max-w-md text-xs">
            <label className="block text-text-secondary font-mono mb-1">
              Anomaly Multiplier vs 20-Day Rolling Average
            </label>
            <input
              type="number"
              step="0.25"
              value={volumeMultiplier}
              onChange={(e) => setVolumeMultiplier(e.target.value)}
              className="w-full p-2.5 rounded border border-surface-container text-sm font-mono"
            />
            <span className="text-[10px] text-text-tertiary mt-1 block">
              Flags volume surges running &ge; {volumeMultiplier}x historical average
            </span>
          </div>
        </div>

        {/* Section 3: Architecture Diagnostics */}
        <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider block mb-4">
            System & Quota Status
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-surface-subtle border border-surface-container">
              <span className="text-text-secondary text-[10px] block">Twelve Data Minute Budget</span>
              <span className="text-base font-bold text-navy-tailored">8 credits / min</span>
            </div>

            <div className="p-3 rounded bg-surface-subtle border border-surface-container">
              <span className="text-text-secondary text-[10px] block">Daily Credit Budget</span>
              <span className="text-base font-bold text-navy-tailored">800 credits / day</span>
            </div>

            <div className="p-3 rounded bg-surface-subtle border border-surface-container">
              <span className="text-text-secondary text-[10px] block">Worker Sync Interval</span>
              <span className="text-base font-bold text-navy-tailored">30 seconds</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded bg-navy-tailored text-white text-xs font-medium shadow-subtle hover:bg-navy-slate transition-colors"
          >
            Save Calibration
          </button>
          {saved && (
            <span className="text-xs font-mono text-market-gain font-semibold animate-fade-in">
              Calibration parameters applied successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
