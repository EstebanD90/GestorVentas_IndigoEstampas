import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, Package, Users, TrendingUp, Receipt, PiggyBank, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const data = await window.electronAPI.getDashboardStats();
    setStats(data);
  }

  if (!stats) return <div className="flex items-center justify-center h-full">Cargando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <h2 className="text-3xl font-bold tracking-tight">Resumen</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Ingresos Totales</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-green-500">+${stats.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm group relative">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Gastos Totales</h3>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-red-500">-${stats.totalExpenses.toFixed(2)}</div>
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs p-2 rounded border shadow-md -top-12 left-1/2 -translate-x-1/2 w-48 text-center pointer-events-none z-10">
            Incluye Gastos Operativos y Costo de Mercadería Vendida
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm group relative">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Ganancia Neta</h3>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className={`text-2xl font-bold ${stats.totalRevenue - stats.totalExpenses >= 0 ? 'text-primary' : 'text-red-500'}`}>
            ${(stats.totalRevenue - stats.totalExpenses).toFixed(2)}
          </div>
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs p-2 rounded border shadow-md -top-12 left-1/2 -translate-x-1/2 w-48 text-center pointer-events-none z-10">
            Ingresos - (Gastos + Costos)
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Ventas Realizadas</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.salesCount}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Productos Activos</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.productsCount}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Clientes Registrados</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.clientsCount}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Ventas (Últimos 30 días)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="day" className="text-xs" tick={{fill: 'currentColor'}} />
                <YAxis className="text-xs" tick={{fill: 'currentColor'}} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas de Stock Bajo
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
            {stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Mínimo: {p.min_stock}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${p.stock <= 0 ? 'text-red-500' : 'text-yellow-600'}`}>
                      Stock: {p.stock}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                <Package className="h-8 w-8 mb-2 opacity-20" />
                Todo el stock está al día.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Top 5 Productos Más Vendidos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" className="text-xs" hide />
                <YAxis dataKey="name" type="category" className="text-xs" width={100} tick={{fill: 'currentColor'}} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="sold" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'currentColor', fontSize: 12 }}>
                    {stats.topProducts.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - (index * 0.15)})`} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Distribución de Gastos
          </h3>
          <div className="h-[300px]">
            {stats.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.expensesByCategory}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({category, percent}) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    className="text-[10px]"
                  >
                    {stats.expensesByCategory.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                <Receipt className="h-8 w-8 mb-2 opacity-20" />
                No hay gastos registrados.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-7 p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Resumen de Rentabilidad</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Margen Bruto</span>
                  <span className="font-medium">
                    {stats.totalRevenue > 0 
                      ? (((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.max(0, Math.min(100, (stats.totalRevenue > 0 ? ((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue) * 100 : 0)))}%` }}
                  />
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-primary font-medium mb-1">Dato del día</p>
                <p className="text-xs text-muted-foreground italic">
                  {stats.lowStockProducts.length > 0 
                    ? `Tienes ${stats.lowStockProducts.length} productos con stock crítico. ¡Considera reponer pronto!` 
                    : "¡Buen trabajo! Tu inventario está saludable."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Promedio por Venta</p>
                  <p className="text-lg font-bold">
                    ${stats.salesCount > 0 ? (stats.totalRevenue / stats.salesCount).toFixed(2) : '0.00'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/20" />
              </div>
              <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Costo vs Ingreso</p>
                  <p className="text-lg font-bold">
                    {stats.totalRevenue > 0 ? ((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/20" />
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-2">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Ingresos: ${stats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-muted-foreground">Gastos: ${stats.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold pt-2 border-t">
                    <div className={`w-3 h-3 rounded-full ${stats.totalRevenue - stats.totalExpenses >= 0 ? 'bg-primary' : 'bg-red-500'}`}></div>
                    <span>Neto: ${(stats.totalRevenue - stats.totalExpenses).toFixed(2)}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
