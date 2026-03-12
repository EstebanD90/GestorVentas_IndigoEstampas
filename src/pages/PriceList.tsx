import { useState, useEffect } from 'react';
import { Save, Search, Download } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';

export default function PriceList() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editedProducts, setEditedProducts] = useState<{[key: number]: any}>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await window.electronAPI.getProducts();
    setProducts(data);
    setEditedProducts({});
  }

  const handlePriceChange = (id: number, field: 'price' | 'cost', value: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setEditedProducts(prev => ({
      ...prev,
      [id]: {
        ...product,
        ...prev[id], // Keep existing edits
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const saveProduct = async (id: number) => {
    const product = editedProducts[id];
    if (!product) return;

    await window.electronAPI.updateProduct(product);
    
    // Update local state to reflect saved changes as "clean"
    setProducts(prev => prev.map(p => p.id === id ? product : p));
    setEditedProducts(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const getDisplayValue = (product: any, field: 'price' | 'cost') => {
    if (editedProducts[product.id] && editedProducts[product.id][field] !== undefined) {
        return editedProducts[product.id][field];
    }
    return product[field];
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleExport() {
    const dataToExport = products.map(p => {
        const cost = p.cost;
        const price = p.price;
        const profit = price - cost;
        const margin = price > 0 ? (profit / price) * 100 : 0;
        
        return {
            Producto: p.name,
            Costo: cost.toFixed(2),
            Precio: price.toFixed(2),
            Margen: `${margin.toFixed(1)}%`,
            Ganancia: profit.toFixed(2)
        };
    });
    const result = await window.electronAPI.exportData('ListaDePrecios', dataToExport);
    if (result && result.success) {
      setToast({ message: 'Datos exportados correctamente a Excel', type: 'success' });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Lista de Precios</h2>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
          title="Exportar a Excel"
        >
          <Download size={20} /> Exportar
        </button>
      </div>

      <div className="flex items-center gap-2 bg-card border border-input px-3 py-2 rounded-md w-full max-w-sm">
        <Search size={20} className="text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Buscar productos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full placeholder:text-muted-foreground"
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 w-32">Costo ($)</th>
              <th className="px-4 py-3 w-32">Precio ($)</th>
              <th className="px-4 py-3">Margen (%)</th>
              <th className="px-4 py-3">Ganancia ($)</th>
              <th className="px-4 py-3 w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((product) => {
                const cost = getDisplayValue(product, 'cost');
                const price = getDisplayValue(product, 'price');
                const profit = price - cost;
                const margin = price > 0 ? (profit / price) * 100 : 0;
                const isEdited = !!editedProducts[product.id];

                return (
                  <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">
                        <input 
                            type="number" 
                            className="w-full bg-background border border-input rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none"
                            value={cost}
                            onChange={(e) => handlePriceChange(product.id, 'cost', e.target.value)}
                        />
                    </td>
                    <td className="px-4 py-3">
                        <input 
                            type="number" 
                            className="w-full bg-background border border-input rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none"
                            value={price}
                            onChange={(e) => handlePriceChange(product.id, 'price', e.target.value)}
                        />
                    </td>
                    <td className="px-4 py-3">
                        <span className={`font-bold ${margin < 20 ? 'text-red-500' : 'text-green-500'}`}>
                            {margin.toFixed(1)}%
                        </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                        ${profit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                        {isEdited && (
                            <button 
                                onClick={() => saveProduct(product.id)}
                                className="text-primary hover:text-primary/80 p-1 hover:bg-primary/10 rounded"
                                title="Guardar Cambios"
                            >
                                <Save size={20} />
                            </button>
                        )}
                    </td>
                  </tr>
                );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
