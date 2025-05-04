
import { Stock } from "@/types/finance";
import { toast } from "sonner";

// Función de búsqueda mejorada para obtener información de stocks
export const searchStock = async (query: string): Promise<Stock | null> => {
  try {
    console.log(`Buscando información para: ${query}`);
    
    // 1. Intentamos buscar usando el endpoint search similar al que usaría yfinance
    try {
      const response = await fetch(`/yahoo-proxy/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=1&newsCount=0&enableFuzzyQuery=false`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.quotes && data.quotes.length > 0) {
          const stockInfo = data.quotes[0];
          
          if (!stockInfo.symbol) return null;
          
          console.log(`Stock encontrado vía proxy: ${stockInfo.symbol}`);
          
          // Intentamos obtener información adicional del sector/industria
          try {
            const detailResponse = await fetch(`/yahoo-proxy/v10/finance/quoteSummary/${stockInfo.symbol}?modules=assetProfile`);
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              const profile = detailData?.quoteSummary?.result?.[0]?.assetProfile;
              
              return {
                symbol: stockInfo.symbol,
                name: stockInfo.shortname || stockInfo.longname || stockInfo.symbol,
                sector: profile?.sector || stockInfo.sector || 'N/A',
                industry: profile?.industry || stockInfo.industry || 'N/A',
              };
            }
          } catch (detailError) {
            console.log(`Error obteniendo detalles adicionales para ${stockInfo.symbol}`);
          }
          
          // Si no pudimos obtener detalles, devolvemos la información básica
          return {
            symbol: stockInfo.symbol,
            name: stockInfo.shortname || stockInfo.longname || stockInfo.symbol,
            sector: stockInfo.sector || 'N/A',
            industry: stockInfo.industry || 'N/A',
          };
        }
      }
    } catch (proxyError) {
      console.log(`Error en proxy para búsqueda de ${query}:`, proxyError);
    }
    
    // 2. Si la búsqueda falló, intentamos con el endpoint quote (más directo si el usuario ingresó un símbolo)
    if (query.length < 6 && /^[A-Za-z]+$/.test(query)) {
      try {
        const symbol = query.toUpperCase();
        const quoteResponse = await fetch(`/yahoo-proxy/v7/finance/quote?symbols=${symbol}`);
        
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          const quote = quoteData?.quoteResponse?.result?.[0];
          
          if (quote && quote.symbol) {
            console.log(`Stock encontrado directamente vía quote: ${quote.symbol}`);
            
            // Intentamos obtener detalles adicionales
            try {
              const profileResponse = await fetch(`/yahoo-proxy/v10/finance/quoteSummary/${symbol}?modules=assetProfile`);
              
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                const profile = profileData?.quoteSummary?.result?.[0]?.assetProfile;
                
                return {
                  symbol: quote.symbol,
                  name: quote.shortName || quote.longName || quote.symbol,
                  sector: profile?.sector || 'N/A',
                  industry: profile?.industry || 'N/A',
                };
              }
            } catch (profileError) {
              console.log(`Error obteniendo perfil para ${symbol}`);
            }
            
            // Información básica si no se pudo obtener el perfil
            return {
              symbol: quote.symbol,
              name: quote.shortName || quote.longName || quote.symbol,
              sector: 'N/A',
              industry: 'N/A',
            };
          }
        }
      } catch (quoteError) {
        console.log(`Error buscando quote directamente para ${query}`);
      }
    }
    
    // 3. Si también ha fallado la búsqueda directa pero parece ser un ticker válido
    if (query.length < 6 && query.toUpperCase() === query && /^[A-Za-z]+$/.test(query)) {
      console.log(`Asumiendo que ${query} es un ticker válido sin datos adicionales disponibles`);
      
      return {
        symbol: query,
        name: query,
        sector: 'N/A',
        industry: 'N/A'
      };
    }
    
    console.log(`No se encontraron resultados para la búsqueda: ${query}`);
    return null;
    
  } catch (error) {
    console.error("Error searching stock:", error);
    toast.error("Error buscando la acción");
    return null;
  }
};

// Función adicional para búsqueda de múltiples stocks a la vez
export const searchMultipleStocks = async (symbols: string[]): Promise<Stock[]> => {
  try {
    const symbolsQuery = symbols.join(',');
    const response = await fetch(`/yahoo-proxy/v7/finance/quote?symbols=${symbolsQuery}`);
    
    if (response.ok) {
      const data = await response.json();
      const quotes = data?.quoteResponse?.result || [];
      
      return quotes.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        sector: 'N/A', // Tendríamos que hacer llamadas adicionales para obtener sector/industria
        industry: 'N/A',
        price: quote.regularMarketPrice,
        lastUpdated: new Date().toISOString()
      }));
    }
    
    // Si la búsqueda múltiple falla, hacemos búsquedas individuales
    console.log('Búsqueda múltiple falló, intentando búsquedas individuales');
    const results: Stock[] = [];
    
    for (const symbol of symbols) {
      const stock = await searchStock(symbol);
      if (stock) results.push(stock);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error en búsqueda múltiple:', error);
    return [];
  }
};
