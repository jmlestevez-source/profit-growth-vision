
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import StocksTable from "@/components/StocksTable";
import StockDetail from "@/components/StockDetail";
import AddStockDialog from "@/components/AddStockDialog";
import { Stock, StockAnalysis, StockFinancials } from "@/types/finance";
import { 
  getSavedStocks, 
  getQuarterlyFinancials, 
  getCurrentPrice, 
  analyzeStockFinancials 
} from "@/services";

const Index = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stocksAnalysis, setStocksAnalysis] = useState<StockAnalysis[]>([]);
  const [financialsData, setFinancialsData] = useState<{ [key: string]: StockFinancials[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cargar lista de acciones al inicio
  useEffect(() => {
    loadStocksFromStorage();
  }, []);

  // Observar cambios en la lista de acciones y actualizaciones forzadas
  useEffect(() => {
    if (stocks.length > 0) {
      fetchStocksData();
    }
  }, [stocks, refreshTrigger]);

  // Cargar acciones desde el almacenamiento local
  const loadStocksFromStorage = () => {
    const savedStocks = getSavedStocks();
    setStocks(savedStocks);
  };

  // Obtener datos financieros para todas las acciones
  const fetchStocksData = async () => {
    setIsLoading(true);
    toast.info("Cargando datos financieros...");

    try {
      const analysisResults: StockAnalysis[] = [];
      const financialsResults: { [key: string]: StockFinancials[] } = {};
      let usingSampleDataFlag = false;

      for (const stock of stocks) {
        try {
          // Obtener precio actual
          const price = await getCurrentPrice(stock.symbol);
          
          // Obtener datos financieros trimestrales
          const quarterlyData = await getQuarterlyFinancials(stock.symbol);
          if (quarterlyData.length === 0) continue;
          
          // Comprobar si estamos usando datos simulados
          if (quarterlyData[0].revenue > 0 && !quarterlyData[0].date.includes("-")) {
            usingSampleDataFlag = true;
          }
          
          financialsResults[stock.symbol] = quarterlyData;
          
          // Analizar datos financieros
          const stockWithPrice = { ...stock, price: price || undefined };
          const analysis = analyzeStockFinancials(quarterlyData, stockWithPrice);
          if (analysis) {
            analysisResults.push(analysis);
          }
        } catch (error) {
          console.error(`Error processing stock ${stock.symbol}:`, error);
          // Continuar con la siguiente acción si hay error
        }
      }

      setStocksAnalysis(analysisResults);
      setFinancialsData(financialsResults);
      setUsingSampleData(usingSampleDataFlag);
      
      if (usingSampleDataFlag) {
        toast.warning("Usando datos simulados debido a limitaciones de las API. El acceso a Yahoo Finance está restringido desde el navegador.");
      } else {
        toast.success("Datos financieros actualizados");
      }
    } catch (error) {
      console.error("Error fetching stocks data:", error);
      toast.error("Error al cargar datos financieros");
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar selección de acción para ver detalles
  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
  };

  // Volver a la lista principal
  const handleBackToList = () => {
    setSelectedStock(null);
  };

  // Refrescar todos los datos
  const handleRefreshData = () => {
    loadStocksFromStorage();
    // Forzar actualización incluso si la lista no cambió
    setRefreshTrigger(prev => prev + 1);
    toast.info("Actualizando datos...");
  };

  const selectedStockAnalysis = selectedStock 
    ? stocksAnalysis.find(s => s.symbol === selectedStock) 
    : null;

  const selectedStockFinancials = selectedStock && financialsData[selectedStock] 
    ? financialsData[selectedStock] 
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        onAddStockClick={() => setIsAddStockDialogOpen(true)} 
        onRefreshData={handleRefreshData}
      />
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
            </div>
            <p className="mt-2 text-muted-foreground">Obteniendo datos financieros...</p>
          </div>
        ) : selectedStock && selectedStockAnalysis ? (
          <StockDetail
            stockAnalysis={selectedStockAnalysis}
            financials={selectedStockFinancials}
            onBack={handleBackToList}
            usingSampleData={usingSampleData}
          />
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Tus acciones monitorizadas</h2>
              <p className="text-muted-foreground">
                Monitoriza el crecimiento de tus acciones favoritas
              </p>
              {usingSampleData && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-300">
                  <strong>Nota:</strong> Se están usando datos simulados debido a restricciones de acceso a Yahoo Finance desde el navegador. Para datos reales, se necesitaría un servidor backend.
                </div>
              )}
            </div>
            <StocksTable 
              stocksAnalysis={stocksAnalysis} 
              onSelectStock={handleSelectStock}
            />
          </div>
        )}
      </main>

      <AddStockDialog
        isOpen={isAddStockDialogOpen}
        onClose={() => setIsAddStockDialogOpen(false)}
      />
    </div>
  );
};

export default Index;
