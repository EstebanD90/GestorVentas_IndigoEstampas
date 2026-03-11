import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';

const isDev = !app.isPackaged;
export const dbPath = isDev 
  ? path.join(app.getAppPath(), 'database.sqlite') 
  : path.join(app.getPath('userData'), 'database.sqlite');

let db: Database.Database;

export function initDB() {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Products
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Suppliers
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      total REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )
  `);

  // Sale Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_sale REAL NOT NULL,
      cost_at_sale REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  // Expenses
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Client Payments
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )
  `);

  // Migrations (Add columns if not exist)
  try { db.prepare('ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE products ADD COLUMN category TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE products ADD COLUMN image_path TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE clients ADD COLUMN balance REAL DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT "paid"').run(); } catch (e) {} // paid, pending
}

// --- Generic Helpers (can be expanded) ---

export const getProducts = () => db.prepare('SELECT * FROM products ORDER BY name').all();
export const addProduct = (p: any) => db.prepare('INSERT INTO products (name, description, price, cost, stock, min_stock, category, image_path) VALUES (@name, @description, @price, @cost, @stock, @min_stock, @category, @image_path)').run({ ...p, min_stock: p.min_stock || 5, category: p.category || 'General' });
export const updateProduct = (p: any) => db.prepare('UPDATE products SET name=@name, description=@description, price=@price, cost=@cost, stock=@stock, min_stock=@min_stock, category=@category, image_path=@image_path WHERE id=@id').run({ ...p, min_stock: p.min_stock || 5, category: p.category || 'General' });
export const deleteProduct = (id: number) => db.prepare('DELETE FROM products WHERE id = ?').run(id);

export const getClients = () => db.prepare('SELECT * FROM clients ORDER BY name').all();
export const addClient = (c: any) => db.prepare('INSERT INTO clients (name, email, phone, address, balance) VALUES (@name, @email, @phone, @address, 0)').run(c);
export const updateClient = (c: any) => db.prepare('UPDATE clients SET name=@name, email=@email, phone=@phone, address=@address WHERE id=@id').run(c);
export const deleteClient = (id: number) => db.prepare('DELETE FROM clients WHERE id = ?').run(id);
export const registerClientPayment = (payment: any) => {
    const transaction = db.transaction((p) => {
        db.prepare('INSERT INTO client_payments (client_id, amount, note) VALUES (@client_id, @amount, @note)').run(p);
        db.prepare('UPDATE clients SET balance = balance - @amount WHERE id = @client_id').run(p);
    });
    return transaction(payment);
};
export const getClientPayments = (clientId: number) => db.prepare('SELECT * FROM client_payments WHERE client_id = ? ORDER BY date DESC').all(clientId);

export const getSuppliers = () => db.prepare('SELECT * FROM suppliers ORDER BY name').all();
export const addSupplier = (s: any) => db.prepare('INSERT INTO suppliers (name, email, phone, address) VALUES (@name, @email, @phone, @address)').run(s);
export const updateSupplier = (s: any) => db.prepare('UPDATE suppliers SET name=@name, email=@email, phone=@phone, address=@address WHERE id=@id').run(s);
export const deleteSupplier = (id: number) => db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);

export const getExpenses = () => db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
export const addExpense = (e: any) => db.prepare('INSERT INTO expenses (description, amount, category, date) VALUES (@description, @amount, @category, @date)').run(e);
export const deleteExpense = (id: number) => db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

export const getSales = () => {
    return db.prepare(`
        SELECT 
            s.*, 
            c.name as client_name,
            GROUP_CONCAT(p.name || ' (x' || si.quantity || ')', ', ') as products_summary
        FROM sales s 
        LEFT JOIN clients c ON s.client_id = c.id 
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        GROUP BY s.id
        ORDER BY s.date DESC
    `).all();
};

export const getSaleItems = (saleId: number) => {
    return db.prepare(`
        SELECT si.*, p.name 
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
    `).all(saleId);
};

export const deleteSale = (id: number) => {
    const deleteTransaction = db.transaction((saleId) => {
        // 1. Get items to restore stock
        const items = db.prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?').all(saleId) as any[];
        
        // 2. Restore stock
        const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
        for (const item of items) {
            updateStock.run(item.quantity, item.product_id);
        }

        // 3. Delete items
        db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId);

        // 4. Delete sale
        db.prepare('DELETE FROM sales WHERE id = ?').run(saleId);
    });

    try {
        deleteTransaction(id);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
};

export const clearSalesHistory = () => {
    const clearTransaction = db.transaction(() => {
        // 1. Get all items to restore stock (optional? Usually clearing history implies resetting, but let's be safe and just delete data or restore? 
        // If the user wants to clear HISTORY but keep current stock state, we shouldn't restore. 
        // BUT, if they are deleting sales, logic suggests undoing the sale.
        // However, "Borrar todo" usually means "Clean slate of records". 
        // If I restore stock for ALL past sales, stock counts will skyrocket to initial values.
        // Let's assume "Delete All" is for cleaning up test data or resetting.
        // I will Restore Stock to be consistent with "Delete single sale".
        
        const items = db.prepare('SELECT product_id, quantity FROM sale_items').all() as any[];
        const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
        
        for (const item of items) {
            updateStock.run(item.quantity, item.product_id);
        }

        db.prepare('DELETE FROM sale_items').run();
        db.prepare('DELETE FROM sales').run();
        // Reset sequence? Not strictly necessary but clean.
        db.prepare('DELETE FROM sqlite_sequence WHERE name="sales" OR name="sale_items"').run();
    });

    try {
        clearTransaction();
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
};

export const createSale = (saleData: { client_id: number | null, items: any[], payment_status?: 'paid' | 'pending' }) => {
    const createSaleTransaction = db.transaction((sale) => {
        let total = 0;
        for (const item of sale.items) {
            total += item.price * item.quantity;
        }

        const paymentStatus = sale.payment_status || 'paid';
        const result = db.prepare('INSERT INTO sales (client_id, total, payment_status) VALUES (?, ?, ?)').run(sale.client_id, total, paymentStatus);
        const saleId = result.lastInsertRowid;

        // If on credit (pending), update client balance
        if (paymentStatus === 'pending' && sale.client_id) {
            db.prepare('UPDATE clients SET balance = balance + ? WHERE id = ?').run(total, sale.client_id);
        }

        const insertItem = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale, cost_at_sale) VALUES (?, ?, ?, ?, ?)');
        const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

        for (const item of sale.items) {
            // Get current cost
            const product = db.prepare('SELECT cost FROM products WHERE id = ?').get(item.id) as any;
            insertItem.run(saleId, item.id, item.quantity, item.price, product.cost);
            updateStock.run(item.quantity, item.id);
        }
        return saleId;
    });

    return createSaleTransaction(saleData);
};

export const getDashboardStats = () => {
    const salesCount = db.prepare('SELECT count(*) as count FROM sales').get() as any;
    const productsCount = db.prepare('SELECT count(*) as count FROM products').get() as any;
    const clientsCount = db.prepare('SELECT count(*) as count FROM clients').get() as any;
    const totalRevenue = db.prepare('SELECT sum(total) as total FROM sales').get() as any;
    
    const totalOpExpenses = db.prepare('SELECT sum(amount) as total FROM expenses').get() as any;
    const totalCOGS = db.prepare('SELECT sum(cost_at_sale * quantity) as total FROM sale_items').get() as any;
    
    const totalExpenses = (totalOpExpenses.total || 0) + (totalCOGS.total || 0);
    
    // Low stock products
    const lowStockProducts = db.prepare('SELECT * FROM products WHERE stock <= min_stock').all();

    // Last 30 days sales (ensure all days are present for chart)
    const salesHistory = db.prepare(`
        WITH RECURSIVE days(date) AS (
          SELECT date('now', '-29 days')
          UNION ALL
          SELECT date(date, '+1 day') FROM days WHERE date < date('now')
        )
        SELECT 
            strftime('%d/%m', days.date) as day, 
            COALESCE(SUM(sales.total), 0) as total
        FROM days
        LEFT JOIN sales ON date(sales.date) = days.date
        GROUP BY days.date
        ORDER BY days.date
    `).all();

    // Top 5 Best Selling Products
    const topProducts = db.prepare(`
        SELECT p.name, sum(si.quantity) as sold 
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.id
        ORDER BY sold DESC
        LIMIT 5
    `).all();

    // Expenses by category for Pie Chart
    const expensesByCategory = db.prepare(`
        SELECT category, SUM(amount) as total
        FROM expenses
        GROUP BY category
    `).all();

    return {
        salesCount: salesCount.count,
        productsCount: productsCount.count,
        clientsCount: clientsCount.count,
        totalRevenue: totalRevenue.total || 0,
        totalExpenses: totalExpenses,
        lowStockProducts,
        salesHistory,
        topProducts,
        expensesByCategory
    };
};

export const backupDB = (targetPath: string) => {
    try {
        db.backup(targetPath);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
};

export const restoreDB = (sourcePath: string) => {
    try {
        // Close current connection
        db.close();
        // Copy file
        fs.copySync(sourcePath, dbPath);
        // Reopen
        initDB();
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
};
