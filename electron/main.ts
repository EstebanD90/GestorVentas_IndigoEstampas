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

// Import app name and update URL from shared constants
import { APP_NAME, UPDATE_URL, APP_VERSION } from '../src/constants';

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
  getClients, addClient, updateClient, deleteClient, registerClientPayment, getClientPayments, deleteClientPayment,
  getSuppliers, addSupplier, updateSupplier, deleteSupplier,
  getExpenses, addExpense, deleteExpense,
  createSale, getSales, getSaleItems, deleteSale, clearSalesHistory, getDashboardStats, backupDB, restoreDB, optimizeDB,
  getBusinessSettings, updateBusinessSettings
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
  
  // Business Settings
  ipcMain.handle('get-business-settings', () => getBusinessSettings());
  ipcMain.handle('update-business-settings', (_, settings) => updateBusinessSettings(settings));

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
  ipcMain.handle('delete-client-payment', (_, id) => deleteClientPayment(id));

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

    // Load business settings
    const settings = getBusinessSettings();
    const bizName = settings?.name || APP_NAME;

    // Try to load logo
    let logoBase64 = '';
    if (settings?.logo_path && fs.existsSync(settings.logo_path)) {
      const buffer = fs.readFileSync(settings.logo_path);
      const ext = path.extname(settings.logo_path).slice(1);
      logoBase64 = `data:image/${ext};base64,${buffer.toString('base64')}`;
    }

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
      }
    });

    const itemsHtml = saleData.items.map((item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
          <div style="font-size: 11px; color: #666;">$${item.price.toFixed(2)} x ${item.quantity}</div>
        </td>
        <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { 
                margin: 15mm;
                size: A4;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              width: 100%;
              max-width: 180mm;
              margin: 0 auto; 
              padding: 20px;
              font-size: 14px;
              line-height: 1.5;
              color: #333;
              background-color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .logo-container {
              margin-bottom: 15px;
            }
            .logo {
              max-width: 60mm;
              max-height: 40mm;
              object-fit: contain;
            }
            .business-name {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
              text-transform: uppercase;
              color: #000;
            }
            .ticket-info {
              margin: 4px 0;
              font-size: 13px;
              color: #444;
            }
            .divider {
              border-top: 1px solid #eee;
              margin: 20px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .client-info h4, .sale-info h4 {
              margin: 0 0 8px 0;
              color: #666;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 1px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              text-align: left;
              border-bottom: 2px solid #000;
              padding: 12px 8px;
              font-size: 12px;
              text-transform: uppercase;
              background: #f4f4f4;
            }
            td {
              padding: 12px 8px;
              border-bottom: 1px solid #eee;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
              float: right;
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 22px;
              border-top: 2px solid #000;
              padding-top: 10px;
              color: #000;
            }
            .payment-status {
              margin-top: 10px;
              font-size: 13px;
              text-transform: uppercase;
              font-weight: bold;
              background: #000;
              color: #fff;
              display: inline-block;
              padding: 5px 15px;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 100px;
              padding-top: 30px;
              border-top: 1px solid #eee;
              font-size: 13px;
              clear: both;
            }
            .social-links {
              margin-top: 8px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoBase64 ? `<div class="logo-container"><img src="${logoBase64}" class="logo" /></div>` : ''}
            <h1 class="business-name">${bizName}</h1>
            ${settings?.address ? `<p class="ticket-info">${settings.address}</p>` : ''}
            ${settings?.phone ? `<p class="ticket-info">Tel: ${settings.phone}</p>` : ''}
            ${settings?.cuit ? `<p class="ticket-info">CUIT: ${settings.cuit}</p>` : ''}
          </div>
          
          <div class="info-grid">
            <div class="client-info">
              <h4>CLIENTE</h4>
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${String(saleData.client_name || 'CONSUMIDOR FINAL').toUpperCase()}</p>
            </div>
            <div class="sale-info" style="text-align: right;">
              <h4>COMPROBANTE</h4>
              <p style="margin: 0; font-weight: bold;">TICKET DE VENTA #${saleData.id || 'NUEVA'}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Fecha: ${new Date().toLocaleString('es-AR')}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>DESCRIPCIÓN DE PRODUCTO</th>
                <th style="text-align: right;">CANTIDAD</th>
                <th style="text-align: right;">PRECIO UNIT.</th>
                <th style="text-align: right;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${saleData.items.map((item: any) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td style="text-align: right;">${item.quantity}</td>
                  <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>TOTAL A PAGAR:</span>
              <span>$${saleData.total.toFixed(2)}</span>
            </div>
            <div class="payment-status">
              ${saleData.payment_status === 'pending' ? 'SALDO EN CUENTA CORRIENTE' : 'COBRADO / PAGADO'}
            </div>
          </div>

          <div class="footer">
            <p style="font-weight: bold;">${(settings?.footer_message || '¡Gracias por su compra!').toUpperCase()}</p>
            <div class="social-links">
                ${settings?.instagram ? `<span>Instagram: ${settings.instagram} </span>` : ''}
                ${settings?.facebook ? `<span>Facebook: ${settings.facebook}</span>` : ''}
            </div>
            <p style="font-size: 10px; margin-top: 20px; color: #999;">Este documento no tiene validez fiscal.</p>
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

  ipcMain.handle('optimize-db', () => optimizeDB());

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
            const fse = await import('fs-extra');
            folders.forEach(f => {
                const src = path.join(userDocs, f);
                const dst = path.join(destBase, f);
                if (fs.existsSync(src)) {
                    fse.default.copySync(src, dst);
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

  ipcMain.handle('restore-full', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Seleccionar Carpeta del Backup Completo',
      properties: ['openDirectory']
    });

    if (filePaths && filePaths.length > 0) {
      const sourceBase = filePaths[0];
      const dbFile = path.join(sourceBase, 'database.sqlite');
      
      if (!fs.existsSync(dbFile)) {
        return { success: false, error: 'No se encontró el archivo database.sqlite en la carpeta seleccionada.' };
      }

      try {
        // Restore DB
        restoreDB(dbFile);
        
        // Restore Folders
        const userDocs = path.join(app.getPath('documents'), APP_NAME);
        const folders = ['Facturas', 'Assets', 'Productos'];
        const fse = await import('fs-extra');
        
        folders.forEach(f => {
            const src = path.join(sourceBase, f);
            const dst = path.join(userDocs, f);
            if (fs.existsSync(src)) {
                fse.default.copySync(src, dst, { overwrite: true });
            }
        });
        
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'Cancelado' };
  });

  ipcMain.handle('check-updates', async () => {
    try {
        const { net } = await import('electron');
        // Agregamos un timestamp para evitar que el navegador o GitHub nos den una respuesta cacheada vieja
        const noCacheUrl = `${UPDATE_URL}?t=${Date.now()}`;
        console.log('Checking updates at:', noCacheUrl);
        
        const response = await net.fetch(noCacheUrl);
        if (!response.ok) {
          console.error('Update server responded with status:', response.status);
          throw new Error(`Servidor respondió con estado ${response.status}`);
        }
        const remote = await response.json();
        console.log('Remote version found:', remote.version, 'Local version:', APP_VERSION);
        
        // Limpiamos posibles espacios en blanco de las versiones
        const remoteV = String(remote.version).trim();
        const localV = String(APP_VERSION).trim();
        
        return { 
          success: true, 
          remoteVersion: remoteV, 
          updateUrl: remote.url,
          hasUpdate: remoteV !== localV 
        };
    } catch (e: any) {
        console.error('Update check failed:', e);
        return { success: false, error: `No se pudo conectar al servidor: ${e.message}` };
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
      defaultPath: `${type}-${new Date().toISOString().split('T')[0]}.xlsx`,
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
    });

    if (filePath && data.length > 0) {
      try {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
        
        // Auto-size columns
        const objectMaxLength: any[] = [];
        const keys = Object.keys(data[0]);
        
        // Initialize with header lengths
        keys.forEach((key) => {
          objectMaxLength.push(key.length);
        });

        // Compare with data lengths
        data.forEach((row: any) => {
          keys.forEach((key, i) => {
            const value = row[key] ? String(row[key]) : "";
            if (value.length > objectMaxLength[i]) {
              objectMaxLength[i] = value.length;
            }
          });
        });

        worksheet["!cols"] = objectMaxLength.map((w) => ({ wch: w + 2 }));

        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        fs.writeFileSync(filePath, buf);
        
        return { success: true };
      } catch (error) {
        console.error('Export error:', error);
        return { success: false, error: String(error) };
      }
    }
    return { success: false, error: 'Cancelado' };
  });

  createWindow();
});
