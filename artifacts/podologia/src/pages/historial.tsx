import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CalendarPlus, FileText, Edit, Phone, MapPin, Calendar, TrendingUp, Hash } from "lucide-react";
import { exportHistorialPDF } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, string> = {
  atendida: 'bg-[#52B788]/10 text-[#2d7a52] border border-[#52B788]/25',
  pendiente: 'bg-[#2C7DA0]/10 text-[#2C7DA0] border border-[#2C7DA0]/25',
  cancelada: 'bg-red-50 text-red-700 border border-red-200',
  reprogramada: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function Historial() {
  const { clienteId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    if (!clienteId) return;
    const allClientes = store.getClientes();
    const found = allClientes.find(c => c.id === clienteId);
    setCliente(found || null);

    const allReservas = store.getReservas();
    const clienteReservas = allReservas
      .filter(r => r.clienteId === clienteId)
      .sort((a, b) => {
        const d = b.fecha.localeCompare(a.fecha);
        return d !== 0 ? d : b.hora.localeCompare(a.hora);
      });
    setHistorial(clienteReservas);
    setServicios(store.getServicios());
  }, [clienteId]);

  if (!cliente) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Cargando paciente...</p>
    </div>
  );

  const atendidas = historial.filter(r => r.estado === 'atendida');
  const totalSpent = atendidas.reduce((acc, r) => acc + r.precio, 0);
  const firstVisit = atendidas.length > 0
    ? [...atendidas].sort((a, b) => a.fecha.localeCompare(b.fecha))[0].fecha
    : null;

  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

  const handleExportPDF = () => {
    exportHistorialPDF(cliente, historial, servicios);
    toast({ title: "Historial exportado como PDF" });
  };

  const handleNuevaCita = () => {
    setLocation('/reservas');
  };

  const stats = [
    { icon: Hash, label: 'Total visitas', value: atendidas.length, color: 'text-primary' },
    { icon: TrendingUp, label: 'Total invertido', value: `S/ ${totalSpent}`, color: 'text-[#52B788]' },
    { icon: Calendar, label: 'Primera visita', value: firstVisit ? new Date(firstVisit + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', color: 'text-muted-foreground' },
    { icon: Calendar, label: 'Última visita', value: atendidas.length > 0 ? new Date(atendidas[0].fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Historial Clínico</h1>
            <p className="text-sm text-muted-foreground">{cliente.nombre}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-historial-pdf">
            <FileText className="w-4 h-4 mr-1.5" /> Exportar PDF
          </Button>
          <Link href={`/clientes/${cliente.id}/editar`}>
            <Button variant="outline" size="sm" data-testid="button-editar-cliente">
              <Edit className="w-4 h-4 mr-1.5" /> Editar
            </Button>
          </Link>
          <Button size="sm" onClick={handleNuevaCita} data-testid="button-nueva-cita">
            <CalendarPlus className="w-4 h-4 mr-1.5" /> Nueva Cita
          </Button>
        </div>
      </div>

      {/* Patient Info */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">DNI</p>
              <p className="font-mono font-semibold">{cliente.dni}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Teléfono</p>
              <a href={`tel:${cliente.telefono}`} className="font-semibold text-primary flex items-center gap-1 hover:underline">
                <Phone className="w-3.5 h-3.5" /> {cliente.telefono}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Dirección</p>
              <p className="font-medium text-sm flex items-start gap-1">
                {cliente.direccion
                  ? <><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />{cliente.direccion}</>
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Registrado</p>
              <p className="font-medium text-sm">{new Date(cliente.fechaRegistro).toLocaleDateString('es-PE')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-3 bg-muted/40 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                </div>
              );
            })}
          </div>

          {cliente.condicion && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wide">Condición / Observaciones Generales</p>
              <p className="text-sm text-amber-900">{cliente.condicion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Historial de Atenciones ({historial.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead>Evolución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map(r => {
                  const s = servicios.find(srv => srv.id === r.servicio);
                  return (
                    <TableRow key={r.id} data-testid={`row-historial-${r.id}`}>
                      <TableCell>
                        <div className="font-medium text-sm">{new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-xs text-muted-foreground">{r.hora}</div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{s?.nombre || r.servicio}</TableCell>
                      <TableCell className="font-semibold">S/ {r.precio}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[r.estado]}`}>
                          {r.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px]">
                        {r.observaciones
                          ? <span className="truncate block" title={r.observaciones}>{r.observaciones}</span>
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px]">
                        {r.evolucion
                          ? <span className="truncate block" title={r.evolucion}>{r.evolucion}</span>
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {historial.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No hay atenciones registradas para este paciente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
