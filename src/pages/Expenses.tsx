import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Pencil, X, Check, Save } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Otros', date: new Date().toISOString().split('T')[0] });
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    const data = await window.electronAPI.getExpenses();
    setExpenses(data);
  }

  const categories = [
    'Alquiler',
    'Mantenimiento',
    'Mercadería',
    'Monotributo',
    'Marketing / Publicidad',
    'Servicios',
    'Sueldos',
    'Otros'
  ];

  async function handleExport() {
    const dataToExport = expenses.map(e => ({
      Fecha: new Date(e.date).toLocaleString(),
      Descripción: e.description,
      Categoría: e.category,
      Monto: e.amount.toFixed(2)
    }));
    const result = await window.electronAPI.exportData('Gastos', dataToExport);
    if (result && result.success) {
      setToast({ message: 'Datos exportados correctamente a Excel', type: 'success' });
    }
  }

  function handleOpenModal(expense?: any) {
    if (expense) {
      setEditingExpense(expense);
      setForm({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        date: new Date(expense.date).toISOString().split('T')[0]
      });
    } else {
      setEditingExpense(null);
      setForm({ description: '', amount: '', category: 'Otros', date: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    const expenseData = {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date(form.date).toISOString()
    };

    if (editingExpense) {
      await window.electronAPI.updateExpense({ ...expenseData, id: editingExpense.id });
      setToast({ message: 'Gasto actualizado correctamente', type: 'success' });
    } else {
      await window.electronAPI.addExpense(expenseData);
      setToast({ message: 'Gasto registrado correctamente', type: 'success' });
    }

    setIsModalOpen(false);
    setForm({ description: '', amount: '', category: 'Otros', date: new Date().toISOString().split('T')[0] });
    loadExpenses();
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este gasto?')) {
      await window.electronAPI.deleteExpense(id);
      loadExpenses();
      setToast({ message: 'Gasto eliminado', type: 'success' });
    }
  }

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

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
        <h2 className="text-3xl font-bold tracking-tight">Control de Gastos</h2>
        <div className="flex gap-2">
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
            <Plus size={20} /> Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-6 bg-card rounded-xl border shadow-sm max-w-md">
         <h3 className="text-sm font-medium text-muted-foreground">Total Gastos (Histórico)</h3>
         <div className="text-3xl font-bold text-red-500 mt-2">-${totalExpenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
      </div>

      {/* List */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-medium">{expense.description}</td>
                <td className="px-4 py-3">
                  <span className="bg-secondary px-2 py-1 rounded text-xs">
                    {expense.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-red-500 font-medium">
                  -${expense.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button 
                    onClick={() => handleOpenModal(expense)}
                    className="text-blue-500 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="text-destructive hover:text-red-600 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
             {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay gastos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingExpense ? "Editar Gasto" : "Registrar Nuevo Gasto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <input
              type="text"
              required
              className="w-full bg-background border border-input rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej. Pago de Luz"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto ($)</label>
              <input
                type="number"
                required
                step="0.01"
                className="w-full bg-background border border-input rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <input
                type="date"
                required
                className="w-full bg-background border border-input rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <select
              className="w-full bg-background border border-input rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Save size={18} /> Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
