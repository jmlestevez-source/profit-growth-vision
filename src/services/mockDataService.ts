
import { StockFinancials } from "@/types/finance";

// Generar datos financieros simulados para una acción (como fallback)
export const generateMockFinancials = (symbol: string): StockFinancials[] => {
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
