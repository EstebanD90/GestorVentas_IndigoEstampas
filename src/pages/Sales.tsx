import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Search, Calendar, FolderOpen } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

export default function Sales() {
  const [sales, setSales] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // New Sale State
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [quantity, setQuantity] = useState(1);
  const [isCredit, setIsCredit] = useState(false);

  useEffect(() => {
    loadSales();
    loadDependencies();
  }, []);

  const productCategories = Array.from(new Set(['all', 'General', ...products.map(p => p.category).filter(Boolean)])).sort();
  
  const filteredProductsForSale = products.filter(p => {
    if (productCategoryFilter === 'all') return p.stock > 0;
    const cat = p.category || 'General';
    return p.stock > 0 && cat === productCategoryFilter;
  });

  function showNotification(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
  }

  async function loadSales() {
    const data = await window.electronAPI.getSales();
    setSales(data);
  }

  const filteredSales = sales.filter(sale => {
    // Search filter
    const matchesSearch = 
      sale.id.toString().includes(searchTerm) || 
      (sale.client_name || 'Consumidor Final').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.products_summary || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    if (!matchesSearch) return false;
    
    if (dateFilter === 'all') return true;
    
    const saleDate = new Date(sale.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const saleDateOnly = new Date(saleDate);
    saleDateOnly.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
      return saleDateOnly.getTime() === today.getTime();
    }
    
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      return saleDateOnly >= weekAgo;
    }
    
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      return saleDateOnly >= monthAgo;
    }
    
    return true;
  });

  async function loadDependencies() {
    const p = await window.electronAPI.getProducts();
    const c = await window.electronAPI.getClients();
    setProducts(p);
    setClients(c);
  }

  function addToCart() {
    if (!selectedProduct) return;
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (!product) return;

    if (quantity > product.stock) {
      alert('No hay suficiente stock');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        alert('No hay suficiente stock');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    setQuantity(1);
    setSelectedProduct('');
  }

  function removeFromCart(id: number) {
    setCart(cart.filter(item => item.id !== id));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    
    const client = clients.find(c => c.id.toString() === selectedClient);
    const saleData = {
      client_id: selectedClient ? parseInt(selectedClient) : null,
      client_name: client ? client.name : 'Consumidor Final',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      payment_status: isCredit && selectedClient ? 'pending' : 'paid',
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    };

    const saleId = await window.electronAPI.createSale(saleData);
    
    if (confirm('¿Desea descargar el ticket de venta?')) {
      const result = await window.electronAPI.printTicket({ ...saleData, id: saleId });
      if (result.success) {
        showNotification('Ticket descargado correctamente');
      } else {
        showNotification('Error al descargar el ticket', 'error');
      }
    }

    setIsModalOpen(false);
    setCart([]);
    setSelectedClient('');
    setIsCredit(false);
    loadSales();
    loadDependencies(); // Reload to update stock
  }

  async function handlePrintExisting(sale: any) {
    const items = await window.electronAPI.getSaleItems(sale.id);
    const saleData = {
        id: sale.id,
        client_name: sale.client_name || 'Consumidor Final',
        total: sale.total,
        payment_status: sale.payment_status,
        items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price_at_sale
        }))
    };
    const result = await window.electronAPI.printTicket(saleData);
    if (result.success) {
      showNotification('Ticket descargado correctamente');
    } else {
      showNotification('Error al descargar el ticket', 'error');
    }
  }

  async function deleteSale(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta venta? Se restaurará el stock de los productos.')) return;
    
    const result = await window.electronAPI.deleteSale(id);
    if (result.success) {
      loadSales();
      loadDependencies();
      showNotification('Venta eliminada correctamente');
    } else {
      alert('Error al eliminar venta: ' + result.error);
    }
  }

  async function clearHistory() {
    if (!confirm('¿Estás seguro de borrar TODO el historial de ventas? Esta acción no se puede deshacer.')) return;
    
    const result = await window.electronAPI.clearSalesHistory();
    if (result.success) {
      loadSales();
      loadDependencies();
      showNotification('Historial borrado correctamente');
    } else {
      alert('Error al borrar historial: ' + result.error);
    }
  }

  async function handleExport() {
    const dataToExport = sales.map(s => ({
      ID: s.id,
      Fecha: new Date(s.date).toLocaleString(),
      Cliente: s.client_name || 'Consumidor Final',
      Productos: s.products_summary || '-',
      Total: s.total.toFixed(2),
      Estado: s.payment_status === 'pending' ? 'Cuenta Corriente' : 'Pagado'
    }));
    const result = await window.electronAPI.exportData('Ventas', dataToExport);
    if (result && result.success) {
        showNotification('Datos exportados correctamente a Excel');
    }
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Ventas</h2>
        <div className="flex gap-2">
            <button 
              onClick={() => window.electronAPI.openInvoicesFolder()}
              className="flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 transition-colors"
              title="Abrir carpeta de facturas"
            >
              <FolderOpen size={20} /> Carpeta Facturas
            </button>
            {sales.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 size={20} /> Borrar Todo
                </button>
            )}
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              title="Exportar a Excel"
            >
              <Download size={20} /> Exportar
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} /> Nueva Venta
            </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por ID, cliente o producto..."
            className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative group">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <select 
            className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Últimos 7 días</option>
            <option value="month">Último mes</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Productos (Cant.)</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">#{sale.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(sale.date).toLocaleString()}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={sale.products_summary}>{sale.products_summary || '-'}</td>
                <td className="px-4 py-3">{sale.client_name || 'Consumidor Final'}</td>
                <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${sale.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {sale.payment_status === 'pending' ? 'Cta. Cte.' : 'Pagado'}
                    </span>
                </td>
                <td className="px-4 py-3 font-bold">${sale.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-right space-x-2">
                    <button 
                        onClick={() => handlePrintExisting(sale)}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        title="Imprimir ticket"
                    >
                        <Download size={16} className="rotate-180" />
                    </button>
                    <button 
                        onClick={() => deleteSale(sale.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Eliminar venta"
                    >
                        <Trash2 size={16} />
                    </button>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron ventas con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nueva Venta"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <select 
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Consumidor Final</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Filtrar por Categoría</label>
              <select 
                value={productCategoryFilter}
                onChange={(e) => {
                  setProductCategoryFilter(e.target.value);
                  setSelectedProduct('');
                }}
                className="w-full px-3 py-2 border rounded-md bg-muted/50 text-xs focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">Todas las categorías</option>
                {productCategories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <select 
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Seleccionar producto...</option>
                {filteredProductsForSale.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price}) - Stock: {p.stock}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-end justify-end">
            <div className="w-24 space-y-2">
              <label className="text-sm font-medium">Cant.</label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="space-y-2">
                <button 
                  onClick={addToCart}
                  className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 h-[42px] flex items-center justify-center font-medium gap-2"
                >
                  <Plus size={18} /> Agregar
                </button>
            </div>
          </div>

          <div className="border rounded-md max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">Prod.</th>
                  <th className="px-2 py-1">Cant.</th>
                  <th className="px-2 py-1 text-right">Subtotal</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cart.map(item => (
                  <tr key={item.id}>
                    <td className="px-2 py-1">{item.name}</td>
                    <td className="px-2 py-1 text-center">{item.quantity}</td>
                    <td className="px-2 py-1 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                    <td className="px-2 py-1 text-right">
                      <button onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-bold text-lg">Total: ${total.toFixed(2)}</span>
            <div className="flex items-center gap-4">
                {selectedClient && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isCredit} 
                      onChange={(e) => setIsCredit(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    A Cuenta Corriente
                  </label>
                )}
                <div className="flex gap-2">
                    <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                    >
                    Cancelar
                    </button>
                    <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                    Finalizar Venta
                    </button>
                </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
