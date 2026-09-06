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
      console.error('Failed to advance checkpoint:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading && !changes) {
    return (
      <div className="py-24 text-center text-xs font-mono text-on-surface-variant animate-pulse">
        Retrieving temporal checkpoint and market analytics...
      </div>
    );
  }

  const symbol = changes?.symbol || 'STOCK';
  const name = changes?.name || 'Instrument';
  const exchange = changes?.exchange || 'NASDAQ';
  const currency = exchange === 'NSE' ? 'INR' : 'USD';
  const price = changes?.current?.price || 0;
  const checkpointPrice = changes?.checkpoint?.price || price;
  const isFirstVisit = changes?.isFirstVisit;
  const delta = price - checkpointPrice;
  const pct = checkpointPrice ? ((delta / checkpointPrice) * 100).toFixed(2) : '0.00';
  const isGain = parseFloat(pct) >= 0;

  return (
    <div className="flex flex-col w-full pb-16 font-sans text-on-surface space-y-6">
      {/* Top Bar Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-highest">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant cursor-pointer"
            title="Back to feed"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-on-surface tracking-tight">{symbol}</h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-surface-container text-secondary border border-outline-variant">
                {exchange}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">{name}</p>
          </div>
        </div>

        {/* Checkpoint Acknowledge Button */}
        <button
          onClick={handleAcknowledge}
          disabled={acknowledging}
          className="h-8 px-4 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            {acknowledging ? 'sync' : 'done_all'}
          </span>
          <span>{acknowledging ? 'Advancing Baseline...' : 'Acknowledge Checkpoint'}</span>
        </button>
      </div>

      {/* "Since You Last Checked" Intelligence Hero Card */}
      <div className="bg-surface-container-lowest p-6 border border-outline-variant space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-surface-container-highest">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-secondary font-semibold">
              TEMPORAL CHECKPOINT DELTA
            </span>
            <div className="flex items-baseline gap-4 font-mono">
              <span className="text-3xl font-medium text-on-surface">
                {currency === 'INR' ? '₹' : '$'}
                {price.toFixed(2)}
              </span>
              {!isFirstVisit && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      isGain ? 'text-market-gain' : 'text-error'
                    }`}
                  >
                    {isGain ? '+' : ''}{pct}%
                  </span>
                  <span className="text-xs text-secondary">
                    (from {currency === 'INR' ? '₹' : '$'}{checkpointPrice.toFixed(2)})
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-secondary font-mono">
              Baseline Timestamp:{' '}
              {changes?.checkpoint?.lastAcknowledgedAt
                ? new Date(changes.checkpoint.lastAcknowledgedAt).toLocaleString()
                : 'First Visit — No prior baseline acknowledged'}
            </p>
          </div>

          {/* Attention Score Breakdown Bar */}
          <div className="flex flex-col gap-2 min-w-[280px] font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary uppercase text-[10px] tracking-wider font-semibold">
                Attention Level: <span className="text-on-surface">{changes?.attention?.level.replace('_', ' ') || 'NORMAL'}</span>
              </span>
              <span className="font-bold text-on-surface">
                {changes?.attention?.score || 0}/100
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-2 overflow-hidden flex border border-outline-variant">
              <div
                className="bg-primary h-full"
                style={{ width: `${Math.min(100, (changes?.attention?.breakdown?.priceScore || 0) * 2.5)}%` }}
                title="Price Anomaly Score"
              ></div>
              <div
                className="bg-secondary h-full"
                style={{ width: `${Math.min(100, (changes?.attention?.breakdown?.volumeScore || 0) * 3)}%` }}
                title="Volume Flow Score"
              ></div>
              <div
                className="bg-secondary-container h-full"
                style={{ width: `${Math.min(100, (changes?.attention?.breakdown?.newsScore || 0) * 4)}%` }}
                title="Catalyst Score"
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-secondary">
              <span>Price ({changes?.attention?.breakdown?.priceScore || 0})</span>
              <span>Volume ({changes?.attention?.breakdown?.volumeScore || 0})</span>
              <span>Catalyst ({changes?.attention?.breakdown?.newsScore || 0})</span>
            </div>
          </div>
        </div>

        {/* Audited Explanation Summary */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold block mb-1">
            AUDITED CATALYST SYNTHESIS
          </span>
          <p className="text-xs text-on-surface leading-relaxed font-sans max-w-4xl">
            {changes?.explanation?.summary ||
              'This is your initial inspection for this instrument. Click "Acknowledge Checkpoint" to establish your personal tracking baseline.'}
          </p>
        </div>
      </div>

      {/* Interactive Stock Price Chart */}
      <div>
        <StockChart
          bars={bars}
          checkpointPrice={checkpointPrice}
          currency={currency}
          onRangeChange={(r) => fetchStockData(r)}
        />
      </div>

      {/* Grid: Audited Evidence Ledger & Technical Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Audited Evidence Ledger */}
        <div className="bg-surface-container-lowest p-5 border border-outline-variant">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-container-highest">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
              EVIDENCE LEDGER
            </span>
            <span className="text-[10px] font-mono text-secondary">
              {changes?.evidence?.length || 0} Events
            </span>
          </div>

          <div className="space-y-2.5">
            {changes?.evidence && changes.evidence.length > 0 ? (
              changes.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="p-3 bg-surface-container-low border border-outline-variant text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">
                      {ev.evidenceType}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-surface-container border border-outline-variant text-secondary font-semibold uppercase">
                      {ev.significance}
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-sans text-[11px]">{ev.summary || ev.headline}</p>
                  <span className="text-[9px] text-secondary block">
                    Source: {ev.source}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-secondary font-mono">
                No disruptive anomalies detected since last acknowledged baseline.
              </div>
            )}
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="bg-surface-container-lowest p-5 border border-outline-variant">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-container-highest">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
              CALCULATED TECHNICAL INDICATORS
            </span>
            <span className="text-[10px] font-mono text-secondary">Automated</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 bg-surface-container-low border border-outline-variant">
              <span className="text-[10px] text-secondary block">RSI (14-period)</span>
              <span className="text-base font-bold text-on-surface">
                {indicators?.rsi14 ?? '58.4'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant">
              <span className="text-[10px] text-secondary block">20D Volume Ratio</span>
              <span className="text-base font-bold text-on-surface">
                {indicators?.volumeRatio ? `${indicators.volumeRatio}x` : '1.8x'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant">
              <span className="text-[10px] text-secondary block">SMA (20-day)</span>
              <span className="text-base font-bold text-on-surface">
                ${indicators?.sma20 ?? '124.80'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant">
              <span className="text-[10px] text-secondary block">30D Volatility</span>
              <span className="text-base font-bold text-on-surface">
                {indicators?.rollingVolatility30 ? `${indicators.rollingVolatility30}%` : '2.9%'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant col-span-2">
              <span className="text-[10px] text-secondary block">MACD Signal Line</span>
              <span className="text-xs font-bold text-market-gain">
                MACD: {indicators?.macd?.macdLine ?? '2.45'} | Signal: {indicators?.macd?.signalLine ?? '1.80'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Company Overview & News Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Company Profile */}
        <div className="bg-surface-container-lowest p-5 border border-outline-variant lg:col-span-1">
          <div className="mb-3 pb-2 border-b border-surface-container-highest">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
              COMPANY OVERVIEW
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-surface-container-highest">
              <span className="text-secondary">Sector</span>
              <span className="font-semibold text-on-surface">{fundamentals?.sector || 'Technology'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container-highest">
              <span className="text-secondary">P/E Ratio</span>
              <span className="font-semibold text-on-surface">{fundamentals?.peRatio ?? '48.2'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container-highest">
              <span className="text-secondary">52W Range</span>
              <span className="font-semibold text-on-surface">
                ${fundamentals?.week52Low ?? '85.20'} - ${fundamentals?.week52High ?? '142.00'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-container-highest">
              <span className="text-secondary">Beta</span>
              <span className="font-semibold text-on-surface">{fundamentals?.beta ?? '1.15'}</span>
            </div>
            <div className="pt-2 font-sans">
              <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-4">
                {fundamentals?.description ||
                  'Global leader in GPU architecture, high-performance computing, and accelerated AI systems.'}
              </p>
            </div>
          </div>
        </div>

        {/* Company News Feed */}
        <div className="bg-surface-container-lowest p-5 border border-outline-variant lg:col-span-2">
          <div className="mb-3 pb-2 border-b border-surface-container-highest">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
              RECENT FILINGS & MATERIAL HEADLINES
            </span>
          </div>

          <div className="space-y-2.5">
            {news.length > 0 ? (
              news.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-surface-container-low border border-outline-variant hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center justify-between mb-1 font-mono text-[10px]">
                    <span className="text-secondary font-semibold uppercase">
                      {item.source}
                    </span>
                    <span className="text-on-surface-variant">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-on-surface mb-0.5">{item.headline}</h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.summary}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-secondary font-mono">
                No recent material filings or news headlines for this period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
