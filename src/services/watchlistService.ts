
import { Stock } from "@/types/finance";
import { toast } from "sonner";

// Lista de acciones de ejemplo para comenzar
const DEFAULT_STOCKS: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
];

// Obtener lista de acciones guardadas o usar las predeterminadas
export const getSavedStocks = (): Stock[] => {
  const savedStocks = localStorage.getItem("watchlist");
  return savedStocks ? JSON.parse(savedStocks) : DEFAULT_STOCKS;
};

// Guardar lista de acciones
export const saveStocks = (stocks: Stock[]): void => {
  localStorage.setItem("watchlist", JSON.stringify(stocks));
};

// Añadir una acción a la lista
export const addStock = (stock: Stock): void => {
  const currentStocks = getSavedStocks();
  if (!currentStocks.some(s => s.symbol === stock.symbol)) {
    saveStocks([...currentStocks, stock]);
    toast.success(`${stock.symbol} añadida a tu watchlist`);
  } else {
    toast.error(`${stock.symbol} ya está en tu watchlist`);
  }
};

// Eliminar una acción de la lista
export const removeStock = (symbol: string): void => {
  const currentStocks = getSavedStocks();
  saveStocks(currentStocks.filter(stock => stock.symbol !== symbol));
  toast.success(`${symbol} eliminada de tu watchlist`);
};
