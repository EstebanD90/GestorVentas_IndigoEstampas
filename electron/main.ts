import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'node:url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

// Import app name from shared constants
import { APP_NAME } from '../src/constants';

// Create Facturas directory if not exists
const invoicesPath = path.join(app.getPath('documents'), APP_NAME, 'Facturas');
const assetsPath = path.join(app.getPath('documents'), APP_NAME, 'Assets');
const productImagesPath = path.join(app.getPath('documents'), APP_NAME, 'Productos');

[invoicesPath, assetsPath, productImagesPath].forEach(p => {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
});

import { 
  initDB, dbPath,
  getProducts, addProduct, updateProduct, deleteProduct,
  getClients, addClient, updateClient, deleteClient, registerClientPayment, getClientPayments,
  getSuppliers, addSupplier, updateSupplier, deleteSupplier,
  getExpenses, addExpense, deleteExpense,
  createSale, getSales, getSaleItems, deleteSale, clearSalesHistory, getDashboardStats, backupDB, restoreDB
} from './db';

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
    autoHideMenuBar: true,
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  initDB();
  
  // Products
  ipcMain.handle('get-products', () => getProducts());
  ipcMain.handle('add-product', (_, p) => addProduct(p));
  ipcMain.handle('update-product', (_, p) => updateProduct(p));
  ipcMain.handle('delete-product', (_, id) => deleteProduct(id));

  // Clients
  ipcMain.handle('get-clients', () => getClients());
  ipcMain.handle('add-client', (_, c) => addClient(c));
  ipcMain.handle('update-client', (_, c) => updateClient(c));
  ipcMain.handle('delete-client', (_, id) => deleteClient(id));
  ipcMain.handle('register-client-payment', (_, p) => registerClientPayment(p));
  ipcMain.handle('get-client-payments', (_, id) => getClientPayments(id));

  // Suppliers
  ipcMain.handle('get-suppliers', () => getSuppliers());
  ipcMain.handle('add-supplier', (_, s) => addSupplier(s));
  ipcMain.handle('update-supplier', (_, s) => updateSupplier(s));
  ipcMain.handle('delete-supplier', (_, id) => deleteSupplier(id));

  // Expenses
  ipcMain.handle('get-expenses', () => getExpenses());
  ipcMain.handle('add-expense', (_, e) => addExpense(e));
  ipcMain.handle('delete-expense', (_, id) => deleteExpense(id));

  // Sales
  ipcMain.handle('get-sales', () => getSales());
  ipcMain.handle('get-sale-items', (_, id) => getSaleItems(id));
  ipcMain.handle('create-sale', (_, data) => createSale(data));
  ipcMain.handle('delete-sale', (_, id) => deleteSale(id));
  ipcMain.handle('clear-sales-history', () => clearSalesHistory());
  ipcMain.handle('get-dashboard-stats', () => getDashboardStats());

  // Assets & Product Images
  ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
    });
    
    if (result.canceled) return null;
    
    const sourcePath = result.filePaths[0];
    const ext = path.extname(sourcePath);
    const fileName = `${Date.now()}${ext}`;
    const destPath = path.join(productImagesPath, fileName);
    
    fs.copyFileSync(sourcePath, destPath);
    return destPath;
  });

  ipcMain.handle('get-image-base64', (_, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1);
    return `data:image/${ext};base64,${buffer.toString('base64')}`;
  });

  // Print Ticket (Auto-save to PDF)
  ipcMain.handle('print-ticket', async (_, saleData) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Venta_${saleData.id || 'NUEVA'}_${timestamp}.pdf`;
    const fullPath = path.join(invoicesPath, fileName);

    // Try to load logo if exists in Assets
    let logoBase64 = '';
    const possibleLogos = ['logo.png', 'logo.jpg', 'logo.jpeg'];
    for (const logoName of possibleLogos) {
      const p = path.join(assetsPath, logoName);
      if (fs.existsSync(p)) {
        const buffer = fs.readFileSync(p);
        const ext = path.extname(p).slice(1);
        logoBase64 = `data:image/${ext};base64,${buffer.toString('base64')}`;
        break;
      }
    }

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
      }
    });

    const itemsHtml = saleData.items.map((item: any) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} x${item.quantity}</td>
        <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">$${(item.price_at_sale * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { 
                margin: 10mm;
                size: auto;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              width: 100%;
              max-width: 100mm;
              margin: 0 auto; 
              padding: 20px;
              font-size: 14px;
              line-height: 1.4;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo {
              max-width: 150px;
              max-height: 80px;
              margin-bottom: 10px;
            }
            .business-name {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .ticket-info {
              margin: 5px 0;
              font-size: 12px;
              color: #666;
            }
            .client-info {
              margin-bottom: 20px;
              padding: 10px;
              background: #f9f9f9;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              text-align: left;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
              font-size: 12px;
              text-transform: uppercase;
            }
            .total-section {
              border-top: 2px solid #333;
              padding-top: 15px;
              text-align: right;
            }
            .total-amount {
              margin: 0;
              font-size: 20px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px dashed #ccc;
              font-size: 12px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ''}
            <h1 class="business-name">${APP_NAME}</h1>
            <p class="ticket-info">Ticket de Venta #${saleData.id || 'NUEVA'}</p>
            <p class="ticket-info">Fecha: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="client-info">
            <p style="margin: 0;"><strong>Cliente:</strong> ${saleData.client_name || 'Consumidor Final'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Detalle</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <p class="total-amount">TOTAL: $${saleData.total.toFixed(2)}</p>
            <p style="margin: 5px 0; font-size: 12px;"><strong>Estado:</strong> ${saleData.payment_status === 'pending' ? 'CUENTA CORRIENTE' : 'PAGADO'}</p>
          </div>

          <div class="footer">
            <p>¡Gracias por confiar en nosotros!</p>
            <p style="font-size: 10px; margin-top: 5px;">Archivo: ${fileName}</p>
          </div>
        </body>
      </html>
    `;

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    
    return new Promise((resolve) => {
      printWin.webContents.on('did-finish-load', async () => {
        try {
          const data = await printWin.webContents.printToPDF({
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            pageSize: 'A4',
            printBackground: true
          });
          fs.writeFileSync(fullPath, data);
          printWin.close();
          // Optionally open the folder or the file
          // shell.showItemInFolder(fullPath);
          resolve({ success: true, path: fullPath });
        } catch (error) {
          console.error('Error generating PDF:', error);
          printWin.close();
          resolve({ success: false, error: String(error) });
        }
      });
    });
  });

  // Open Facturas Folder
  ipcMain.handle('open-invoices-folder', () => {
    shell.openPath(invoicesPath);
  });

  // Backup/Restore
  ipcMain.handle('backup-db', async () => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Guardar Backup de Base de Datos',
      defaultPath: `backup_db_${new Date().toISOString().slice(0, 10)}.sqlite`,
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
    });
    if (filePath) {
      return backupDB(filePath);
    }
    return { success: false, error: 'Cancelado' };
  });

  ipcMain.handle('backup-full', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Seleccionar Carpeta para Backup Completo (Drive/Dropbox/Local)',
      properties: ['openDirectory', 'createDirectory']
    });

    if (filePaths && filePaths.length > 0) {
      const destBase = path.join(filePaths[0], `Backup_${APP_NAME}_${new Date().toISOString().slice(0, 10)}`);
      try {
        if (!fs.existsSync(destBase)) fs.mkdirSync(destBase);
        
        // Copy Database
        fs.copyFileSync(dbPath, path.join(destBase, 'database.sqlite'));
        
        // Copy Folders
        const userDocs = path.join(app.getPath('documents'), APP_NAME);
        if (fs.existsSync(userDocs)) {
            const folders = ['Facturas', 'Assets', 'Productos'];
            folders.forEach(f => {
                const src = path.join(userDocs, f);
                const dst = path.join(destBase, f);
                if (fs.existsSync(src)) {
                    // Use fs-extra copySync for directories
                    // @ts-ignore
                    import('fs-extra').then(fse => fse.default.copySync(src, dst));
                }
            });
        }
        return { success: true, path: destBase };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'Cancelado' };
  });

  ipcMain.handle('check-updates', async () => {
    try {
        const { net } = await import('electron');
        const response = await net.fetch(UPDATE_URL);
        if (!response.ok) throw new Error('Servidor no disponible');
        const remote = await response.json();
        return { success: true, remoteVersion: remote.version, updateUrl: remote.url };
    } catch (e: any) {
        return { success: false, error: 'No se pudo conectar al servidor de actualizaciones.' };
    }
  });

  ipcMain.handle('restore-db', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Seleccionar Backup',
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }],
      properties: ['openFile']
    });
    if (filePaths && filePaths.length > 0) {
      return restoreDB(filePaths[0]);
    }
    return { success: false, error: 'Cancelado' };
  });

  // Export Data
  ipcMain.handle('export-data', async (_, { type, data }) => {
    const { filePath } = await dialog.showSaveDialog({
      title: `Exportar ${type}`,
      defaultPath: `${type}-${new Date().toISOString().split('T')[0]}.csv`,
      filters: [{ name: 'CSV File', extensions: ['csv'] }]
    });

    if (filePath && data.length > 0) {
      try {
        const fs = await import('fs/promises');
        // Get headers
        const headers = Object.keys(data[0]).join(',');
        // Get rows
        const rows = data.map((row: any) => Object.values(row).map((v: any) => 
          typeof v === 'string' && v.includes(',') ? `"${v}"` : v
        ).join(','));
        
        const csvContent = [headers, ...rows].join('\n');
        await fs.writeFile(filePath, csvContent, 'utf-8');
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
    return { success: false, error: 'Cancelado' };
  });

  createWindow();
});
