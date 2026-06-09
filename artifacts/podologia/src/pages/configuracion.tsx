import { useRef, useState } from "react";
import { store } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, AlertTriangle, RotateCcw, Database, Shield } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Configuracion() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetDialog, setResetDialog] = useState(false);

  const handleExportBackup = () => {
    store.exportBackup();
    toast({ title: "Backup exportado", description: "El archivo JSON fue descargado." });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const ok = store.importBackup(json);
      if (ok) {
        toast({ title: "Backup restaurado", description: "Los datos fueron importados correctamente. Recargando..." });
        setTimeout(() => location.reload(), 1500);
      } else {
        toast({ title: "Error al importar", description: "El archivo no tiene el formato correcto.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    store.reset();
  };

  const clientes = store.getClientes();
  const reservas = store.getReservas();
  const servicios = store.getServicios();
  const lastSaved = store.getLastSaved();

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Gestión de datos y respaldos del sistema.</p>
      </div>

      {/* Storage Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Estado del almacenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-muted/40 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{clientes.length}</p>
              <p className="text-xs text-muted-foreground">Pacientes</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg text-center">
              <p className="text-2xl font-bold text-[#52B788]">{reservas.length}</p>
              <p className="text-xs text-muted-foreground">Citas</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg text-center">
              <p className="text-2xl font-bold text-[#2C7DA0]">{servicios.length}</p>
              <p className="text-xs text-muted-foreground">Servicios</p>
            </div>
          </div>
          {lastSaved && (
            <p className="text-xs text-muted-foreground">
              Último guardado: {new Date(lastSaved).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Respaldo de datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#2C7DA0]/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-[#2C7DA0]" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Exportar backup</p>
              <p className="text-xs text-muted-foreground mt-0.5">Descarga todos los datos (pacientes, citas, servicios) en un archivo JSON. Guárdalo en un lugar seguro.</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportBackup} data-testid="button-export-backup">
              Descargar
            </Button>
          </div>

          <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#52B788]/10 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-[#52B788]" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Restaurar backup</p>
              <p className="text-xs text-muted-foreground mt-0.5">Importa un archivo de backup previamente exportado. Los datos actuales serán reemplazados.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="button-import-backup">
              Importar
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" /> Zona de peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Restablecer datos de demo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Borra todos los datos actuales y restaura los datos de ejemplo. Esta acción no se puede deshacer.</p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => setResetDialog(true)} data-testid="button-reset">
              Restablecer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="text-xs text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-1">Sobre el almacenamiento</p>
        <p>PodoSalud guarda todos los datos localmente en tu navegador (localStorage). Los datos persisten entre sesiones en el mismo dispositivo y navegador. Para transferir datos entre dispositivos, usa la función de backup/restaurar.</p>
      </div>

      <AlertDialog open={resetDialog} onOpenChange={setResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer todos los datos</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente todos los pacientes, citas y servicios configurados, y restaurará los datos de ejemplo.
              <br /><br />
              <strong className="text-destructive">Esta acción no se puede deshacer. Exporta un backup antes de continuar.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
              Sí, restablecer todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
