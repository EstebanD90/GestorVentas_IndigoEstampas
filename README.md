# INDIGO ESTAMPAS - Aplicación de Escritorio

Esta es una aplicación de escritorio moderna para la gestión de ventas, inventario, clientes y proveedores, construida con Electron, React, TypeScript y SQLite.

## Características

- **Dashboard**: Vista general con estadísticas de ventas y accesos rápidos.
- **Productos**: Gestión completa de inventario (Altas, Bajas, Modificaciones).
- **Clientes**: Directorio de clientes con información de contacto.
- **Proveedores**: Directorio de proveedores.
- **Ventas**: Punto de venta (POS) con carrito, selección de clientes y control de stock.
- **Calculadoras**: Herramientas para calcular precios de venta, márgenes y costos.
- **Backup**: Sistema de respaldo y restauración de la base de datos.
- **Tema Oscuro/Claro**: Interfaz adaptable a tus preferencias.

## Requisitos Previos

- Node.js (versión 18 o superior recomendada)
- NPM (incluido con Node.js)

## Instalación

Si es la primera vez que descargas el código, instala las dependencias:

```bash
npm install
# Recompilar módulos nativos para Electron (importante para la base de datos)
npm run rebuild
# O si el script rebuild no existe en package.json (hemos instalado @electron/rebuild):
npx electron-rebuild
```

## Ejecución en Desarrollo

Para iniciar la aplicación en modo de desarrollo (con recarga en caliente):

```bash
npm run dev
```

Esto abrirá la ventana de la aplicación y una terminal con los logs.

## Construcción (Crear Ejecutable)

Para crear un instalador o ejecutable para Windows:

```bash
npm run dist
```

El archivo generado (ej. `GestorDeVentas Setup 0.0.0.exe`) se encontrará en la carpeta `dist`.

## Estructura del Proyecto

- `src/`: Código fuente de la interfaz (React).
  - `pages/`: Vistas principales (Dashboard, Ventas, etc.).
  - `components/`: Componentes reutilizables.
- `electron/`: Código del proceso principal de Electron y manejo de Base de Datos.
  - `main.ts`: Punto de entrada de Electron.
  - `db.ts`: Configuración y consultas de SQLite.
- `dist/` y `dist-electron/`: Carpetas generadas durante la compilación.

## Solución de Problemas

### Error de Base de Datos / Módulos Nativos
Si ves errores relacionados con `better-sqlite3` o `NODE_MODULE_VERSION`, ejecuta:

```bash
npx electron-rebuild
```

Esto asegura que la base de datos sea compatible con la versión de Electron que estás usando.
