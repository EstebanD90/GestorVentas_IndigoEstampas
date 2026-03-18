import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Products
  getProducts: () => ipcRenderer.invoke('get-products'),
  addProduct: (p: any) => ipcRenderer.invoke('add-product', p),
  updateProduct: (p: any) => ipcRenderer.invoke('update-product', p),
  deleteProduct: (id: number) => ipcRenderer.invoke('delete-product', id),

  // Clients
  getClients: () => ipcRenderer.invoke('get-clients'),
  addClient: (c: any) => ipcRenderer.invoke('add-client', c),
  updateClient: (c: any) => ipcRenderer.invoke('update-client', c),
  deleteClient: (id: number) => ipcRenderer.invoke('delete-client', id),
  registerClientPayment: (p: any) => ipcRenderer.invoke('register-client-payment', p),
  getClientPayments: (id: number) => ipcRenderer.invoke('get-client-payments', id),
  deleteClientPayment: (id: number) => ipcRenderer.invoke('delete-client-payment', id),

  // Suppliers
  getSuppliers: () => ipcRenderer.invoke('get-suppliers'),
  addSupplier: (s: any) => ipcRenderer.invoke('add-supplier', s),
  updateSupplier: (s: any) => ipcRenderer.invoke('update-supplier', s),
  deleteSupplier: (id: number) => ipcRenderer.invoke('delete-supplier', id),

  // Expenses
  getExpenses: () => ipcRenderer.invoke('get-expenses'),
  addExpense: (e: any) => ipcRenderer.invoke('add-expense', e),
  updateExpense: (e: any) => ipcRenderer.invoke('update-expense', e),
  deleteExpense: (id: number) => ipcRenderer.invoke('delete-expense', id),

  // Sales
  getSales: () => ipcRenderer.invoke('get-sales'),
  getSaleItems: (id: number) => ipcRenderer.invoke('get-sale-items', id),
  createSale: (data: any) => ipcRenderer.invoke('create-sale', data),
  deleteSale: (id: number) => ipcRenderer.invoke('delete-sale', id),
  clearSalesHistory: () => ipcRenderer.invoke('clear-sales-history'),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  printTicket: (saleData: any) => ipcRenderer.invoke('print-ticket', saleData),
  openInvoicesFolder: () => ipcRenderer.invoke('open-invoices-folder'),
  getBusinessSettings: () => ipcRenderer.invoke('get-business-settings'),
  updateBusinessSettings: (settings: any) => ipcRenderer.invoke('update-business-settings', settings),
  selectImage: () => ipcRenderer.invoke('select-image'),
  getImageBase64: (path: string) => ipcRenderer.invoke('get-image-base64', path),
  generateCatalogPDF: (products: any) => ipcRenderer.invoke('generate-catalog-pdf', products),

  // Backup/Restore
  backupDB: () => ipcRenderer.invoke('backup-db'),
  backupFull: () => ipcRenderer.invoke('backup-full'),
  restoreDB: () => ipcRenderer.invoke('restore-db'),
  restoreFull: () => ipcRenderer.invoke('restore-full'),
  optimizeDB: () => ipcRenderer.invoke('optimize-db'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),

  // System
  exportData: (type: string, data: any) => ipcRenderer.invoke('export-data', { type, data }),
});
