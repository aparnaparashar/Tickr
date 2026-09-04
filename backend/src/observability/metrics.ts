// Lightweight in-memory metrics registry for tracking counters and latencies
export interface MetricCounters {
  http_requests_total: Record<string, number>;
  http_5xx_total: number;
  provider_requests_total: Record<string, number>;
  provider_rate_limit_total: Record<string, number>;
  provider_failure_total: Record<string, number>;
  cache_hit_total: number;
  cache_miss_total: number;
  change_events_generated_total: number;
  stale_data_served_total: number;
  jobs_completed_total: Record<string, number>;
  jobs_failed_total: Record<string, number>;
}

class MetricsRegistry {
  private counters: MetricCounters = {
    http_requests_total: {},
    http_5xx_total: 0,
    provider_requests_total: {},
    provider_rate_limit_total: {},
    provider_failure_total: {},
    cache_hit_total: 0,
    cache_miss_total: 0,
    change_events_generated_total: 0,
    stale_data_served_total: 0,
    jobs_completed_total: {},
    jobs_failed_total: {},
  };

  increment(metric: keyof MetricCounters, label?: string, value = 1): void {
    const current = this.counters[metric];
    if (typeof current === 'number') {
      (this.counters[metric] as number) += value;
    } else if (typeof current === 'object' && label) {
      current[label] = (current[label] || 0) + value;
    }
  }

  recordHttp(route: string, statusCode: number): void {
    const key = `${route}__${statusCode}`;
    this.counters.http_requests_total[key] = (this.counters.http_requests_total[key] || 0) + 1;
    if (statusCode >= 500) {
      this.counters.http_5xx_total++;
    }
  }

  recordProvider(provider: string, status: 'success' | 'rate_limit' | 'failure'): void {
    this.counters.provider_requests_total[provider] = (this.counters.provider_requests_total[provider] || 0) + 1;
    if (status === 'rate_limit') {
      this.counters.provider_rate_limit_total[provider] = (this.counters.provider_rate_limit_total[provider] || 0) + 1;
    } else if (status === 'failure') {
      this.counters.provider_failure_total[provider] = (this.counters.provider_failure_total[provider] || 0) + 1;
    }
  }

  recordCache(hit: boolean): void {
    if (hit) {
      this.counters.cache_hit_total++;
    } else {
      this.counters.cache_miss_total++;
    }
  }

  getSnapshot(): MetricCounters {
    return JSON.parse(JSON.stringify(this.counters));
  }
}

export const metrics = new MetricsRegistry();
