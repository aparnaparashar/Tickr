import { NormalizedBar, TechnicalIndicators } from '../../shared/types/index.js';

export class IndicatorsService {
  /**
   * Simple Moving Average (SMA)
   */
  static calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const slice = prices.slice(prices.length - period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return Number((sum / period).toFixed(2));
  }

  /**
   * Exponential Moving Average (EMA)
   */
  static calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    // Seed with SMA
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return Number(ema.toFixed(2));
  }

  /**
   * Relative Strength Index (RSI - 14)
   */
  static calculateRSI(prices: number[], period = 14): number | null {
    if (prices.length <= period) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return Number(rsi.toFixed(2));
  }

  /**
   * Moving Average Convergence Divergence (MACD 12, 26, 9)
   */
  static calculateMACD(
    prices: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ): { macdLine: number; signalLine: number; histogram: number } | null {
    if (prices.length < slowPeriod + signalPeriod) return null;

    const macdValues: number[] = [];
    const kFast = 2 / (fastPeriod + 1);
    const kSlow = 2 / (slowPeriod + 1);

    let fastEMA = prices.slice(0, fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
    let slowEMA = prices.slice(0, slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;

    for (let i = fastPeriod; i < slowPeriod; i++) {
      fastEMA = prices[i] * kFast + fastEMA * (1 - kFast);
    }

    for (let i = slowPeriod; i < prices.length; i++) {
      fastEMA = prices[i] * kFast + fastEMA * (1 - kFast);
      slowEMA = prices[i] * kSlow + slowEMA * (1 - kSlow);
      macdValues.push(fastEMA - slowEMA);
    }

    if (macdValues.length < signalPeriod) return null;

    const kSignal = 2 / (signalPeriod + 1);
    let signalLine =
      macdValues.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;

    for (let i = signalPeriod; i < macdValues.length; i++) {
      signalLine = macdValues[i] * kSignal + signalLine * (1 - kSignal);
    }

    const latestMACD = macdValues[macdValues.length - 1];
    const histogram = latestMACD - signalLine;

    return {
      macdLine: Number(latestMACD.toFixed(2)),
      signalLine: Number(signalLine.toFixed(2)),
      histogram: Number(histogram.toFixed(2)),
    };
  }

  /**
   * Bollinger Bands (20, 2)
   */
  static calculateBollingerBands(
    prices: number[],
    period = 20,
    multiplier = 2
  ): { upper: number; middle: number; lower: number; bandwidth: number } | null {
    if (prices.length < period) return null;
    const slice = prices.slice(prices.length - period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;

    const variance = slice.reduce((acc, val) => acc + Math.pow(val - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = middle + multiplier * stdDev;
    const lower = middle - multiplier * stdDev;
    const bandwidth = ((upper - lower) / middle) * 100;

    return {
      upper: Number(upper.toFixed(2)),
      middle: Number(middle.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      bandwidth: Number(bandwidth.toFixed(2)),
    };
  }

  /**
   * Average True Range (ATR 14)
   */
  static calculateATR(bars: NormalizedBar[], period = 14): number | null {
    if (bars.length <= period) return null;

    const trueRanges: number[] = [];
    for (let i = 1; i < bars.length; i++) {
      const current = bars[i];
      const prev = bars[i - 1];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - prev.close),
        Math.abs(current.low - prev.close)
      );
      trueRanges.push(tr);
    }

    if (trueRanges.length < period) return null;

    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trueRanges.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period;
    }

    return Number(atr.toFixed(2));
  }

  /**
   * Compute full suite of indicators from normalized bars
   */
  static computeAll(symbol: string, bars: NormalizedBar[]): TechnicalIndicators {
    const sortedBars = [...bars].sort((a, b) => a.bucketTime.getTime() - b.bucketTime.getTime());
    const closes = sortedBars.map((b) => b.close);
    const volumes = sortedBars.map((b) => b.volume);

    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const rsi14 = this.calculateRSI(closes, 14);
    const macd = this.calculateMACD(closes);
    const bollingerBands = this.calculateBollingerBands(closes);
    const atr14 = this.calculateATR(sortedBars, 14);

    // Rolling 20-bar average volume
    const rollingAvgVolume20 =
      volumes.length >= 20
        ? Number(
            (
              volumes.slice(volumes.length - 20).reduce((a, b) => a + b, 0) / 20
            ).toFixed(0)
          )
        : null;

    const latestVolume = volumes[volumes.length - 1] || 0;
    const volumeRatio =
      rollingAvgVolume20 && rollingAvgVolume20 > 0
        ? Number((latestVolume / rollingAvgVolume20).toFixed(2))
        : null;

    // Rolling 30-period return volatility
    let rollingVolatility30: number | null = null;
    if (closes.length >= 30) {
      const returns: number[] = [];
      for (let i = closes.length - 29; i < closes.length; i++) {
        returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
      }
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance =
        returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      rollingVolatility30 = Number((Math.sqrt(variance) * 100).toFixed(2));
    }

    return {
      symbol,
      calculatedAt: new Date(),
      sma20,
      sma50,
      sma200,
      ema12,
      ema26,
      rsi14,
      macd,
      bollingerBands,
      atr14,
      rollingAvgVolume20,
      volumeRatio,
      rollingVolatility30,
    };
  }
}
