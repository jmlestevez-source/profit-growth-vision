
import { StockFinancials } from "@/types/finance";
import { toast } from "sonner";
import { generateMockFinancials } from "./mockDataService";

// Función auxiliar para analizar los resultados de la API de Yahoo Finance
const parseYahooFinancialData = (data: any, symbol: string, period: 'quarter' | 'annual') => {
  try {
    // Extraer la información financiera relevante
    const financialData = period === 'quarter' 
      ? data?.quoteSummary?.result?.[0]?.incomeStatementHistoryQuarterly?.incomeStatementHistory
      : data?.quoteSummary?.result?.[0]?.incomeStatementHistory?.incomeStatementHistory;
    
    if (!financialData || financialData.length === 0) {
      console.error(`No se encontraron datos financieros para ${symbol} (${period})`);
      return null;
    }
    
    // Transformar los datos al formato esperado por la aplicación
    return financialData.map((item: any) => ({
      date: new Date(item.endDate.raw * 1000).toISOString().split('T')[0],
      symbol: symbol,
      period: period,
      revenue: item.totalRevenue?.raw || 0,
      eps: item.dilutedEPS?.raw || 0
    })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Error al procesar datos financieros:", error);
    return null;
  }
};

/**
 * Obtiene datos financieros trimestrales utilizando el proxy de Yahoo Finance
 * Implementando una lógica similar al código Python proporcionado
 */
export const getQuarterlyFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  try {
    console.log(`Obteniendo datos financieros trimestrales para ${symbol}...`);
    
    // Crear URL para el endpoint de Yahoo Finance que contiene datos financieros
    const url = `/yahoo-proxy/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistory,incomeStatementHistoryQuarterly`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la respuesta de la API: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Procesar datos trimestrales (similar a t.quarterly_financials en Python)
    const quarterlyData = parseYahooFinancialData(data, symbol, 'quarter');
    
    if (quarterlyData && quarterlyData.length > 0) {
      console.log(`✅ Datos trimestrales obtenidos para ${symbol}: ${quarterlyData.length} trimestres`);
      return quarterlyData;
    } else {
      // Intento alternativo
      console.warn(`No se encontraron datos trimestrales estándar para ${symbol}, intentando con datos alternativos...`);
      
      // Intentar con otro módulo que podría contener información de ganancias
      const altUrl = `/yahoo-proxy/v10/finance/quoteSummary/${symbol}?modules=earnings,financialData`;
      const altResponse = await fetch(altUrl);
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        const earningsData = altData?.quoteSummary?.result?.[0]?.earnings?.financialsChart?.quarterly;
        
        if (earningsData && earningsData.length > 0) {
          console.log(`✅ Datos de ganancias obtenidos para ${symbol} (alternativo)`);
          
          return earningsData.map((quarter: any) => ({
            date: `${quarter.date}`,
            symbol: symbol,
            period: 'quarter',
            revenue: quarter.revenue?.raw || 0,
            eps: quarter.earnings?.raw || 0
          })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      }
      
      // Si todo falla, generamos datos simulados
      console.error(`❌ No se pudieron obtener datos financieros para ${symbol}, generando simulación`);
      toast.error(`No se pudieron obtener datos reales para ${symbol}. Mostrando datos simulados.`);
      return generateMockFinancials(symbol);
    }
  } catch (error) {
    console.error(`Error obteniendo datos financieros para ${symbol}:`, error);
    toast.error(`Error obteniendo datos para ${symbol}. Mostrando datos simulados.`);
    return generateMockFinancials(symbol);
  }
};

/**
 * Obtiene datos financieros anuales utilizando el proxy de Yahoo Finance
 * Implementando una lógica similar al código Python proporcionado
 */
export const getAnnualFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  try {
    console.log(`Obteniendo datos financieros anuales para ${symbol}...`);
    
    // Crear URL para el endpoint de Yahoo Finance que contiene datos financieros
    const url = `/yahoo-proxy/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistory`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la respuesta de la API: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Procesar datos anuales (similar a t.financials en Python)
    const annualData = parseYahooFinancialData(data, symbol, 'annual');
    
    if (annualData && annualData.length > 0) {
      console.log(`✅ Datos anuales obtenidos para ${symbol}: ${annualData.length} años`);
      return annualData;
    } else {
      // Si no hay datos anuales disponibles, creamos aproximaciones a partir de datos trimestrales
      console.warn(`No se encontraron datos anuales para ${symbol}, generando aproximación desde datos trimestrales...`);
      
      // Intentar obtener datos trimestrales y derivar datos anuales
      const quarterlyData = await getQuarterlyFinancials(symbol);
      
      if (quarterlyData && quarterlyData.length > 0 && quarterlyData[0].revenue > 0) {
        // Convertir datos trimestrales a anuales (tomando cada 4 trimestres)
        const derivedAnnualData = quarterlyData.filter((_, i) => i % 4 === 0).map(q => ({
          ...q,
          period: 'annual' as const,
          revenue: q.revenue * 4,
          eps: q.eps * 4
        }));
        
        console.log(`✅ Datos anuales derivados para ${symbol}: ${derivedAnnualData.length} años`);
        return derivedAnnualData;
      }
      
      // Si todo falla, generamos datos simulados
      console.error(`❌ No se pudieron obtener datos financieros anuales para ${symbol}, generando simulación`);
      const mockQuarterly = generateMockFinancials(symbol);
      return mockQuarterly.filter((_, i) => i % 4 === 0).map(q => ({
        ...q,
        period: 'annual' as const,
        revenue: q.revenue * 4,
        eps: q.eps * 4
      }));
    }
  } catch (error) {
    console.error(`Error obteniendo datos financieros anuales para ${symbol}:`, error);
    const mockQuarterly = generateMockFinancials(symbol);
    return mockQuarterly.filter((_, i) => i % 4 === 0).map(q => ({
      ...q,
      period: 'annual' as const,
      revenue: q.revenue * 4,
      eps: q.eps * 4
    }));
  }
};

// Obtener precio actual de la acción desde Yahoo Finance
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    console.log(`Obteniendo precio actual para ${symbol}...`);
    
    // Endpoint para obtener el precio actual
    const response = await fetch(`/yahoo-proxy/v8/finance/chart/${symbol}?interval=1d`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
        const price = data.chart.result[0].meta.regularMarketPrice;
        console.log(`✅ Precio obtenido para ${symbol}: $${price}`);
        return price;
      }
      
      console.warn(`No se encontró precio en la respuesta principal para ${symbol}, intentando alternativa...`);
    }
    
    // Alternativa usando quoteSummary
    const altResponse = await fetch(`/yahoo-proxy/v10/finance/quoteSummary/${symbol}?modules=price`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      const priceData = altData?.quoteSummary?.result?.[0]?.price;
      
      if (priceData?.regularMarketPrice?.raw) {
        const price = priceData.regularMarketPrice.raw;
        console.log(`✅ Precio alternativo obtenido para ${symbol}: $${price}`);
        return price;
      }
    }
    
    // Si no pudimos obtener un precio real, generamos un precio simulado
    console.error(`❌ No se pudo obtener precio real para ${symbol}, generando simulado`);
    const symbolValue = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (symbolValue % 450); // Precio entre $50 y $500
  } catch (error) {
    console.error(`Error obteniendo precio para ${symbol}:`, error);
    // Precio simulado consistente para este símbolo
    const symbolValue = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (symbolValue % 450);
  }
};
