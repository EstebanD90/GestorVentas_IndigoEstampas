import { useState, useEffect } from 'react';
import { Save, ImageIcon, Globe, Phone, MapPin, Mail, Instagram, Facebook, Receipt } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    instagram: '',
    facebook: '',
    cuit: '',
    footer_message: '',
    logo_path: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await window.electronAPI.getBusinessSettings();
      if (data) {
        setSettings(data);
        if (data.logo_path) {
          const base64 = await window.electronAPI.getImageBase64(data.logo_path);
          setLogoPreview(base64);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function handleSelectLogo() {
    const path = await window.electronAPI.selectImage();
    if (path) {
      setSettings({ ...settings, logo_path: path });
      const base64 = await window.electronAPI.getImageBase64(path);
      setLogoPreview(base64);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await window.electronAPI.updateBusinessSettings(settings);
    if (res) {
      setToast({ message: 'Configuración guardada correctamente', type: 'success' });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Ajustes del Negocio</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        {/* Logo Section */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Logo del Negocio
            </h3>
            <div 
              onClick={handleSelectLogo}
              className="aspect-square w-full rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center bg-muted/30 transition-all overflow-hidden relative group"
            >
              {logoPreview ? (
                <>
                  <img src={logoPreview} className="w-full h-full object-contain p-4" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <p className="text-white text-xs font-bold">Cambiar Logo</p>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon size={48} className="text-muted-foreground opacity-20 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium text-center px-4">Haz clic para cargar el logo que aparecerá en tus facturas</p>
                </>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground italic text-center leading-relaxed">
              Se recomienda una imagen en formato PNG o JPG con fondo blanco o transparente.
            </p>
          </div>
        </div>

        {/* General Info Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-card rounded-xl border shadow-sm space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Receipt className="w-5 h-5 text-primary" />
              Información Comercial
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Negocio</label>
                <input 
                  type="text" 
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ej: INDIGO ESTAMPAS"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CUIT / RUT / ID Fiscal</label>
                <input 
                  type="text" 
                  value={settings.cuit}
                  onChange={(e) => setSettings({...settings, cuit: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ej: 20-12345678-9"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Dirección Física</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ej: Av. Principal 123, Ciudad"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 pt-4">
              <Globe className="w-5 h-5 text-primary" />
              Contacto y Redes Sociales
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    value={settings.phone}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="+54 9 11 ..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="email" 
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="contacto@tuempresa.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Instagram</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    value={settings.instagram}
                    onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="@indigo.estampas"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Facebook</label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    value={settings.facebook}
                    onChange={(e) => setSettings({...settings, facebook: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Indigo Estampas Oficial"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium">Mensaje al Pie del Ticket</label>
              <textarea 
                value={settings.footer_message}
                onChange={(e) => setSettings({...settings, footer_message: e.target.value})}
                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                rows={2}
                placeholder="Ej: ¡Gracias por su compra! No se aceptan devoluciones sin el ticket."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="px-8 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-primary/20 active:scale-95"
              >
                <Save size={20} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
