import { useState, useEffect } from 'react';
import { Save, Upload, Cloud, RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { APP_VERSION } from '@/constants';

export default function Backup() {
  const [message, setMessage] = useState('');
  const [updateInfo, setUpdateInfo] = useState<{ remoteVersion: string, updateUrl: string, hasUpdate: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  const handleBackupDB = async () => {
    const res = await window.electronAPI.backupDB();
    if (res.success) setMessage('Backup de base de datos realizado con éxito');
    else if (res.error !== 'Cancelado') setMessage('Error: ' + res.error);
  };

  const handleBackupFull = async () => {
    setMessage('Iniciando backup completo...');
    const res = await window.electronAPI.backupFull();
    if (res.success) {
      setMessage(`Backup completo realizado con éxito en: ${res.path}. Puedes subir esta carpeta a tu Drive o Dropbox.`);
    } else if (res.error !== 'Cancelado') {
      setMessage('Error al realizar backup completo: ' + res.error);
    } else {
      setMessage('');
    }
  };

  const handleCheckUpdates = async () => {
    setChecking(true);
    setMessage('');
    try {
      const res = await window.electronAPI.checkUpdates();
      if (res.success) {
        const hasUpdate = res.remoteVersion !== APP_VERSION;
        setUpdateInfo({ remoteVersion: res.remoteVersion, updateUrl: res.updateUrl, hasUpdate });
        if (!hasUpdate) setMessage('Ya tienes la última versión instalada (' + APP_VERSION + ')');
      } else {
        setMessage(res.error);
      }
    } catch (e) {
      setMessage('Error al conectar con el servidor de actualizaciones.');
    } finally {
      setChecking(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('¿Estás seguro? Esto sobrescribirá los datos actuales de la base de datos.')) return;
    const res = await window.electronAPI.restoreDB();
    if (res.success) {
      setMessage('Base de datos restaurada. Reiniciando aplicación...');
      setTimeout(() => window.location.reload(), 2000);
    }
    else if (res.error !== 'Cancelado') setMessage('Error al restaurar: ' + res.error);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Mantenimiento y Backup</h2>
        <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
          Versión Actual: v{APP_VERSION}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Full Backup - Cloud Ready */}
        <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Backup Completo</h3>
              <p className="text-xs text-muted-foreground">Incluye Base de Datos, Fotos y Facturas.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex-1 italic">
            Ideal para guardar en tu carpeta de Google Drive o OneDrive y tener todo respaldado en la nube.
          </p>
          <button 
            onClick={handleBackupFull}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save size={18} /> Backup Total
          </button>
        </div>

        {/* DB Only Backup */}
        <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Save className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Backup de Datos</h3>
              <p className="text-xs text-muted-foreground">Solo exporta la base de datos (.sqlite).</p>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="space-y-2">
            <button 
                onClick={handleBackupDB}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
                Exportar SQLite
            </button>
            <button 
                onClick={handleRestore}
                className="w-full py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-sm"
            >
                Restaurar Datos
            </button>
          </div>
        </div>

        {/* Updates */}
        <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full text-green-500">
              <RefreshCw className={cn("w-6 h-6", checking && "animate-spin")} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Actualizaciones</h3>
              <p className="text-xs text-muted-foreground">Busca nuevas versiones de la app.</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            {updateInfo && updateInfo.hasUpdate ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                        <CheckCircle2 size={16} />
                        <span className="font-bold text-sm">¡Nueva versión v{updateInfo.remoteVersion}!</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Hay mejoras listas para descargar.</p>
                    <a 
                        href={updateInfo.updateUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-green-600 underline hover:text-green-700"
                    >
                        Descargar v{updateInfo.remoteVersion} ahora
                    </a>
                </div>
            ) : updateInfo ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <CheckCircle2 size={18} className="text-green-500" />
                    Estás al día con la v{APP_VERSION}
                </div>
            ) : (
                <div className="py-4 text-xs text-muted-foreground flex items-center gap-2">
                    <Info size={16} /> Presiona el botón para buscar mejoras.
                </div>
            )}
          </div>

          <button 
            disabled={checking}
            onClick={handleCheckUpdates}
            className="w-full py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors font-medium disabled:opacity-50"
          >
            {checking ? 'Buscando...' : 'Buscar Mejoras'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3 dark:bg-blue-900/20 dark:border-blue-800">
        <AlertCircle className="text-blue-500 shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-bold mb-1">Consejo para la Nube:</p>
            <p>Para tener backups automáticos en Google Drive o OneDrive, selecciona una carpeta dentro de tu Drive (ej: "Mis Documentos/Google Drive/Backups") al realizar el <strong>Backup Completo</strong>. El sistema guardará todo allí y tu PC se encargará de subirlo a la nube automáticamente.</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-muted rounded-lg text-center font-medium animate-in slide-in-from-bottom duration-300">
          {message}
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
