import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    const data = await window.electronAPI.getSuppliers();
    setSuppliers(data);
  }

  function handleOpenModal(supplier?: any) {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingSupplier) {
      await window.electronAPI.updateSupplier({ ...formData, id: editingSupplier.id });
    } else {
      await window.electronAPI.addSupplier(formData);
    }
    setIsModalOpen(false);
    loadSuppliers();
  }

  async function handleDelete(id: number) {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      await window.electronAPI.deleteSupplier(id);
      loadSuppliers();
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleExport() {
    const dataToExport = suppliers.map(s => ({
      ID: s.id,
      Nombre: s.name,
      Email: s.email || '-',
      Teléfono: s.phone || '-',
      Dirección: s.address || '-'
    }));
    await window.electronAPI.exportData('Proveedores', dataToExport);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Proveedores</h2>
        <div className="flex gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              title="Exportar a CSV"
            >
              <Download size={20} /> Exportar
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} /> Nuevo Proveedor
            </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card border border-input px-3 py-2 rounded-md w-full max-w-sm">
        <Search size={20} className="text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Buscar proveedores..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full placeholder:text-muted-foreground"
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">{supplier.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.address}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handleOpenModal(supplier)} className="text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(supplier.id)} className="text-destructive hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron proveedores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Teléfono</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dirección</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
