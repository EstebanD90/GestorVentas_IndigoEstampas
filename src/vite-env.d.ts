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
    createSale: (data: any) => Promise<any>;
    deleteSale: (id: number) => Promise<any>;
    clearSalesHistory: () => Promise<any>;
    getDashboardStats: () => Promise<any>;

    backupDB: () => Promise<any>;
    restoreDB: () => Promise<any>;
    exportData: (type: string, data: any[]) => Promise<any>;
  }
};
}
