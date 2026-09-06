import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { HistoricalBar } from '../types';

interface StockChartProps {
  bars: HistoricalBar[];
  checkpointPrice?: number;
  currency?: string;
  onRangeChange?: (range: string) => void;
}

export const StockChart: React.FC<StockChartProps> = ({
  bars,
  checkpointPrice,
  currency = 'USD',
  onRangeChange,
}) => {
  const [selectedRange, setSelectedRange] = useState('1M');

  const ranges = ['1D', '1W', '1M', '3M', '1Y'];

  const chartData = bars.map((b) => ({
    time: new Date(b.bucketTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    fullDate: new Date(b.bucketTime).toLocaleString(),
    price: b.close,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }));

  const prices = chartData.map((d) => d.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) * 0.98 : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.02 : 100;

  const handleRangeClick = (r: string) => {
    setSelectedRange(r);
    if (onRangeChange) onRangeChange(r);
  };

  const isPositive =
    prices.length >= 2 ? prices[prices.length - 1] >= prices[0] : true;
  const strokeColor = isPositive ? '#15803d' : '#ba1a1a';

  const lastPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
  const deltaFromCheckpoint =
    checkpointPrice && lastPrice
      ? Number((((lastPrice - checkpointPrice) / checkpointPrice) * 100).toFixed(2))
      : null;

  return (
    <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col font-sans">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-surface-container-highest">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-secondary font-semibold block">
            HISTORICAL TRAJECTORY & CHECKPOINT BASELINE
          </span>
          <div className="flex flex-wrap items-baseline gap-3 mt-1 font-mono">
            <span className="text-2xl font-medium text-on-surface">
              {currency === 'INR' ? '₹' : '$'}
              {lastPrice ? lastPrice.toFixed(2) : '--'}
            </span>

            {checkpointPrice && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-surface-container border border-outline-variant text-secondary">
                  Baseline: {currency === 'INR' ? '₹' : '$'}
                  {checkpointPrice.toFixed(2)}
                </span>
                {deltaFromCheckpoint !== null && (
                  <span
                    className={`font-semibold ${
                      deltaFromCheckpoint >= 0 ? 'text-market-gain' : 'text-error'
                    }`}
                  >
                    ({deltaFromCheckpoint >= 0 ? '+' : ''}
                    {deltaFromCheckpoint}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center border border-outline-variant bg-surface-container-lowest font-mono text-xs">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => handleRangeClick(r)}
              className={`px-3 py-1 transition-all cursor-pointer ${
                selectedRange === r
                  ? 'bg-primary text-on-primary font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-80 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e8eef6" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#76777d"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#dde3eb' }}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                stroke="#76777d"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono, monospace"
                tickFormatter={(val) => `${currency === 'INR' ? '₹' : '$'}${val.toFixed(0)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-primary text-on-primary p-3 border border-outline-variant text-xs font-mono space-y-1">
                        <p className="text-[10px] text-on-primary-container">{data.fullDate}</p>
                        <p className="text-sm font-bold text-on-primary">
                          Close: {currency === 'INR' ? '₹' : '$'}
                          {data.close.toFixed(2)}
                        </p>
                        <div className="text-[11px] text-on-primary-container space-y-0.5 pt-1.5 border-t border-primary-container">
                          <p>Open: {currency === 'INR' ? '₹' : '$'}{data.open.toFixed(2)}</p>
                          <p>High: {currency === 'INR' ? '₹' : '$'}{data.high.toFixed(2)}</p>
                          <p>Low: {currency === 'INR' ? '₹' : '$'}{data.low.toFixed(2)}</p>
                          <p>Volume: {(data.volume / 1000000).toFixed(2)}M</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {checkpointPrice && (
                <ReferenceLine
                  y={checkpointPrice}
                  stroke="#505f76"
                  strokeDasharray="4 4"
                  label={{
                    value: `Baseline (${currency === 'INR' ? '₹' : '$'}${checkpointPrice})`,
                    fill: '#505f76',
                    fontSize: 10,
                    position: 'insideTopRight',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-secondary text-xs font-mono">
            Loading historical OHLCV data...
          </div>
        )}
      </div>
    </div>
  );
};
