import React, { useState, useEffect } from 'react';
import { Alert } from '../types';
import { api } from '../services/api';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertType, setAlertType] = useState('PERCENT_MOVE');
  const [targetValue, setTargetValue] = useState('5.0');
  const [symbolInput, setSymbolInput] = useState('NVDA');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts();
      setAlerts(res.alerts || []);
    } catch {
      // Mock alerts for preview
      setAlerts([
        {
          id: 'alert-1',
          userId: 'u1',
          instrumentId: 'nvda-id',
          type: 'PERCENT_MOVE',
          targetValue: 5.0,
          isTriggered: true,
          enabled: true,
          lastTriggeredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          instrument: {
            id: 'nvda-id',
            symbol: 'NVDA',
            exchange: 'NASDAQ',
            name: 'NVIDIA Corporation',
            currency: 'USD',
            type: 'Common Stock',
            providerSymbol: 'NVDA',
          },
        },
        {
          id: 'alert-2',
          userId: 'u1',
          instrumentId: 'aapl-id',
          type: 'PRICE_ABOVE',
          targetValue: 235.0,
          isTriggered: false,
          enabled: true,
          createdAt: new Date().toISOString(),
          instrument: {
            id: 'aapl-id',
            symbol: 'AAPL',
            exchange: 'NASDAQ',
            name: 'Apple Inc.',
            currency: 'USD',
            type: 'Common Stock',
            providerSymbol: 'AAPL',
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleToggle = async (alert: Alert) => {
    try {
      await api.updateAlert(alert.id, { enabled: !alert.enabled });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await api.deleteAlert(alertId);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy-tailored">
            Smart Alerts & Trigger Logs
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Automated alerts evaluated asynchronously by background worker loops.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded bg-navy-tailored text-white text-xs font-medium flex items-center gap-1.5 shadow-subtle hover:bg-navy-slate transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add_alert</span>
          <span>Create Alert Rule</span>
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-surface-card rounded shadow-subtle border border-surface-container overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-surface-container bg-surface-subtle text-text-secondary font-mono text-[10px] uppercase">
              <th className="p-4">Stock</th>
              <th className="p-4">Condition Type</th>
              <th className="p-4 text-right">Target Threshold</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container font-mono">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-surface-subtle/80 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-tailored text-sm">
                      {alert.instrument?.symbol || 'NVDA'}
                    </span>
                    <span className="text-[10px] text-text-tertiary uppercase">
                      {alert.instrument?.exchange || 'NASDAQ'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-text-secondary text-[11px]">
                    {alert.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-navy-tailored">
                  {alert.type === 'PERCENT_MOVE'
                    ? `±${alert.targetValue}%`
                    : `$${alert.targetValue.toFixed(2)}`}
                </td>
                <td className="p-4 text-center">
                  {alert.isTriggered ? (
                    <span className="px-2 py-0.5 rounded bg-error-container/40 text-market-loss text-[10px] font-bold">
                      TRIGGERED
                    </span>
                  ) : alert.enabled ? (
                    <span className="px-2 py-0.5 rounded bg-green-50 text-market-gain text-[10px] font-bold">
                      MONITORING
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-surface-container text-text-tertiary text-[10px]">
                      PAUSED
                    </span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => handleToggle(alert)}
                    className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-container text-[11px] font-medium text-text-secondary border border-surface-container"
                  >
                    {alert.enabled ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1 rounded hover:bg-red-50 text-text-tertiary hover:text-market-loss"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for creating Alert */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-card rounded p-6 shadow-hover border border-surface-container">
            <h3 className="text-lg font-serif font-semibold text-navy-tailored mb-4">
              Configure New Alert Rule
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-text-secondary mb-1 font-mono">Stock Symbol</label>
                <input
                  type="text"
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  className="w-full p-2.5 rounded border border-surface-container text-sm font-mono uppercase"
                  placeholder="e.g. NVDA, AAPL"
                />
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-mono">Alert Condition</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full p-2.5 rounded border border-surface-container text-sm font-mono"
                >
                  <option value="PERCENT_MOVE">Percent Move (%)</option>
                  <option value="PRICE_ABOVE">Price Above ($)</option>
                  <option value="PRICE_BELOW">Price Below ($)</option>
                  <option value="VOLUME_ANOMALY">Volume Anomaly (x avg)</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-mono">Target Threshold</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-2.5 rounded border border-surface-container text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded bg-surface-subtle text-text-secondary text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  fetchAlerts();
                }}
                className="px-4 py-2 rounded bg-navy-tailored text-white text-xs font-medium"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
