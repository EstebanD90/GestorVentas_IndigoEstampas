import { useState, useEffect } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Otros' });

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    const data = await window.electronAPI.getExpenses();
    setExpenses(data);
  }

  async function handleExport() {
    const dataToExport = expenses.map(e => ({
      ID: e.id,
      Fecha: new Date(e.date).toLocaleString(),
      Descripción: e.description,
      Categoría: e.category,
      Monto: e.amount.toFixed(2)
    }));
    await window.electronAPI.exportData('Gastos', dataToExport);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    await window.electronAPI.addExpense({
      ...form,
      amount: parseFloat(form.amount),
      date: new Date().toISOString()
    });
    setForm({ description: '', amount: '', category: 'Otros' });
    loadExpenses();
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este gasto?')) {
      await window.electronAPI.deleteExpense(id);
      loadExpenses();
    }
  }

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Control de Gastos</h2>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
          title="Exportar a CSV"
        >
          <Download size={20} /> Exportar
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-6 bg-card rounded-xl border shadow-sm max-w-md">
         <h3 className="text-sm font-medium text-muted-foreground">Total Gastos (Histórico)</h3>
         <div className="text-3xl font-bold text-red-500 mt-2">-${totalExpenses.toFixed(2)}</div>
      </div>

      {/* Add Form */}
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold mb-4">Registrar Nuevo Gasto</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <input
              type="text"
              required
              className="w-full bg-background border border-input rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej. Pago de Luz"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">Monto ($)</label>
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
          <div className="w-40">
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              className="w-full bg-background border border-input rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option>Alquiler</option>
              <option>Mantenimiento</option>
              <option>Mercadería</option>
              <option>Monotributo</option>
              <option>Marketing / Publicidad</option>
              <option>Servicios</option>
              <option>Sueldos</option>
              <option>Otros</option>
            </select>
          </div>
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors flex items-center gap-2 h-[42px]">
            <Plus size={18} /> Registrar
          </button>
        </form>
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
              <th className="px-4 py-3 text-center">Acciones</th>
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
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
    </div>
  );
}
