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
    <div className="flex flex-col w-full max-w-4xl pb-16 font-sans text-on-surface space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-surface-container-highest">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
            CALIBRATION & SENSITIVITY
          </span>
          <span className="text-on-surface-variant text-xs">•</span>
          <span className="text-[11px] font-mono text-on-surface-variant">
            Engine Rules
          </span>
        </div>
        <h1 className="font-sans text-2xl sm:text-3xl text-on-surface font-bold tracking-tight mt-1">
          Sensitivity Calibration & Parameters
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Tune the mathematical thresholds that trigger high attention scores, volume anomalies, and temporal drift alerts.
        </p>
      </div>

      <div className="space-y-5">
        {/* Section 1: Price Move Thresholds */}
        <div className="bg-surface-container-lowest p-6 border border-outline-variant space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold block">
            PRICE DELTA CLASSIFICATION (% THRESHOLDS)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-on-surface-variant mb-1">
                Moderate Delta (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={moderatePct}
                onChange={(e) => setModeratePct(e.target.value)}
                className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-secondary mt-1 block">Baseline: 2.0%</span>
            </div>

            <div>
              <label className="block text-on-surface-variant mb-1">
                High Attention Delta (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={highPct}
                onChange={(e) => setHighPct(e.target.value)}
                className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-secondary mt-1 block">Baseline: 5.0%</span>
            </div>

            <div>
              <label className="block text-on-surface-variant mb-1">
                Critical Breakout Delta (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={veryHighPct}
                onChange={(e) => setVeryHighPct(e.target.value)}
                className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-secondary mt-1 block">Baseline: 8.0%</span>
            </div>
          </div>
        </div>

        {/* Section 2: Volume Anomaly Multipliers */}
        <div className="bg-surface-container-lowest p-6 border border-outline-variant space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold block">
            VOLUME & FLOW MULTIPLIERS
          </span>

          <div className="max-w-md text-xs font-mono">
            <label className="block text-on-surface-variant mb-1">
              Anomaly Multiplier vs 20-Day Rolling Average
            </label>
            <input
              type="number"
              step="0.25"
              value={volumeMultiplier}
              onChange={(e) => setVolumeMultiplier(e.target.value)}
              className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
            />
            <span className="text-[10px] text-secondary mt-1.5 block font-sans">
              Flags volume surges running &ge; {volumeMultiplier}x historical baseline average.
            </span>
          </div>
        </div>

        {/* Section 3: Architecture Diagnostics */}
        <div className="bg-surface-container-lowest p-6 border border-outline-variant space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold block">
            ARCHITECTURE & DATA QUOTAS
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-surface-container-low border border-outline-variant">
              <span className="text-secondary text-[10px] block">Twelve Data Rate Limit</span>
              <span className="text-sm font-medium text-on-surface mt-0.5 block">8 credits / min</span>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant">
              <span className="text-secondary text-[10px] block">Daily Credit Budget</span>
              <span className="text-sm font-medium text-on-surface mt-0.5 block">800 credits / day</span>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant">
              <span className="text-secondary text-[10px] block">Worker Sync Interval</span>
              <span className="text-sm font-medium text-on-surface mt-0.5 block">Every 30 seconds</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 font-mono text-xs">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-medium transition-colors cursor-pointer"
          >
            Save Calibration
          </button>
          {saved && (
            <span className="text-market-gain font-semibold animate-fade-in">
              Calibration parameters applied successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
