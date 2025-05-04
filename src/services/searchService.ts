
import { Stock } from "@/types/finance";
import { toast } from "sonner";

// Función de búsqueda que evita usar yahoo-finance2 directamente
export const searchStock = async (query: string): Promise<Stock | null> => {
  try {
    // Intentamos primero con un proxy CORS
    const corsProxy = "https://cors-anywhere.herokuapp.com/";
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=1&newsCount=0&enableFuzzyQuery=false`;
    
    try {
      // Primer intento: usar proxy CORS
      const response = await fetch(`${corsProxy}${yahooUrl}`, {
        headers: {
          'Origin': window.location.origin,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.quotes && data.quotes.length > 0) {
          const stockInfo = data.quotes[0];
          
          if (!stockInfo.symbol) return null;
          
          console.log(`Stock encontrado vía proxy: ${stockInfo.symbol}`);
          
          return {
            symbol: stockInfo.symbol,
            name: stockInfo.shortname || stockInfo.longname || stockInfo.symbol,
            sector: stockInfo.sector || 'N/A',
            industry: stockInfo.industry || 'N/A',
          };
        }
      }
    } catch (proxyError) {
      console.log(`Error en proxy CORS para búsqueda de ${query}, usando enfoque alternativo`);
    }
    
    // Segundo intento: petición directa
    try {
      const directResponse = await fetch(yahooUrl);
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        
        if (data && data.quotes && data.quotes.length > 0) {
          const stockInfo = data.quotes[0];
          
          if (!stockInfo.symbol) return null;
          
          console.log(`Stock encontrado directamente: ${stockInfo.symbol}`);
          
          return {
            symbol: stockInfo.symbol,
            name: stockInfo.shortname || stockInfo.longname || stockInfo.symbol,
            sector: stockInfo.sector || 'N/A',
            industry: stockInfo.industry || 'N/A',
          };
        }
      }
    } catch (directError) {
      console.log(`Error en petición directa de búsqueda para ${query}`);
    }
    
    console.log(`No se encontraron resultados para la búsqueda: ${query}`);
    return null;
    
  } catch (error) {
    console.error("Error searching stock:", error);
    toast.error("Error buscando la acción");
    return null;
  }
};
