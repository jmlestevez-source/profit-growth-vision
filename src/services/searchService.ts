
import { Stock } from "@/types/finance";
import { toast } from "sonner";
import yahooFinance from "yahoo-finance2";

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
