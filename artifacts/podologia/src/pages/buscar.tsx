import { useState, useRef } from "react";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit, CalendarPlus, FileText, Phone, MapPin, TrendingUp, Hash } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportHistorialPDF } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_STYLES: Record<string, string> = {
  atendida: 'bg-[#52B788]/10 text-[#2d7a52] border border-[#52B788]/25',
  pendiente: 'bg-[#2C7DA0]/10 text-[#2C7DA0] border border-[#2C7DA0]/25',
  cancelada: 'bg-red-50 text-red-700 border border-red-200',
  reprogramada: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function Buscar() {
  const [dni, setDni] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!dni.trim()) return;

    setHasSearched(true);
    const clientes = store.getClientes();
    const found = clientes.find(c => c.dni === dni.trim());

    if (found) {
      setCliente(found);
      const allReservas = store.getReservas();
      setHistorial(
        allReservas
          .filter(r => r.clienteId === found.id)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
      );
      setServicios(store.getServicios());
    } else {
      setCliente(null);
      setHistorial([]);
    }
  };

  const handleExportPDF = () => {
    if (!cliente) return;
    exportHistorialPDF(cliente, historial, servicios);
    toast({ title: "Historial exportado" });
  };

  const atendidas = historial.filter(r => r.estado === 'atendida');
  const totalSpent = atendidas.reduce((acc, r) => acc + r.precio, 0);
  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Búsqueda por DNI</h1>
        <p className="text-sm text-muted-foreground">Accede al historial clínico completo de un paciente.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ingresa el DNI (8 dígitos)..."
            className="pl-10 h-12 text-base"
            value={dni}
            onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
            maxLength={8}
            data-testid="input-dni-buscar"
          />
        </div>
        <Button type="submit" className="h-12 px-6 text-base" data-testid="button-buscar">
          Buscar
        </Button>
      </form>

      <AnimatePresence mode="wait">
        {hasSearched && (
          <motion.div
            key={dni + String(!!cliente)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {cliente ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-xl font-bold">{cliente.nombre}</h2>
                        <p className="text-sm text-muted-foreground">DNI: {cliente.dni}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
                          <FileText className="w-4 h-4 mr-1.5" /> PDF
                        </Button>
                        <Link href={`/clientes/${cliente.id}/editar`}>
                          <Button variant="outline" size="sm" data-testid="button-editar">
                            <Edit className="w-4 h-4 mr-1.5" /> Editar
                          </Button>
                        </Link>
                        <Button size="sm" onClick={() => setLocation('/reservas')} data-testid="button-nueva-cita">
                          <CalendarPlus className="w-4 h-4 mr-1.5" /> Nueva Cita
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Teléfono</p>
                        <a href={`tel:${cliente.telefono}`} className="font-semibold text-primary flex items-center gap-1 hover:underline text-sm">
                          <Phone className="w-3.5 h-3.5" /> {cliente.telefono}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Dirección</p>
                        <p className="text-sm">{cliente.direccion || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Total visitas</p>
                        <p className="font-bold text-primary">{atendidas.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Total invertido</p>
                        <p className="font-bold text-[#52B788]">S/ {totalSpent}</p>
                      </div>
                    </div>

                    {cliente.condicion && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Condición / Observaciones</p>
                        <p className="text-sm text-amber-900">{cliente.condicion}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Historial de Atenciones</CardTitle>
                      <Link href={`/historial/${cliente.id}`}>
                        <span className="text-xs text-primary hover:underline">Ver ficha completa</span>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Servicio</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historial.slice(0, 8).map(r => (
                            <TableRow key={r.id}>
                              <TableCell className="text-sm">{new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                              <TableCell className="font-medium text-sm">{getServiceName(r.servicio)}</TableCell>
                              <TableCell className="text-sm">S/ {r.precio}</TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[r.estado]}`}>
                                  {r.estado}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                          {historial.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                No hay atenciones registradas.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Paciente no encontrado</h3>
                    <p className="text-sm text-muted-foreground">No hay ningún paciente registrado con DNI {dni}</p>
                  </div>
                  <Link href="/clientes/nuevo">
                    <Button data-testid="button-registrar-nuevo">Registrar nuevo paciente</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
