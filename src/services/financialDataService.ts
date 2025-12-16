import { StockFinancials } from "@/types/finance";
import { toast } from "sonner";
import { generateMockFinancials } from "./mockDataService";

// API Key de Financial Modeling Prep (gratuita con límite de 250 llamadas/día)
// Obtén tu API key gratuita en: https://financialmodelingprep.com/developer/docs/
const FMP_API_KEY = localStorage.getItem('fmp_api_key') || 'demo';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Función para establecer la API key
export const setFMPApiKey = (apiKey: string) => {
  localStorage.setItem('fmp_api_key', apiKey);
  window.location.reload(); // Recargar para usar la nueva key
};

// Función para obtener la API key actual
export const getFMPApiKey = () => {
  return localStorage.getItem('fmp_api_key') || '';
};

/**
 * Obtiene datos financieros trimestrales desde Financial Modeling Prep
 */
export const getQuarterlyFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  const apiKey = localStorage.getItem('fmp_api_key') || 'demo';
  
  try {
    console.log(`Obteniendo datos financieros trimestrales para ${symbol} desde FMP...`);
    
    // Income statement trimestral
    const response = await fetch(
      `${FMP_BASE_URL}/income-statement/${symbol}?period=quarter&limit=20&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Error en la respuesta: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`No se encontraron datos para ${symbol}`);
      throw new Error('No hay datos disponibles');
    }
    
    // Convertir a nuestro formato
    const quarterlyData: StockFinancials[] = data.map((item: any) => ({
      date: item.date,
      symbol: item.symbol,
      period: 'quarter' as const,
      revenue: item.revenue || 0,
      eps: item.eps || item.epsdiluted || 0,
      netIncome: item.netIncome || 0,
      grossProfit: item.grossProfit || 0,
      operatingIncome: item.operatingIncome || 0,
    }));
    
    // Ordenar cronológicamente (más antiguo primero)
    quarterlyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log(`✅ Datos REALES trimestrales obtenidos para ${symbol}: ${quarterlyData.length} trimestres`);
    toast.success(`Datos reales obtenidos para ${symbol}`);
    return quarterlyData;
    
  } catch (error) {
    console.error(`Error obteniendo datos para ${symbol}:`, error);
    
    if (apiKey === 'demo') {
      toast.error('Configura tu API key de FMP para obtener datos reales');
    } else {
      toast.error(`Error obteniendo datos para ${symbol}. Mostrando simulados.`);
    }
    
    return generateMockFinancials(symbol);
  }
};

/**
 * Obtiene datos financieros anuales desde Financial Modeling Prep
 */
export const getAnnualFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  const apiKey = localStorage.getItem('fmp_api_key') || 'demo';
  
  try {
    console.log(`Obteniendo datos financieros anuales para ${symbol} desde FMP...`);
    
    // Income statement anual
    const response = await fetch(
      `${FMP_BASE_URL}/income-statement/${symbol}?limit=10&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Error en la respuesta: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`No se encontraron datos anuales para ${symbol}`);
      throw new Error('No hay datos disponibles');
    }
    
    // Convertir a nuestro formato
    const annualData: StockFinancials[] = data.map((item: any) => ({
      date: item.date,
      symbol: item.symbol,
      period: 'annual' as const,
      revenue: item.revenue || 0,
      eps: item.eps || item.epsdiluted || 0,
      netIncome: item.netIncome || 0,
      grossProfit: item.grossProfit || 0,
      operatingIncome: item.operatingIncome || 0,
    }));
    
    // Ordenar cronológicamente
    annualData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log(`✅ Datos REALES anuales obtenidos para ${symbol}: ${annualData.length} años`);
    return annualData;
    
  } catch (error) {
    console.error(`Error obteniendo datos anuales para ${symbol}:`, error);
    
    const mockQuarterly = generateMockFinancials(symbol);
    return mockQuarterly.filter((_, i) => i % 4 === 0).map(q => ({
      ...q,
      period: 'annual' as const,
      revenue: q.revenue * 4,
      eps: q.eps * 4
    }));
  }
};

/**
 * Obtiene precio actual desde Financial Modeling Prep
 */
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  const apiKey = localStorage.getItem('fmp_api_key') || 'demo';
  
  try {
    console.log(`Obteniendo precio actual para ${symbol} desde FMP...`);
    
    const response = await fetch(
      `${FMP_BASE_URL}/quote/${symbol}?apikey=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0 && data[0].price) {
        console.log(`✅ Precio REAL obtenido para ${symbol}: $${data[0].price}`);
        return data[0].price;
      }
    }
    
    throw new Error('No se pudo obtener el precio');
    
  } catch (error) {
    console.error(`Error obteniendo precio para ${symbol}:`, error);
    // Precio simulado
    const symbolValue = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (symbolValue % 450);
  }
};
