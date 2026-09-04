import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
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
  const strokeColor = isPositive ? '#15803D' : '#991B1B';

  return (
    <div className="bg-surface-card rounded p-6 shadow-subtle border border-surface-container flex flex-col">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-2 border-b border-surface-container">
        <div>
          <span className="text-xs uppercase font-serif text-bronze-saddle font-semibold tracking-wider">
            Price Trajectory & Checkpoint Comparison
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-mono font-bold text-navy-tailored">
              {currency === 'INR' ? '₹' : '$'}
              {prices.length > 0 ? prices[prices.length - 1].toFixed(2) : '--'}
            </span>
            {checkpointPrice && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle text-text-secondary border border-surface-container">
                Checkpoint: {currency === 'INR' ? '₹' : '$'}
                {checkpointPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded border border-surface-container">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => handleRangeClick(r)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all ${
                selectedRange === r
                  ? 'bg-navy-tailored text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#8A94A6"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E4EB' }}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                stroke="#8A94A6"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${currency === 'INR' ? '₹' : '$'}${val.toFixed(0)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-navy-tailored text-white p-3 rounded shadow-lg text-xs font-mono space-y-1">
                        <p className="text-[10px] text-text-tertiary">{data.fullDate}</p>
                        <p className="text-sm font-bold text-market-gain">
                          Close: {currency === 'INR' ? '₹' : '$'}
                          {data.close.toFixed(2)}
                        </p>
                        <div className="text-[10px] text-gray-300 space-y-0.5 pt-1 border-t border-gray-700">
                          <p>High: ${data.high.toFixed(2)}</p>
                          <p>Low: ${data.low.toFixed(2)}</p>
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
                  stroke="#78350F"
                  strokeDasharray="4 4"
                  label={{
                    value: `Checkpoint (${currency === 'INR' ? '₹' : '$'}${checkpointPrice})`,
                    fill: '#78350F',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-text-tertiary text-sm font-mono">
            Loading chart bars...
          </div>
        )}
      </div>
    </div>
  );
};
