
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StockAnalysis, StockFinancials } from "@/types/finance";
import { formatCurrency, formatPercentage } from "@/services/financeService";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, ChartBar, FileChartLine, AlertTriangle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";

interface StockDetailProps {
  stockAnalysis: StockAnalysis;
  financials: StockFinancials[];
  onBack: () => void;
  usingSampleData?: boolean;
}

const StockDetail: React.FC<StockDetailProps> = ({ stockAnalysis, financials, onBack, usingSampleData = false }) => {
  // Preparar datos para los gráficos
  const chartData = [...financials]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      revenue: item.revenue,
      eps: item.eps
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onBack}>
            ← Volver a la lista
          </Button>
        </div>
        <div>
          <Badge variant="outline" className="text-muted-foreground">
            Última actualización: {new Date(stockAnalysis.lastUpdated).toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {usingSampleData && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>
            <strong>Datos simulados:</strong> Los datos que ves son simulados debido a restricciones de la API. Para datos reales, se requiere una suscripción premium a Financial Modeling Prep.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{stockAnalysis.name} ({stockAnalysis.symbol})</CardTitle>
                <CardDescription>Análisis de crecimiento financiero</CardDescription>
              </div>
              {stockAnalysis.price && (
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(stockAnalysis.price)}</div>
                  <div className="text-sm text-muted-foreground">Precio actual</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tarjeta de ingresos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <ChartBar className="text-primary" />
                    Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(stockAnalysis.currentRevenue)}</div>
                      <div className="text-sm text-muted-foreground">Últimos ingresos trimestrales</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className={stockAnalysis.revenueGrowthQoQ >= 0 ? "trend-up flex items-center" : "trend-down flex items-center"}>
                          {stockAnalysis.revenueGrowthQoQ >= 0 ? <TrendingUp size={18} className="mr-1" /> : <TrendingDown size={18} className="mr-1" />}
                          {formatPercentage(stockAnalysis.revenueGrowthQoQ)}
                        </div>
                        <div className="text-xs text-muted-foreground">Crecimiento trimestral</div>
                      </div>
                      <div>
                        <div className={stockAnalysis.revenueGrowthYoY >= 0 ? "trend-up flex items-center" : "trend-down flex items-center"}>
                          {stockAnalysis.revenueGrowthYoY >= 0 ? <ArrowUp size={18} className="mr-1" /> : <ArrowDown size={18} className="mr-1" />}
                          {formatPercentage(stockAnalysis.revenueGrowthYoY)}
                        </div>
                        <div className="text-xs text-muted-foreground">Crecimiento anual</div>
                      </div>
                    </div>

                    <div className="pt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            width={80}
                          />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="revenue" fill="#3b82f6" name="Ingresos" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pt-2">
                      {stockAnalysis.isHistoricMaxRevenue && (
                        <Badge className="max-historic">Máximo histórico de ingresos</Badge>
                      )}
                      {stockAnalysis.consecutiveGrowthQuarters > 0 && (
                        <Badge variant="outline" className="growth-positive ml-2">
                          {stockAnalysis.consecutiveGrowthQuarters} {stockAnalysis.consecutiveGrowthQuarters === 1 ? 'trimestre' : 'trimestres'} consecutivos de crecimiento
                        </Badge>
                      )}
                      {stockAnalysis.consecutiveDeclineQuarters > 0 && (
                        <Badge variant="outline" className="growth-negative ml-2">
                          {stockAnalysis.consecutiveDeclineQuarters} {stockAnalysis.consecutiveDeclineQuarters === 1 ? 'trimestre' : 'trimestres'} consecutivos de declive
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta de EPS */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileChartLine className="text-primary" />
                    EPS (Beneficio por acción)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(stockAnalysis.currentEPS)}</div>
                      <div className="text-sm text-muted-foreground">Último EPS diluido trimestral</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className={stockAnalysis.epsGrowthQoQ >= 0 ? "trend-up flex items-center" : "trend-down flex items-center"}>
                          {stockAnalysis.epsGrowthQoQ >= 0 ? <TrendingUp size={18} className="mr-1" /> : <TrendingDown size={18} className="mr-1" />}
                          {formatPercentage(stockAnalysis.epsGrowthQoQ)}
                        </div>
                        <div className="text-xs text-muted-foreground">Crecimiento trimestral</div>
                      </div>
                      <div>
                        <div className={stockAnalysis.epsGrowthYoY >= 0 ? "trend-up flex items-center" : "trend-down flex items-center"}>
                          {stockAnalysis.epsGrowthYoY >= 0 ? <ArrowUp size={18} className="mr-1" /> : <ArrowDown size={18} className="mr-1" />}
                          {formatPercentage(stockAnalysis.epsGrowthYoY)}
                        </div>
                        <div className="text-xs text-muted-foreground">Crecimiento anual</div>
                      </div>
                    </div>

                    <div className="pt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            width={80}
                          />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Area type="monotone" dataKey="eps" stroke="#3b82f6" fill="#93c5fd" name="EPS" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pt-2">
                      {stockAnalysis.isHistoricMaxEPS && (
                        <Badge className="max-historic">Máximo histórico de EPS</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockDetail;
