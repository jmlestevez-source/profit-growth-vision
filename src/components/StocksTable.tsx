
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockAnalysis } from "@/types/finance";
import { formatCurrency, formatPercentage, removeStock } from "@/services";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StocksTableProps {
  stocksAnalysis: StockAnalysis[];
  onSelectStock: (symbol: string) => void;
}

const StocksTable: React.FC<StocksTableProps> = ({ stocksAnalysis, onSelectStock }) => {
  return (
    <div className="rounded-md border shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Acción</TableHead>
            <TableHead>Últimos ingresos</TableHead>
            <TableHead>Crecimiento QoQ</TableHead>
            <TableHead>Crecimiento YoY</TableHead>
            <TableHead>Último EPS</TableHead>
            <TableHead>Crecimiento EPS QoQ</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocksAnalysis.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                No hay acciones para mostrar. Añade acciones a tu watchlist.
              </TableCell>
            </TableRow>
          ) : (
            stocksAnalysis.map((stock) => (
              <TableRow key={stock.symbol} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectStock(stock.symbol)}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-bold">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground">{stock.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{formatCurrency(stock.currentRevenue)}</div>
                </TableCell>
                <TableCell>
                  <div className={stock.revenueGrowthQoQ >= 0 ? "trend-up flex items-center" : "trend-down flex items-center"}>
                    {stock.revenueGrowthQoQ >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                    {formatPercentage(stock.revenueGrowthQoQ)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={stock.revenueGrowthYoY >= 0 ? "trend-up flex items-center" : "trend-down flex items-center"}>
                    {stock.revenueGrowthYoY >= 0 ? <ArrowUp size={16} className="mr-1" /> : <ArrowDown size={16} className="mr-1" />}
                    {formatPercentage(stock.revenueGrowthYoY)}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(stock.currentEPS)}</TableCell>
                <TableCell>
                  <div className={stock.epsGrowthQoQ >= 0 ? "trend-up flex items-center" : "trend-down flex items-center"}>
                    {stock.epsGrowthQoQ >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                    {formatPercentage(stock.epsGrowthQoQ)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {stock.isHistoricMaxRevenue && (
                      <Badge variant="default" className="max-historic w-fit">Máx. Ingresos</Badge>
                    )}
                    {stock.isHistoricMaxEPS && (
                      <Badge variant="default" className="max-historic w-fit">Máx. EPS</Badge>
                    )}
                    {stock.consecutiveGrowthQuarters > 0 && (
                      <Badge variant="outline" className="growth-positive w-fit flex items-center gap-1">
                        <Calendar size={12} />
                        {stock.consecutiveGrowthQuarters}Q crecimiento
                      </Badge>
                    )}
                    {stock.consecutiveDeclineQuarters > 0 && (
                      <Badge variant="outline" className="growth-negative w-fit flex items-center gap-1">
                        <Calendar size={12} />
                        {stock.consecutiveDeclineQuarters}Q declive
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStock(stock.symbol);
                    }}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default StocksTable;
