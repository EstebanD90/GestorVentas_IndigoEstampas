import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Download, ImageIcon, X, BookOpen, Share2, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogPdf, setCatalogPdf] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '5',
    category: 'General',
    image_path: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await window.electronAPI.getProducts();
    // Pre-load base64 for images
    const productsWithImages = await Promise.all(data.map(async (p: any) => {
      if (p.image_path) {
        const base64 = await window.electronAPI.getImageBase64(p.image_path);
        return { ...p, image_base64: base64 };
      }
      return p;
    }));
    setProducts(productsWithImages);
  }

  const categories = useMemo(() => {
    const fromProducts = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(['General', ...fromProducts])).sort();
  }, [products]);

  async function handleOpenModal(product?: any) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: (product.price || 0).toString(),
        cost: (product.cost || 0).toString(),
        stock: (product.stock || 0).toString(),
        min_stock: (product.min_stock || 5).toString(),
        category: product.category || '',
        image_path: product.image_path || ''
      });
      if (product.image_path) {
        const base64 = await window.electronAPI.getImageBase64(product.image_path);
        setImagePreview(base64);
      } else {
        setImagePreview(null);
      }
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', cost: '', stock: '', min_stock: '5', category: '', image_path: '' });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  }

  // Ensure Toast is always visible when set
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleSelectImage() {
    const path = await window.electronAPI.selectImage();
    if (path) {
      setFormData({ ...formData, image_path: path });
      const base64 = await window.electronAPI.getImageBase64(path);
      setImagePreview(base64);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
        const productData = {
          ...formData,
          price: parseFloat(formData.price) || 0,
          cost: parseFloat(formData.cost) || 0,
          stock: parseInt(formData.stock) || 0,
          min_stock: parseInt(formData.min_stock) || 5
        };

        if (editingProduct) {
          await window.electronAPI.updateProduct({ ...productData, id: editingProduct.id });
          setToast({ message: 'Producto actualizado correctamente', type: 'success' });
        } else {
          await window.electronAPI.addProduct(productData);
          setToast({ message: 'Producto creado correctamente', type: 'success' });
        }
        setIsModalOpen(false);
        loadProducts();
    } catch (error: any) {
        setToast({ message: error.message || 'Error al guardar el producto', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        const result = await window.electronAPI.deleteProduct(id);
        loadProducts();
        setToast({ message: 'Producto eliminado', type: 'success' });
      } catch (error: any) {
        setToast({ message: error.message || 'Error al eliminar el producto', type: 'error' });
      }
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function handleExport() {
    const dataToExport = products.map(p => ({
      ID: p.id,
      Nombre: p.name,
      Categoría: p.category || 'General',
      Descripción: p.description || '-',
      Precio: p.price.toFixed(2),
      Costo: p.cost.toFixed(2),
      Stock: p.stock,
      StockMin: p.min_stock
    }));
    const result = await window.electronAPI.exportData('Productos', dataToExport);
    if (result && result.success) {
      setToast({ message: 'Datos exportados correctamente a Excel', type: 'success' });
    }
  }

  async function handleGenerateCatalog() {
    // Solo productos con stock > 0
    const availableProducts = products.filter(p => p.stock > 0);
    if (availableProducts.length === 0) {
      setToast({ message: 'No hay productos con stock para el catálogo', type: 'error' });
      return;
    }

    setToast({ message: 'Generando catálogo...', type: 'success' });
    const result = await window.electronAPI.generateCatalogPDF(availableProducts);
    if (result.success) {
      setCatalogPdf(result.base64);
      setIsCatalogModalOpen(true);
    } else {
      setToast({ message: 'Error al generar catálogo', type: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
        <div className="flex gap-2">
            <button 
              onClick={handleGenerateCatalog}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              title="Generar Catálogo PDF"
            >
              <BookOpen size={20} /> Catálogo
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              title="Exportar a Excel"
            >
              <Download size={20} /> Exportar
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} /> Nuevo Producto
            </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
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
        <div className="flex items-center gap-2 bg-card border border-input px-3 py-2 rounded-md w-full max-w-xs">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent outline-none w-full appearance-none"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-4 py-3 w-16">Imagen</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        {product.image_base64 ? (
                            <img src={product.image_base64} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon size={20} className="text-muted-foreground opacity-40" />
                        )}
                    </div>
                </td>
                <td className="px-4 py-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{product.description}</p>
                </td>
                <td className="px-4 py-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full border">
                        {product.category || 'General'}
                    </span>
                </td>
                <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">${product.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-muted-foreground">${product.cost.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`${product.stock <= (product.min_stock || 5) ? 'text-red-500 font-bold flex items-center gap-1' : ''}`}>
                    {product.stock}
                    {product.stock <= (product.min_stock || 5) && <span className="text-xs bg-red-100 text-red-600 px-1 rounded dark:bg-red-900/30 dark:text-red-400">Bajo</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handleOpenModal(product)} className="text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-destructive hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="space-y-2">
                <label className="text-sm font-medium">Imagen del Producto</label>
                <div 
                    onClick={handleSelectImage}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center bg-muted/30 transition-all overflow-hidden relative group"
                >
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <p className="text-white text-xs font-bold">Cambiar</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <ImageIcon size={32} className="text-muted-foreground opacity-40 mb-2" />
                            <p className="text-[10px] text-muted-foreground font-medium">Click para cargar</p>
                        </>
                    )}
                </div>
                {imagePreview && (
                    <button 
                        type="button" 
                        onClick={() => { setFormData({...formData, image_path: ''}); setImagePreview(null); }}
                        className="text-xs text-destructive hover:underline flex items-center gap-1 mt-1"
                    >
                        <X size={12} /> Quitar imagen
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre</label>
                        <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Categoría</label>
                        <input 
                        type="text" 
                        list="category-list"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <datalist id="category-list">
                            {categories.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Stock Inicial</label>
                        <input 
                        required
                        type="number" 
                        step="1"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio Venta</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Costo</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Mínimo</label>
              <input 
                required
                type="number" 
                step="1"
                value={formData.min_stock}
                onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Catálogo de Productos"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:application/pdf;base64,${catalogPdf}`;
                  link.download = `Catalogo_Indigo_Estampas_${new Date().toISOString().slice(0,10)}.pdf`;
                  link.click();
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-all text-sm font-medium"
              >
                <Download size={18} /> Descargar PDF
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const subject = encodeURIComponent('Catálogo de Productos - Indigo Estampas');
                  const body = encodeURIComponent('Hola! Te adjunto nuestro catálogo de productos actualizado.');
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all text-sm font-medium"
              >
                Compartir Email
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent('Hola! Te envío nuestro catálogo de productos: ');
                  window.open(`https://wa.me/?text=${text}`);
                }}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all text-sm font-medium"
              >
                <Share2 size={18} /> WhatsApp
              </button>
            </div>
          </div>
          
          <div className="w-full h-[70vh] rounded-lg overflow-hidden border bg-muted">
            {catalogPdf && (
              <iframe
                src={`data:application/pdf;base64,${catalogPdf}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full"
                title="Catálogo PDF"
              />
            )}
          </div>
          
          <p className="text-xs text-center text-muted-foreground italic">
            Nota: Para compartir por WhatsApp o Email, descarga primero el archivo y luego adjúntalo en la aplicación correspondiente.
          </p>
        </div>
      </Modal>
    </div>
  );
}
