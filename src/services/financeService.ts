
import { Stock, StockFinancials, ApiResponse, StockAnalysis } from "@/types/finance";
import { toast } from "sonner";

const API_KEY = "FedUgaGEN9Pv19qgVxh2nHw0JWg5V6uh"; // Financial Modeling Prep API key
const BASE_URL = "https://financialmodelingprep.com/api/v3";

// Lista de acciones de ejemplo para comenzar
const DEFAULT_STOCKS: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
];

// Obtener lista de acciones guardadas o usar las predeterminadas
export const getSavedStocks = (): Stock[] => {
  const savedStocks = localStorage.getItem("watchlist");
  return savedStocks ? JSON.parse(savedStocks) : DEFAULT_STOCKS;
};

// Guardar lista de acciones
export const saveStocks = (stocks: Stock[]): void => {
  localStorage.setItem("watchlist", JSON.stringify(stocks));
};

// Añadir una acción a la lista
export const addStock = (stock: Stock): void => {
  const currentStocks = getSavedStocks();
  if (!currentStocks.some(s => s.symbol === stock.symbol)) {
    saveStocks([...currentStocks, stock]);
    toast.success(`${stock.symbol} añadida a tu watchlist`);
  } else {
    toast.error(`${stock.symbol} ya está en tu watchlist`);
  }
};

// Eliminar una acción de la lista
export const removeStock = (symbol: string): void => {
  const currentStocks = getSavedStocks();
  saveStocks(currentStocks.filter(stock => stock.symbol !== symbol));
  toast.success(`${symbol} eliminada de tu watchlist`);
};

// Buscar información de una acción
export const searchStock = async (query: string): Promise<Stock | null> => {
  try {
    const response = await fetch(`${BASE_URL}/search?query=${query}&limit=1&apikey=${API_KEY}`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        symbol: data[0].symbol,
        name: data[0].name,
        sector: data[0].sector || "N/A",
        industry: data[0].industry || "N/A",
      };
    }
    return null;
  } catch (error) {
    console.error("Error searching stock:", error);
    toast.error("Error buscando la acción");
    return null;
  }
};

// Obtener datos financieros trimestrales
export const getQuarterlyFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  try {
    const response = await fetch(`${BASE_URL}/income-statement/${symbol}?period=quarter&limit=12&apikey=${API_KEY}`);
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("No financial data available");
    }

    return data.map(item => ({
      date: item.date,
      symbol: symbol,
      period: 'quarter',
      revenue: item.revenue || 0,
      eps: item.epsdiluted || 0
    }));
  } catch (error) {
    console.error(`Error fetching quarterly financials for ${symbol}:`, error);
    toast.error(`Error obteniendo datos financieros de ${symbol}`);
    return [];
  }
};

// Obtener precio actual de la acción
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await fetch(`${BASE_URL}/quote/${symbol}?apikey=${API_KEY}`);
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].price) {
      return data[0].price;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    toast.error(`Error obteniendo el precio de ${symbol}`);
    return null;
  }
};

// Analizar los datos financieros para obtener métricas de crecimiento
export const analyzeStockFinancials = (financials: StockFinancials[], stock: Stock): StockAnalysis | null => {
  if (!financials || financials.length < 5) {
    return null;
  }
  
  // Ordenar por fecha, más reciente primero
  const sortedData = [...financials].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const currentQuarter = sortedData[0];
  const previousQuarter = sortedData[1];
  const yearAgoQuarter = sortedData[4]; // ~1 año atrás (4 trimestres)
  
  // Calcular crecimiento trimestral
  const revenueGrowthQoQ = calculateGrowthPercentage(currentQuarter.revenue, previousQuarter.revenue);
  const epsGrowthQoQ = calculateGrowthPercentage(currentQuarter.eps, previousQuarter.eps);
  
  // Calcular crecimiento anual
  const revenueGrowthYoY = calculateGrowthPercentage(currentQuarter.revenue, yearAgoQuarter.revenue);
  const epsGrowthYoY = calculateGrowthPercentage(currentQuarter.eps, yearAgoQuarter.eps);
  
  // Determinar trimestres consecutivos de crecimiento/decrecimiento
  let consecutiveGrowthQuarters = 0;
  let consecutiveDeclineQuarters = 0;
  
  // Comprobar trimestres consecutivos de crecimiento en ingresos
  for (let i = 0; i < sortedData.length - 1; i++) {
    if (sortedData[i].revenue > sortedData[i + 1].revenue) {
      consecutiveGrowthQuarters++;
    } else {
      break;
    }
  }
  
  // Comprobar trimestres consecutivos de decrecimiento en ingresos
  for (let i = 0; i < sortedData.length - 1; i++) {
    if (sortedData[i].revenue < sortedData[i + 1].revenue) {
      consecutiveDeclineQuarters++;
    } else {
      break;
    }
  }
  
  // Determinar si está en máximo histórico
  const isHistoricMaxRevenue = currentQuarter.revenue === Math.max(...sortedData.map(q => q.revenue));
  const isHistoricMaxEPS = currentQuarter.eps === Math.max(...sortedData.map(q => q.eps));
  
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    currentRevenue: currentQuarter.revenue,
    previousRevenue: previousQuarter.revenue,
    revenueGrowthQoQ,
    revenueGrowthYoY,
    currentEPS: currentQuarter.eps,
    previousEPS: previousQuarter.eps,
    epsGrowthQoQ,
    epsGrowthYoY,
    consecutiveGrowthQuarters,
    consecutiveDeclineQuarters,
    isHistoricMaxRevenue,
    isHistoricMaxEPS,
    lastUpdated: new Date().toISOString()
  };
};

// Función para calcular el porcentaje de crecimiento
export const calculateGrowthPercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

// Función para formatear grandes cantidades de dinero (millones, billones)
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return "$0";
  
  const absAmount = Math.abs(amount);
  if (absAmount >= 1e12) {
    return `$${(amount / 1e12).toFixed(2)}T`;
  } else if (absAmount >= 1e9) {
    return `$${(amount / 1e9).toFixed(2)}B`;
  } else if (absAmount >= 1e6) {
    return `$${(amount / 1e6).toFixed(2)}M`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
};

// Función para formatear porcentajes
export const formatPercentage = (percentage: number): string => {
  const formattedValue = percentage.toFixed(2);
  return percentage >= 0 ? `+${formattedValue}%` : `${formattedValue}%`;
};
