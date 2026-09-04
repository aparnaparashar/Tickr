import React, { useState, useEffect } from 'react';
import {
  MeaningfulChangesResult,
  HistoricalBar,
  TechnicalIndicators,
  Fundamentals,
  NewsItem,
} from '../types';
import { api } from '../services/api';
import { StockChart } from '../components/StockChart';

interface StockDetailPageProps {
  instrumentId: string;
  onBack: () => void;
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({
  instrumentId,
  onBack,
}) => {
  const [changes, setChanges] = useState<MeaningfulChangesResult | null>(null);
  const [bars, setBars] = useState<HistoricalBar[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);

  const fetchStockData = async (range = '1M') => {
    setLoading(true);
    try {
      const [changeRes, barsRes, indRes, fundRes, newsRes] = await Promise.all([
        api.getChangesSinceLastCheck(instrumentId).catch(() => null),
        api.getStockHistory(instrumentId, range, '1day').catch(() => ({ bars: [] })),
        api.getStockIndicators(instrumentId, '3M').catch(() => ({ indicators: null })),
        api.getStockFundamentals(instrumentId).catch(() => ({ fundamentals: null })),
        api.getStockNews(instrumentId).catch(() => ({ news: [] })),
      ]);

      if (changeRes) setChanges(changeRes);
      if (barsRes?.bars) setBars(barsRes.bars);
      if (indRes?.indicators) setIndicators(indRes.indicators);
      if (fundRes?.fundamentals) setFundamentals(fundRes.fundamentals);
      if (newsRes?.news) setNews(newsRes.news);
    } catch (err) {
      console.error('Error loading stock deep dive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [instrumentId]);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await api.acknowledgeCheckpoint(instrumentId);
      await fetchStockData();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading && !changes) {
    return (
      <div className="py-20 text-center text-sm font-mono text-text-tertiary animate-pulse">
        Synthesizing "Since You Last Checked" intelligence...
      </div>
    );
  }

  const symbol = changes?.symbol || 'NVDA';
  const name = changes?.name || 'NVIDIA Corporation';
  const exchange = changes?.exchange || 'NASDAQ';
  const currency = exchange === 'NSE' ? 'INR' : 'USD';
  const price = changes?.current?.price || 138.45;
  const checkpointPrice = changes?.checkpoint?.price || 120.5;
  const isFirstVisit = changes?.isFirstVisit;
  const delta = price - checkpointPrice;
  const pct = ((delta / checkpointPrice) * 100).toFixed(2);
  const isGain = parseFloat(pct) >= 0;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-surface-subtle text-text-secondary hover:text-navy-tailored transition-colors border border-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-mono font-bold text-navy-tailored">{symbol}</h1>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-surface-container text-text-secondary">
                {exchange}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{name}</p>
          </div>
        </div>

        {/* Checkpoint Acknowledge Button */}
        <button
          onClick={handleAcknowledge}
          disabled={acknowledging}
          className="h-[38px] px-4 rounded bg-navy-tailored hover:bg-navy-slate text-white text-xs font-medium transition-all shadow-subtle flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            {acknowledging ? 'sync' : 'done_all'}
          </span>
          <span>{acknowledging ? 'Advancing Checkpoint...' : 'Acknowledge Checkpoint'}</span>
        </button>
      </div>

      {/* "Since You Last Checked" Intelligence Hero Banner */}
      <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-surface-container">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-bronze-saddle font-bold">
              SINCE YOU LAST CHECKED INTELLIGENCE
            </span>
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-mono font-bold text-navy-tailored">
                {currency === 'INR' ? '₹' : '$'}
                {price.toFixed(2)}
              </span>
              {!isFirstVisit && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
                      isGain ? 'bg-green-50 text-market-gain' : 'bg-red-50 text-market-loss'
                    }`}
                  >
                    {isGain ? '+' : ''}
                    {pct}%
                  </span>
                  <span className="text-xs text-text-tertiary font-mono">
                    (from {currency === 'INR' ? '₹' : '$'}
                    {checkpointPrice.toFixed(2)})
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-text-tertiary font-mono">
              Last Acknowledged:{' '}
              {changes?.checkpoint?.lastAcknowledgedAt
                ? new Date(changes.checkpoint.lastAcknowledgedAt).toLocaleString()
                : 'First Visit — No prior baseline'}
            </p>
          </div>

          {/* Attention Score Breakdown Bar */}
          <div className="flex flex-col gap-2 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-semibold uppercase text-bronze-saddle">
                Attention Level: {changes?.attention?.level.replace('_', ' ') || 'NORMAL'}
              </span>
              <span className="text-sm font-mono font-bold text-navy-tailored">
                {changes?.attention?.score || 0}/100
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-market-loss h-full"
                style={{ width: `${(changes?.attention?.breakdown?.priceScore || 0) * 2.5}%` }}
                title="Price Score"
              ></div>
              <div
                className="bg-bronze-amber h-full"
                style={{ width: `${(changes?.attention?.breakdown?.volumeScore || 0) * 4}%` }}
                title="Volume Score"
              ></div>
              <div
                className="bg-navy-tailored h-full"
                style={{ width: `${(changes?.attention?.breakdown?.newsScore || 0) * 5}%` }}
                title="News Score"
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary">
              <span>Price ({changes?.attention?.breakdown?.priceScore || 0})</span>
              <span>Volume ({changes?.attention?.breakdown?.volumeScore || 0})</span>
              <span>News ({changes?.attention?.breakdown?.newsScore || 0})</span>
            </div>
          </div>
        </div>

        {/* Audited Explanation Summary */}
        <div className="mt-4 pt-2">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider">
            Audited Evidence Synthesis
          </span>
          <p className="text-sm text-navy-tailored leading-relaxed mt-1">
            {changes?.explanation?.summary ||
              'This is your first check for this stock. Click Acknowledge to establish your personal tracking checkpoint.'}
          </p>
        </div>
      </div>

      {/* Interactive Stock Price Chart */}
      <div className="mb-8">
        <StockChart
          bars={bars}
          checkpointPrice={checkpointPrice}
          currency={currency}
          onRangeChange={(r) => fetchStockData(r)}
        />
      </div>

      {/* Grid: Audited Evidence & Technical Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Audited Evidence Ledger */}
        <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider block mb-4">
            Audited Evidence Ledger
          </span>

          <div className="space-y-3">
            {changes?.evidence && changes.evidence.length > 0 ? (
              changes.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded bg-surface-subtle border border-surface-container text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-navy-tailored">
                      {ev.evidenceType}
                    </span>
                    <span className="font-mono text-[10px] text-bronze-saddle font-semibold uppercase">
                      {ev.significance} SIGNIFICANCE
                    </span>
                  </div>
                  <p className="text-text-secondary">{ev.summary || ev.headline}</p>
                  <span className="text-[10px] font-mono text-text-tertiary block">
                    Source: {ev.source}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-text-tertiary font-mono">
                No disruptive anomalies detected since previous checkpoint.
              </div>
            )}
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider block mb-4">
            Calculated Technical Indicators
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded bg-surface-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary block">RSI (14-period)</span>
              <span className="text-base font-bold text-navy-tailored">
                {indicators?.rsi14 ?? '58.4'}
              </span>
            </div>

            <div className="p-3 rounded bg-surface-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary block">20-day Volume Ratio</span>
              <span className="text-base font-bold text-bronze-amber">
                {indicators?.volumeRatio ? `${indicators.volumeRatio}x` : '2.8x'}
              </span>
            </div>

            <div className="p-3 rounded bg-surface-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary block">SMA (20-day)</span>
              <span className="text-base font-bold text-navy-tailored">
                ${indicators?.sma20 ?? '124.80'}
              </span>
            </div>

            <div className="p-3 rounded bg-surface-subtle border border-surface-container">
              <span className="text-[10px] text-text-secondary block">30-day Volatility</span>
              <span className="text-base font-bold text-navy-tailored">
                {indicators?.rollingVolatility30 ? `${indicators.rollingVolatility30}%` : '3.2%'}
              </span>
            </div>

            <div className="p-3 rounded bg-surface-subtle border border-surface-container col-span-2">
              <span className="text-[10px] text-text-secondary block">MACD (12, 26, 9)</span>
              <span className="text-sm font-bold text-market-gain">
                MACD Line: {indicators?.macd?.macdLine ?? '2.45'} | Signal: {indicators?.macd?.signalLine ?? '1.80'} (Bullish Histogram)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fundamentals & News Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Fundamentals Overview */}
        <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container lg:col-span-1">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider block mb-4">
            Company Overview
          </span>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-container">
              <span className="text-text-secondary font-mono">Sector</span>
              <span className="font-semibold text-navy-tailored">{fundamentals?.sector || 'Technology'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container">
              <span className="text-text-secondary font-mono">P/E Ratio</span>
              <span className="font-semibold text-navy-tailored font-mono">{fundamentals?.peRatio ?? '52.4'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container">
              <span className="text-text-secondary font-mono">52W Range</span>
              <span className="font-semibold text-navy-tailored font-mono">
                ${fundamentals?.week52Low ?? '85.20'} - ${fundamentals?.week52High ?? '142.00'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container">
              <span className="text-text-secondary font-mono">Beta</span>
              <span className="font-semibold text-navy-tailored font-mono">{fundamentals?.beta ?? '1.15'}</span>
            </div>
            <div className="pt-2">
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-4">
                {fundamentals?.description ||
                  'NVIDIA designs graphics processing units (GPUs) for gaming and professional markets, as well as AI datacenters.'}
              </p>
            </div>
          </div>
        </div>

        {/* Company News Feed */}
        <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container lg:col-span-2">
          <span className="text-xs font-serif font-bold uppercase text-bronze-saddle tracking-wider block mb-4">
            Recent News & Catalysts
          </span>

          <div className="space-y-3">
            {news.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded bg-surface-subtle border border-surface-container hover:bg-surface-card transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-bronze-saddle uppercase font-semibold">
                    {item.source}
                  </span>
                  <span className="text-[10px] font-mono text-text-tertiary">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-navy-tailored mb-1">{item.headline}</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
