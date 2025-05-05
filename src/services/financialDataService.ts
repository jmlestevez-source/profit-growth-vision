
import { StockFinancials } from "@/types/finance";
import { toast } from "sonner";
import { generateMockFinancials } from "./mockDataService";

/**
 * Obtiene datos financieros trimestrales a través del backend de Flask
 */
export const getQuarterlyFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  try {
    console.log(`Obteniendo datos financieros trimestrales para ${symbol}...`);
    
    // Hacemos la petición a nuestro backend Flask
    const response = await fetch(`/api/financials?symbol=${symbol}`);
    
    if (!response.ok) {
      console.error(`Error en la respuesta del backend: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la respuesta del backend: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verificamos la respuesta
    if (data.status === "error" || !data.data || !data.data.financials) {
      console.error(`Error en los datos recibidos: ${data.message || "datos no válidos"}`);
      throw new Error(`Error en los datos recibidos: ${data.message || "datos no válidos"}`);
    }
    
    // Procesamos los datos financieros
    const financialsData = data.data.financials;
    const historyData = data.data.history;
    
    // Convertir datos de financials a nuestro formato StockFinancials[]
    const quarterlyData: StockFinancials[] = [];
    
    // Recorremos las fechas (columnas)
    const dates = Object.keys(financialsData);
    
    // Si hay datos financieros
    if (dates.length > 0) {
      for (const date of dates) {
        // Para cada fecha, obtenemos los valores correspondientes
        const revenue = financialsData[date]['Total Revenue'];
        
        // Intentamos obtener EPS o calcularlo si no está disponible
        let eps = 0;
        if (financialsData[date]['Diluted EPS']) {
          eps = financialsData[date]['Diluted EPS'];
        } else if (financialsData[date]['Net Income'] && financialsData[date]['Weighted Average Shs Out']) {
          eps = financialsData[date]['Net Income'] / financialsData[date]['Weighted Average Shs Out'];
        }
        
        // Solo añadimos si tenemos revenue (que es el mínimo necesario)
        if (revenue) {
          quarterlyData.push({
            date: date, // La fecha ya viene en formato ISO
            symbol: symbol,
            period: 'quarter',
            revenue: revenue,
            eps: eps || 0
          });
        }
      }
      
      // Ordenamos cronológicamente
      quarterlyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log(`✅ Datos trimestrales obtenidos para ${symbol}: ${quarterlyData.length} trimestres`);
      return quarterlyData;
    }
    
    // Si no hay datos, generamos datos simulados
    console.error(`No se encontraron datos financieros para ${symbol}, generando simulación`);
    toast.error(`No se pudieron obtener datos reales para ${symbol}. Mostrando datos simulados.`);
    return generateMockFinancials(symbol);
  } catch (error) {
    console.error(`Error obteniendo datos financieros para ${symbol}:`, error);
    toast.error(`Error obteniendo datos para ${symbol}. Mostrando datos simulados.`);
    return generateMockFinancials(symbol);
  }
};

/**
 * Obtiene datos financieros anuales a través del backend de Flask
 */
export const getAnnualFinancials = async (symbol: string): Promise<StockFinancials[]> => {
  try {
    console.log(`Obteniendo datos financieros anuales para ${symbol}...`);
    
    // Hacemos la petición a nuestro backend Flask
    const response = await fetch(`/api/financials?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Error en la respuesta del backend: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verificamos la respuesta
    if (data.status === "error" || !data.data || !data.data.financials) {
      throw new Error(`Error en los datos recibidos: ${data.message || "datos no válidos"}`);
    }
    
    // Procesamos los datos financieros de la misma manera
    const financialsData = data.data.financials;
    
    // Convertir datos de financials a nuestro formato StockFinancials[]
    const annualData: StockFinancials[] = [];
    
    // Recorremos las fechas (columnas)
    const dates = Object.keys(financialsData);
    
    // Si hay datos financieros
    if (dates.length > 0) {
      for (const date of dates) {
        const revenue = financialsData[date]['Total Revenue'];
        
        let eps = 0;
        if (financialsData[date]['Diluted EPS']) {
          eps = financialsData[date]['Diluted EPS'];
        } else if (financialsData[date]['Net Income'] && financialsData[date]['Weighted Average Shs Out']) {
          eps = financialsData[date]['Net Income'] / financialsData[date]['Weighted Average Shs Out'];
        }
        
        if (revenue) {
          annualData.push({
            date: date,
            symbol: symbol,
            period: 'annual',
            revenue: revenue,
            eps: eps || 0
          });
        }
      }
      
      annualData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log(`✅ Datos anuales obtenidos para ${symbol}: ${annualData.length} años`);
      return annualData;
    }
    
    // Si no se encontraron datos, intentamos derivarlos de los trimestrales
    console.warn(`No se encontraron datos anuales para ${symbol}, generando aproximación desde datos trimestrales...`);
    const quarterlyData = await getQuarterlyFinancials(symbol);
    
    if (quarterlyData && quarterlyData.length > 0 && quarterlyData[0].revenue > 0) {
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

// Obtener precio actual de la acción desde el backend
export const getCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    console.log(`Obteniendo precio actual para ${symbol}...`);
    
    // Hacemos la petición al backend
    const response = await fetch(`/api/financials?symbol=${symbol}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Verificamos la respuesta
      if (data.status === "success" && data.data && data.data.history) {
        const historyData = data.data.history;
        const dates = Object.keys(historyData.Close || {});
        
        // Tomamos el precio más reciente
        if (dates.length > 0) {
          const lastDate = dates[dates.length - 1];
          const price = historyData.Close[lastDate];
          
          console.log(`✅ Precio obtenido para ${symbol}: $${price}`);
          return price;
        }
      }
      
      console.warn(`No se encontró precio en la respuesta para ${symbol}`);
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
