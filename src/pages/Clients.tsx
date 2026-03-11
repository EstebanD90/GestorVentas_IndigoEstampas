import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, DollarSign, History, Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const data = await window.electronAPI.getClients();
    setClients(data);
  }

  function handleOpenModal(client?: any) {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingClient) {
      await window.electronAPI.updateClient({ ...formData, id: editingClient.id });
    } else {
      await window.electronAPI.addClient(formData);
    }
    setIsModalOpen(false);
    loadClients();
  }

  async function handleDelete(id: number) {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await window.electronAPI.deleteClient(id);
      loadClients();
    }
  }

  async function openPaymentModal(client: any) {
    setSelectedClientForPayment(client);
    setPaymentAmount('');
    setPaymentNote('');
    
    // Load history
    const history = await window.electronAPI.getClientPayments(client.id);
    setPaymentHistory(history);
    
    setIsPaymentModalOpen(true);
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientForPayment || !paymentAmount) return;

    await window.electronAPI.registerClientPayment({
      client_id: selectedClientForPayment.id,
      amount: parseFloat(paymentAmount),
      note: paymentNote
    });

    setIsPaymentModalOpen(false);
    loadClients();
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleExport() {
    const dataToExport = clients.map(c => ({
      ID: c.id,
      Nombre: c.name,
      Email: c.email || '-',
      Teléfono: c.phone || '-',
      Dirección: c.address || '-',
      Saldo: c.balance.toFixed(2)
    }));
    await window.electronAPI.exportData('Clientes', dataToExport);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
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
              <Plus size={20} /> Nuevo Cliente
            </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card border border-input px-3 py-2 rounded-md w-full max-w-sm">
        <Search size={20} className="text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Buscar clientes..." 
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
              <th className="px-4 py-3 text-right">Saldo (Deuda)</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">{client.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.address}</td>
                <td className={`px-4 py-3 text-right font-bold ${client.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ${(client.balance || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right space-x-2 flex justify-end">
                   <button 
                    onClick={() => openPaymentModal(client)} 
                    className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded mr-2"
                    title="Registrar Pago / Ver Historial"
                  >
                    <DollarSign size={18} />
                  </button>
                  <button onClick={() => handleOpenModal(client)} className="text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="text-destructive hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
             {filteredClients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingClient ? "Editar Cliente" : "Nuevo Cliente"}
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

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Cuenta Corriente: ${selectedClientForPayment?.name}`}
      >
        <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                <span className="font-medium">Saldo Actual (Deuda):</span>
                <span className={`text-xl font-bold ${selectedClientForPayment?.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ${(selectedClientForPayment?.balance || 0).toFixed(2)}
                </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 border-b pb-6">
                <h3 className="font-semibold text-sm">Registrar Pago</h3>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input 
                            type="number" 
                            step="0.01"
                            placeholder="Monto ($)"
                            required
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Nota (opcional)"
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors">
                    Registrar Pago
                </button>
            </form>

            <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <History size={16} /> Historial de Pagos
                </h3>
                <div className="max-h-40 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left">Fecha</th>
                                <th className="px-3 py-2 text-left">Nota</th>
                                <th className="px-3 py-2 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paymentHistory.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-3 py-2 text-muted-foreground">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="px-3 py-2">{p.note || '-'}</td>
                                    <td className="px-3 py-2 text-right font-medium text-green-600">+${p.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                            {paymentHistory.length === 0 && (
                                <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">Sin pagos registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
}
