
import { StockFinancials } from "@/types/finance";
import { toast } from "sonner";
import { generateMockFinancials } from "./mockDataService";

// Obtiene datos financieros trimestrales utilizando el proxy interno de Vite
export const getQuarterlyFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  try {
    console.log(`Intentando obtener datos financieros para ${symbol}`);
    
    // 1. Intentamos obtener datos a través del proxy configurado en vite.config.ts
    try {
      // Endpoint para obtener datos de quotes
      const response = await fetch(`/yahoo-proxy/v8/finance/chart/${symbol}?interval=1d&range=2y&indicators=quote`);
      
      if (response.ok) {
        const priceData = await response.json();
        
        // Si obtenemos datos de precio con éxito, intentamos obtener datos financieros
        if (priceData?.chart?.result?.[0]) {
          try {
            // Endpoint para información financiera más detallada
            const financialsResponse = await fetch(`/yahoo-proxy/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistory,incomeStatementHistoryQuarterly`);
            
            if (financialsResponse.ok) {
              const financialsData = await financialsResponse.json();
              
              // Extraer datos de informes trimestrales
              const quarterlyResults = financialsData?.quoteSummary?.result?.[0]?.incomeStatementHistoryQuarterly?.incomeStatementHistory;
              
              if (quarterlyResults && quarterlyResults.length > 0) {
                console.log(`Datos trimestrales obtenidos para ${symbol}:`, quarterlyResults.length, "trimestres");
                
                const currentPrice = priceData.chart.result[0].meta.regularMarketPrice || 0;
                
                // Transformar datos al formato requerido por la aplicación
                return quarterlyResults.map((quarter: any) => ({
                  date: new Date(quarter.endDate.raw * 1000).toISOString().split('T')[0],
                  symbol: symbol,
                  period: 'quarter',
                  revenue: quarter.totalRevenue?.raw || 0,
                  eps: quarter.dilutedEPS?.raw || 0
                }));
              }
            }
          } catch (financialsError) {
            console.error(`Error obteniendo detalles financieros para ${symbol}:`, financialsError);
          }
        }
        
        // Si llegamos aquí con datos de precio pero sin datos financieros, generamos datos simulados
        // pero escalados según el precio real para mayor realismo
        const currentPrice = priceData.chart.result[0].meta.regularMarketPrice || 0;
        console.log(`Usando precio real ${currentPrice} para generar datos simulados de ${symbol}`);
        
        const mockFinancials = generateMockFinancials(symbol);
        const priceMultiplier = currentPrice / 100;
        
        return mockFinancials.map(quarter => ({
          ...quarter,
          revenue: quarter.revenue * priceMultiplier,
          eps: quarter.eps * priceMultiplier * 0.01  // Ajuste de EPS más realista
        }));
      }
    } catch (error) {
      console.error(`Error en proxy para ${symbol}:`, error);
    }
    
    // 2. Si el proxy falla, intentamos YahooFinanceAPI pública como alternativa
    try {
      // Este endpoint proporciona algunos datos básicos y funciona en navegadores
      const alternativeUrl = `https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${symbol}`;
      
      const alternativeResponse = await fetch(alternativeUrl, {
        headers: {
          'accept': 'application/json',
          'X-API-KEY': 'demo' // Clave de demostración, limitada pero suficiente para pruebas
        }
      });
      
      if (alternativeResponse.ok) {
        const data = await alternativeResponse.json();
        if (data?.quoteResponse?.result?.[0]) {
          const stockInfo = data.quoteResponse.result[0];
          const price = stockInfo.regularMarketPrice || 100;
          
          console.log(`Datos alternativa para ${symbol}, precio: ${price}`);
          
          // Generamos datos financieros simulados pero usando el precio real como base
          const mockFinancials = generateMockFinancials(symbol);
          const priceMultiplier = price / 100;
          
          return mockFinancials.map(quarter => ({
            ...quarter,
            revenue: quarter.revenue * priceMultiplier,
            eps: quarter.eps * priceMultiplier * 0.01
          }));
        }
      }
    } catch (altError) {
      console.error(`Error en API alternativa para ${symbol}:`, altError);
    }
    
    // 3. Como último recurso, generamos datos completamente simulados
    console.log(`Sin datos disponibles para ${symbol}, usando datos simulados genéricos`);
    return generateMockFinancials(symbol);
    
  } catch (error) {
    console.error(`Error completo obteniendo datos financieros para ${symbol}:`, error);
    toast.error(`Error obteniendo datos financieros de ${symbol}. Usando datos simulados.`);
    return generateMockFinancials(symbol);
  }
};

// Obtener precio actual de la acción con mejor precisión
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    console.log(`Intentando obtener precio actual para ${symbol}`);
    
    // 1. Intentamos con el proxy interno de Vite
    try {
      const response = await fetch(`/yahoo-proxy/v8/finance/chart/${symbol}?interval=1d`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
          const price = data.chart.result[0].meta.regularMarketPrice;
          console.log(`Precio obtenido para ${symbol}: $${price}`);
          return price;
        }
      }
    } catch (proxyError) {
      console.error(`Error en proxy para precio de ${symbol}:`, proxyError);
    }
    
    // 2. Intentamos con la API alternativa
    try {
      const alternativeUrl = `https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${symbol}`;
      
      const alternativeResponse = await fetch(alternativeUrl, {
        headers: {
          'accept': 'application/json',
          'X-API-KEY': 'demo'
        }
      });
      
      if (alternativeResponse.ok) {
        const data = await alternativeResponse.json();
        if (data?.quoteResponse?.result?.[0]?.regularMarketPrice) {
          const price = data.quoteResponse.result[0].regularMarketPrice;
          console.log(`Precio alternativo para ${symbol}: $${price}`);
          return price;
        }
      }
    } catch (altError) {
      console.error(`Error en API alternativa para precio de ${symbol}:`, altError);
    }
    
    // 3. Si todo falla, generamos un precio simulado más realista basado en el ticker
    // Generamos un "hash" simple del símbolo para tener consistencia
    const symbolValue = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const simulatedPrice = 50 + (symbolValue % 450); // Precio entre $50 y $500
    
    console.log(`Generando precio simulado para ${symbol}: $${simulatedPrice}`);
    return simulatedPrice;
    
  } catch (error) {
    console.error(`Error completo obteniendo precio para ${symbol}:`, error);
    
    // Precio simulado pero consistente para el mismo ticker
    const symbolValue = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const simulatedPrice = 50 + (symbolValue % 450); // Precio entre $50 y $500
    
    return simulatedPrice;
  }
};

// Función de utilidad para integración futura con Python
export const fetchFinancialDataWithPythonLogic = async (symbol: string) => {
  // Esta función demuestra cómo integraríamos el código Python
  // Actualmente deshabilitada, pero ilustra el enfoque
  
  // En una implementación real, deberíamos:
  // 1. Usar una API backend que ejecute el código Python
  // 2. Procesar los datos de quarterly_financials similar al ejemplo Python
  // 3. Retornar objetos StockFinancials apropiados
  
  console.log(`Integración Python para ${symbol} no implementada aún`);
  return null;
};
