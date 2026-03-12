/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    getProducts: () => Promise<any[]>;
    addProduct: (p: any) => Promise<any>;
    updateProduct: (p: any) => Promise<any>;
    deleteProduct: (id: number) => Promise<any>;

    getClients: () => Promise<any[]>;
    addClient: (c: any) => Promise<any>;
    updateClient: (c: any) => Promise<any>;
    deleteClient: (id: number) => Promise<any>;
    registerClientPayment: (p: any) => Promise<any>;
    getClientPayments: (id: number) => Promise<any[]>;

    getSuppliers: () => Promise<any[]>;
    addSupplier: (s: any) => Promise<any>;
    updateSupplier: (s: any) => Promise<any>;
    deleteSupplier: (id: number) => Promise<any>;

    getExpenses: () => Promise<any[]>;
    addExpense: (e: any) => Promise<any>;
    deleteExpense: (id: number) => Promise<any>;

    getSales: () => Promise<any[]>;
    getSaleItems: (id: number) => Promise<any[]>;
    createSale: (data: any) => Promise<any>;
    deleteSale: (id: number) => Promise<any>;
    clearSalesHistory: () => Promise<any>;
    getDashboardStats: () => Promise<any>;

    printTicket: (saleData: any) => Promise<any>;
    backupDB: () => Promise<any>;
    backupFull: () => Promise<any>;
    restoreDB: () => Promise<any>;
    restoreFull: () => Promise<any>;
    optimizeDB: () => Promise<any>;
    checkUpdates: () => Promise<any>;
    exportData: (type: string, data: any[]) => Promise<any>;
    selectImage: () => Promise<string | null>;
    getImageBase64: (path: string) => Promise<string | null>;
    openInvoicesFolder: () => Promise<void>;
    getBusinessSettings: () => Promise<any>;
    updateBusinessSettings: (settings: any) => Promise<any>;
    registerClientPayment: (data: any) => Promise<any>;
    getClientPayments: (clientId: number) => Promise<any[]>;
    deleteClientPayment: (id: number) => Promise<any>;
  }
}

