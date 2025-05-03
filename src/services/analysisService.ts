
import { Stock, StockAnalysis, StockFinancials } from "@/types/finance";

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
