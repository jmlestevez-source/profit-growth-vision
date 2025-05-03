
export interface Stock {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  price?: number;
  lastUpdated?: string;
}

export interface StockFinancials {
  date: string;
  symbol: string;
  period: 'quarter' | 'annual';
  revenue: number;
  eps: number;
}

export interface StockAnalysis {
  symbol: string;
  name: string;
  price?: number;
  currentRevenue: number;
  previousRevenue: number;
  revenueGrowthQoQ: number; // Quarter over Quarter
  revenueGrowthYoY: number; // Year over Year
  currentEPS: number;
  previousEPS: number;
  epsGrowthQoQ: number;
  epsGrowthYoY: number;
  consecutiveGrowthQuarters: number;
  consecutiveDeclineQuarters: number;
  isHistoricMaxRevenue: boolean;
  isHistoricMaxEPS: boolean;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  data: T;
  status: string;
  message?: string;
}
