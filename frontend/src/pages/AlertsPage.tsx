import React, { useState, useEffect } from 'react';
import { Alert, Instrument } from '../types';
import { api } from '../services/api';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertType, setAlertType] = useState<'PERCENT_MOVE' | 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_ANOMALY' | 'MEANINGFUL_CHANGE'>('PERCENT_MOVE');
  const [targetValue, setTargetValue] = useState('5.0');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Instrument[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts();
      setAlerts(res.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api.searchStocks(q.trim());
      setSearchResults(data.instruments || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleToggle = async (alert: Alert) => {
    try {
      await api.updateAlert(alert.id, { enabled: !alert.enabled });
      await fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await api.deleteAlert(alertId);
      await fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedInstrument || !targetValue) return;
    setSaving(true);
    try {
      await api.createAlert(
        selectedInstrument.id,
        alertType,
        parseFloat(targetValue)
      );
      setShowCreateModal(false);
      setSelectedInstrument(null);
      setSearchQuery('');
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to create alert:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16 font-sans text-on-surface space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-surface-container-highest">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
              ASYNCHRONOUS EVALUATION
            </span>
            <span className="text-on-surface-variant text-xs">•</span>
            <span className="text-[11px] font-mono text-on-surface-variant">
              Worker Loop Monitored
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl text-on-surface font-bold tracking-tight mt-1">
            Alert Rules & Triggers
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Configure automated triggers evaluated on live price and volume ticks.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            handleSearch('NVDA');
          }}
          className="h-8 px-4 bg-primary hover:bg-primary-container text-on-primary text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add_alert</span>
          <span>New Alert Rule</span>
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-surface-container-lowest border border-outline-variant">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-secondary animate-pulse">
            Loading active alert configurations...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-10 h-10 border border-outline-variant bg-surface-container-low mx-auto flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">notifications_off</span>
            </div>
            <h3 className="font-sans text-base text-on-surface font-semibold">No active alert rules</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Set up price or volume breakout conditions to be notified when market anomalies occur.
            </p>
            <button
              onClick={() => {
                setShowCreateModal(true);
                handleSearch('NVDA');
              }}
              className="px-5 py-2.5 bg-primary text-on-primary text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Create Rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-primary bg-surface-container-low text-secondary font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-4 font-semibold">Instrument</th>
                  <th className="py-2.5 px-4 font-semibold">Condition Type</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Target Threshold</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Monitoring State</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest font-mono">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-xs">
                          {alert.instrument?.symbol || 'STOCK'}
                        </span>
                        <span className="text-[9px] uppercase px-1 bg-surface-container text-secondary border border-outline-variant">
                          {alert.instrument?.exchange || 'NASDAQ'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-surface-container text-secondary text-[11px] border border-outline-variant">
                        {alert.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-on-surface">
                      {alert.type === 'PERCENT_MOVE'
                        ? `±${alert.targetValue}%`
                        : alert.type === 'VOLUME_ANOMALY'
                        ? `${alert.targetValue}x AVG`
                        : `$${alert.targetValue.toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {alert.isTriggered ? (
                        <span className="px-2 py-0.5 bg-error-container text-error text-[10px] font-bold">
                          TRIGGERED
                        </span>
                      ) : alert.enabled ? (
                        <span className="px-2 py-0.5 bg-surface-container-high border border-outline-variant text-on-surface text-[10px] font-semibold">
                          MONITORING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-surface-container text-secondary text-[10px]">
                          PAUSED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleToggle(alert)}
                        className="px-2.5 py-0.5 bg-surface-container-low hover:bg-surface-container text-[11px] text-on-surface-variant hover:text-on-surface border border-outline-variant cursor-pointer"
                      >
                        {alert.enabled ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-1 hover:bg-error-container text-secondary hover:text-error transition-colors cursor-pointer"
                        title="Delete rule"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for creating Alert */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest p-6 border border-outline-variant font-mono">
            <h3 className="text-sm font-bold text-on-surface mb-1 uppercase">
              CONFIGURE ALERT RULE
            </h3>
            <p className="text-xs text-on-surface-variant font-sans mb-4">
              Alerts are evaluated in real-time by the background worker.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Select Instrument */}
              <div>
                <label className="block text-secondary mb-1">Select Instrument</label>
                {selectedInstrument ? (
                  <div className="flex items-center justify-between p-2 bg-surface-container-low border border-primary">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">{selectedInstrument.symbol}</span>
                      <span className="text-secondary text-[11px]">({selectedInstrument.name})</span>
                    </div>
                    <button
                      onClick={() => setSelectedInstrument(null)}
                      className="text-secondary hover:text-on-surface text-xs"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Type symbol (e.g. NVDA, AAPL)..."
                      className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-1 max-h-32 overflow-y-auto bg-surface-container-low border border-outline-variant divide-y divide-surface-container-highest">
                        {searchResults.map((inst) => (
                          <div
                            key={inst.id}
                            onClick={() => setSelectedInstrument(inst)}
                            className="p-2 hover:bg-surface-container cursor-pointer flex justify-between items-center text-[11px]"
                          >
                            <span className="font-bold text-on-surface">{inst.symbol}</span>
                            <span className="text-secondary">{inst.exchange}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="block text-secondary mb-1">Alert Condition</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as unknown as typeof alertType)}
                  className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
                >
                  <option value="PERCENT_MOVE">Percent Move (%)</option>
                  <option value="PRICE_ABOVE">Price Above ($)</option>
                  <option value="PRICE_BELOW">Price Below ($)</option>
                  <option value="VOLUME_ANOMALY">Volume Anomaly (x avg)</option>
                  <option value="MEANINGFUL_CHANGE">Meaningful Change Score</option>
                </select>
              </div>

              {/* Threshold */}
              <div>
                <label className="block text-secondary mb-1">Target Threshold</label>
                <input
                  type="number"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 text-xs">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                disabled={!selectedInstrument || saving}
                className="px-4 py-1.5 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary font-medium cursor-pointer"
              >
                {saving ? 'Creating...' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
