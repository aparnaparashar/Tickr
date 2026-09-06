import {
  User,
  Watchlist,
  Instrument,
  MeaningfulChangesResult,
  HistoricalBar,
  TechnicalIndicators,
  Fundamentals,
  NewsItem,
  Alert,
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = localStorage.getItem('tickr_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('tickr_token', token);
    } else {
      localStorage.removeItem('tickr_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(message);
      (err as unknown as { status: number }).status = response.status;
      throw err;
    }

    const json = await response.json();
    return json.data;
  }

  // Auth Endpoints
  async register(name: string, email: string, password: string) {
    const data = await this.request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(data.accessToken);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.accessToken);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  // Watchlists Endpoints
  async getWatchlists(): Promise<{ watchlists: Watchlist[] }> {
    return this.request<{ watchlists: Watchlist[] }>('/watchlists');
  }

  async getWatchlist(watchlistId: string): Promise<{ watchlist: Watchlist }> {
    return this.request<{ watchlist: Watchlist }>(`/watchlists/${watchlistId}`);
  }

  async createWatchlist(name: string, isDefault = false): Promise<{ watchlist: Watchlist }> {
    return this.request<{ watchlist: Watchlist }>('/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name, isDefault }),
    });
  }

  async deleteWatchlist(watchlistId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/watchlists/${watchlistId}`, {
      method: 'DELETE',
    });
  }

  async addItemToWatchlist(watchlistId: string, instrumentId: string): Promise<{ item: unknown }> {
    return this.request<{ item: unknown }>(`/watchlists/${watchlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ instrumentId }),
    });
  }

  async removeItemFromWatchlist(watchlistId: string, instrumentId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/watchlists/${watchlistId}/items/${instrumentId}`, {
      method: 'DELETE',
    });
  }

  // Stocks & Discovery
  async searchStocks(query: string): Promise<{ instruments: Instrument[] }> {
    return this.request<{ instruments: Instrument[] }>(`/stocks/search?q=${encodeURIComponent(query)}`);
  }

  async getStock(instrumentId: string): Promise<{ instrument: Instrument }> {
    return this.request<{ instrument: Instrument }>(`/stocks/${instrumentId}`);
  }

  async getStockQuote(instrumentId: string): Promise<unknown> {
    return this.request(`/stocks/${instrumentId}/quote`);
  }

  async getStockHistory(
    instrumentId: string,
    range = '1M',
    interval = '1day'
  ): Promise<{ bars: HistoricalBar[] }> {
    return this.request<{ bars: HistoricalBar[] }>(
      `/stocks/${instrumentId}/history?range=${range}&interval=${interval}`
    );
  }

  async getStockIndicators(instrumentId: string, range = '3M'): Promise<{ indicators: TechnicalIndicators }> {
    return this.request<{ indicators: TechnicalIndicators }>(`/stocks/${instrumentId}/indicators?range=${range}`);
  }

  async getStockFundamentals(instrumentId: string): Promise<{ fundamentals: Fundamentals | null }> {
    return this.request<{ fundamentals: Fundamentals | null }>(`/stocks/${instrumentId}/fundamentals`);
  }

  async getStockNews(instrumentId: string): Promise<{ news: NewsItem[] }> {
    return this.request<{ news: NewsItem[] }>(`/stocks/${instrumentId}/news`);
  }

  // "Since You Last Checked" Intelligence
  async getChangesSinceLastCheck(instrumentId: string): Promise<MeaningfulChangesResult> {
    return this.request<MeaningfulChangesResult>(`/stocks/${instrumentId}/changes-since-last-check`);
  }

  async acknowledgeCheckpoint(instrumentId: string): Promise<{ checkpoint: unknown; message: string }> {
    return this.request<{ checkpoint: unknown; message: string }>(
      `/stocks/${instrumentId}/checkpoint/acknowledge`,
      { method: 'POST' }
    );
  }

  async getChangeHistory(
    instrumentId: string,
    cursor?: string,
    limit = 10
  ): Promise<{ events: unknown[]; nextCursor: string | null; hasMore: boolean }> {
    const url = `/stocks/${instrumentId}/change-history?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
    return this.request<{ events: unknown[]; nextCursor: string | null; hasMore: boolean }>(url);
  }

  // Dashboard Summary
  async getDashboardChanges(): Promise<{ items: MeaningfulChangesResult[] }> {
    return this.request<{ items: MeaningfulChangesResult[] }>('/dashboard/changes');
  }

  // Alerts
  async getAlerts(): Promise<{ alerts: Alert[] }> {
    return this.request<{ alerts: Alert[] }>('/alerts');
  }

  async createAlert(
    instrumentId: string,
    type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_MOVE' | 'VOLUME_ANOMALY' | 'MEANINGFUL_CHANGE',
    targetValue: number
  ): Promise<{ alert: Alert }> {
    return this.request<{ alert: Alert }>('/alerts', {
      method: 'POST',
      body: JSON.stringify({ instrumentId, type, targetValue }),
    });
  }

  async updateAlert(alertId: string, data: { enabled?: boolean; targetValue?: number }): Promise<{ alert: Alert }> {
    return this.request<{ alert: Alert }>(`/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAlert(alertId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/alerts/${alertId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
