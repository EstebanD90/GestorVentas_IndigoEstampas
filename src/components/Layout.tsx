import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Truck, ShoppingCart, Calculator, Save, Sun, Moon, List, Receipt, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { APP_NAME, APP_VERSION } from '@/constants';

const themes = [
    { name: 'light', label: 'Claro', icon: Sun },
    { name: 'dark', label: 'Oscuro', icon: Moon },
    { name: 'theme-emerald', label: 'Esmeralda', color: 'bg-emerald-500' },
    { name: 'theme-rose', label: 'Rosa', color: 'bg-rose-500' },
    { name: 'theme-amber', label: 'Ámbar', color: 'bg-amber-500' },
    { name: 'theme-violet', label: 'Violeta', color: 'bg-violet-500' },
];

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Resumen' },
  { path: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { path: '/products', icon: Package, label: 'Productos' },
  { path: '/price-list', icon: List, label: 'Lista de Precios' },
  { path: '/expenses', icon: Receipt, label: 'Gastos' },
  { path: '/clients', icon: Users, label: 'Clientes' },
  { path: '/suppliers', icon: Truck, label: 'Proveedores' },
  { path: '/calculators', icon: Calculator, label: 'Calculadoras' },
  { path: '/backup', icon: Save, label: 'Mantenimiento' },
  { path: '/settings', icon: Palette, label: 'Ajustes' },
];

export default function Layout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
            <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded-xl border border-border/50">
                {themes.map((t) => (
                    <button
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className={cn(
                            "flex items-center justify-center h-10 w-full rounded-lg transition-all hover:scale-105 active:scale-95 border",
                            theme === t.name ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                        )}
                        title={t.label}
                    >
                        {t.icon ? <t.icon size={18} /> : <div className={cn("w-5 h-5 rounded-full shadow-sm", t.color)}></div>}
                    </button>
                ))}
            </div>
            <div className="mt-4 text-center">
                <p className="text-[10px] font-mono text-muted-foreground opacity-50 uppercase tracking-widest">
                    Versión {APP_VERSION}
                </p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background/50 p-8">
        <Outlet />
      </main>
    </div>
  );
}
