
// Re-export all functions from individual service files
export { getSavedStocks, saveStocks, addStock, removeStock } from './watchlistService';
export { searchStock } from './searchService';
export { getQuarterlyFinancials, getCurrentPrice } from './financialDataService';
export { analyzeStockFinancials, calculateGrowthPercentage } from './analysisService';
export { formatCurrency, formatPercentage } from './formattingService';
export { generateMockFinancials } from './mockDataService';
