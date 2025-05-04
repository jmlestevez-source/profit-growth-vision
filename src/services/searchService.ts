
import { Stock } from "@/types/finance";
import { toast } from "sonner";

// Función de búsqueda mejorada para obtener información de stocks
export const searchStock = async (query: string): Promise<Stock | null> => {
  try {
    console.log(`Buscando información para: ${query}`);
    
    // 1. Intentamos buscar usando nuestro proxy interno
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
    
    // 2. Intentar con API alternativa
    try {
      const alternativeUrl = `https://yfapi.net/v6/finance/autocomplete?region=US&lang=en&query=${encodeURIComponent(query)}`;
      
      const alternativeResponse = await fetch(alternativeUrl, {
        headers: {
          'accept': 'application/json',
          'X-API-KEY': 'demo'
        }
      });
      
      if (alternativeResponse.ok) {
        const data = await alternativeResponse.json();
        
        if (data?.ResultSet?.Result && data.ResultSet.Result.length > 0) {
          const result = data.ResultSet.Result[0];
          
          return {
            symbol: result.symbol,
            name: result.name || result.symbol,
            sector: 'N/A',
            industry: 'N/A'
          };
        }
      }
    } catch (altError) {
      console.log(`Error en API alternativa para búsqueda de ${query}`);
    }
    
    // 3. Si estamos buscando un ticker específico (formato de ticker probable)
    if (query.length < 6 && query.toUpperCase() === query) {
      console.log(`Asumiendo que ${query} es un ticker válido`);
      
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
