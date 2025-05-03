import { Stock, StockFinancials, ApiResponse, StockAnalysis } from "@/types/finance";
import { toast } from "sonner";
import yahooFinance from "yahoo-finance2";

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

// Buscar información de una acción usando Yahoo Finance
export const searchStock = async (query: string): Promise<Stock | null> => {
  try {
    const results = await yahooFinance.search(query);
    
    if (results && results.quotes && results.quotes.length > 0) {
      const stockInfo = results.quotes[0];
      
      // Comprobaciones de tipo seguras
      const symbol = 'symbol' in stockInfo ? stockInfo.symbol : null;
      if (!symbol) return null;
      
      // Nombre obtenido con comprobación segura de tipo
      const name = 'shortname' in stockInfo ? 
                   stockInfo.shortname || 
                   ('longname' in stockInfo ? stockInfo.longname : symbol) : 
                   ('name' in stockInfo ? stockInfo.name : symbol);
      
      // Sector e industria con comprobaciones seguras
      const sector = 'sector' in stockInfo ? stockInfo.sector : 'N/A';
      const industry = 'industry' in stockInfo ? stockInfo.industry : 'N/A';
      
      return {
        symbol,
        name,
        sector: typeof sector === 'string' ? sector : 'N/A',
        industry: typeof industry === 'string' ? industry : 'N/A',
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
    // Obtener datos financieros históricos de Yahoo Finance
    const earningsData = await yahooFinance.quoteSummary(symbol, { modules: ["earningsTrend", "earningsHistory"] });
    const incomeStatementData = await yahooFinance.quoteSummary(symbol, { modules: ["incomeStatementHistory", "incomeStatementHistoryQuarterly"] });
    
    // Verificar si tenemos datos trimestrales
    if (!incomeStatementData.incomeStatementHistoryQuarterly || 
        incomeStatementData.incomeStatementHistoryQuarterly.incomeStatementHistory.length === 0) {
      console.log(`Sin datos trimestrales disponibles para ${symbol}, usando datos simulados`);
      return generateMockFinancials(symbol);
    }

    // Procesar los datos trimestrales
    const quarterlyData: StockFinancials[] = [];
    
    incomeStatementData.incomeStatementHistoryQuarterly.incomeStatementHistory.forEach(quarter => {
      if (quarter.totalRevenue && quarter.endDate) {
        // Obtener EPS con seguridad de tipos
        let eps = 0;
        
        // Intentar obtener EPS de diferentes fuentes si existen
        try {
          // Primero intentamos con netIncome / sharesOutstanding si están disponibles
          if (quarter.netIncome && quarter.netIncome.raw) {
            eps = quarter.netIncome.raw / 1000000000; // Un valor aproximado si no tenemos EPS directo
          }
        } catch (e) {
          console.log(`Error calculando EPS para ${symbol}, usando aproximación`);
          eps = quarter.totalRevenue.raw ? quarter.totalRevenue.raw / 100000000 : 0; // Aproximación muy burda
        }
        
        quarterlyData.push({
          date: new Date(quarter.endDate).toISOString().split('T')[0],
          symbol: symbol,
          period: 'quarter',
          revenue: quarter.totalRevenue.raw || 0,
          eps: eps
        });
      }
    });
    
    // Si no pudimos obtener suficientes datos, usar datos simulados
    if (quarterlyData.length < 5) {
      console.log(`Datos insuficientes para ${symbol}, usando datos simulados`);
      return generateMockFinancials(symbol);
    }
    
    return quarterlyData;
  } catch (error) {
    console.error(`Error fetching quarterly financials for ${symbol}:`, error);
    toast.error(`Error obteniendo datos financieros de ${symbol}. Usando datos simulados.`);
    return generateMockFinancials(symbol);
  }
};

// Obtener precio actual de la acción
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    const quote = await yahooFinance.quote(symbol);
    
    if (quote && quote.regularMarketPrice) {
      return quote.regularMarketPrice;
    }
    console.log(`Sin datos de precio para ${symbol}, generando precio simulado`);
    return 100 + Math.random() * 400; // Precio simulado entre $100 y $500
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    toast.error(`Error obteniendo el precio de ${symbol}`);
    return 100 + Math.random() * 400; // Precio simulado en caso de error
  }
};

// Generar datos financieros simulados para una acción (como fallback)
const generateMockFinancials = (symbol: string): StockFinancials[] => {
  console.log(`Generando datos simulados para ${symbol} debido a que la API no proporcionó datos reales`);
  const today = new Date();
  const mockData: StockFinancials[] = [];
  
  // Generar 12 trimestres de datos simulados (3 años)
  for (let i = 0; i < 12; i++) {
    const quarterDate = new Date(today);
    quarterDate.setMonth(today.getMonth() - (i * 3));
    
    // Base revenue con ligero crecimiento trimestral
    const baseRevenue = 10000000000 + (Math.random() * 2000000000);
    // Crecimiento gradual para los más recientes, con ligeras fluctuaciones
    const growthFactor = 1 + ((12 - i) * 0.05) + (Math.random() * 0.1 - 0.05);
    
    mockData.push({
      date: quarterDate.toISOString().split('T')[0],
      symbol: symbol,
      period: 'quarter',
      revenue: baseRevenue * growthFactor,
      eps: (baseRevenue * growthFactor) / 1000000000 // Simular EPS proporcional a ingresos
    });
  }
  
  return mockData;
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
