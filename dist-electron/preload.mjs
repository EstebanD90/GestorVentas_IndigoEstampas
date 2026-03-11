"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Products
  getProducts: () => electron.ipcRenderer.invoke("get-products"),
  addProduct: (p) => electron.ipcRenderer.invoke("add-product", p),
  updateProduct: (p) => electron.ipcRenderer.invoke("update-product", p),
  deleteProduct: (id) => electron.ipcRenderer.invoke("delete-product", id),
  // Clients
  getClients: () => electron.ipcRenderer.invoke("get-clients"),
  addClient: (c) => electron.ipcRenderer.invoke("add-client", c),
  updateClient: (c) => electron.ipcRenderer.invoke("update-client", c),
  deleteClient: (id) => electron.ipcRenderer.invoke("delete-client", id),
  registerClientPayment: (p) => electron.ipcRenderer.invoke("register-client-payment", p),
  getClientPayments: (id) => electron.ipcRenderer.invoke("get-client-payments", id),
  // Suppliers
  getSuppliers: () => electron.ipcRenderer.invoke("get-suppliers"),
  addSupplier: (s) => electron.ipcRenderer.invoke("add-supplier", s),
  updateSupplier: (s) => electron.ipcRenderer.invoke("update-supplier", s),
  deleteSupplier: (id) => electron.ipcRenderer.invoke("delete-supplier", id),
  // Expenses
  getExpenses: () => electron.ipcRenderer.invoke("get-expenses"),
  addExpense: (e) => electron.ipcRenderer.invoke("add-expense", e),
  deleteExpense: (id) => electron.ipcRenderer.invoke("delete-expense", id),
  // Sales
  getSales: () => electron.ipcRenderer.invoke("get-sales"),
  getSaleItems: (id) => electron.ipcRenderer.invoke("get-sale-items", id),
  createSale: (data) => electron.ipcRenderer.invoke("create-sale", data),
  deleteSale: (id) => electron.ipcRenderer.invoke("delete-sale", id),
  clearSalesHistory: () => electron.ipcRenderer.invoke("clear-sales-history"),
  getDashboardStats: () => electron.ipcRenderer.invoke("get-dashboard-stats"),
  printTicket: (saleData) => electron.ipcRenderer.invoke("print-ticket", saleData),
  openInvoicesFolder: () => electron.ipcRenderer.invoke("open-invoices-folder"),
  selectImage: () => electron.ipcRenderer.invoke("select-image"),
  getImageBase64: (path) => electron.ipcRenderer.invoke("get-image-base64", path),
  // Backup/Restore
  backupDB: () => electron.ipcRenderer.invoke("backup-db"),
  backupFull: () => electron.ipcRenderer.invoke("backup-full"),
  restoreDB: () => electron.ipcRenderer.invoke("restore-db"),
  checkUpdates: () => electron.ipcRenderer.invoke("check-updates"),
  // System
  exportData: (type, data) => electron.ipcRenderer.invoke("export-data", { type, data })
});
