
import { Stock } from "@/types/finance";
import { toast } from "sonner";

// Modified search function to avoid using yahoo-finance2 directly
export const searchStock = async (query: string): Promise<Stock | null> => {
  try {
    // Yahoo Finance search API URL
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=1&newsCount=0&enableFuzzyQuery=false`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.quotes && data.quotes.length > 0) {
      const stockInfo = data.quotes[0];
      
      if (!stockInfo.symbol) return null;
      
      return {
        symbol: stockInfo.symbol,
        name: stockInfo.shortname || stockInfo.longname || stockInfo.symbol,
        sector: stockInfo.sector || 'N/A',
        industry: stockInfo.industry || 'N/A',
      };
    }
    return null;
  } catch (error) {
    console.error("Error searching stock:", error);
    toast.error("Error buscando la acción");
    return null;
  }
};
