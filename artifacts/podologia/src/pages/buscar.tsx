import { useState } from "react";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit, CalendarPlus, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToPDF } from "@/lib/export";

export default function Buscar() {
  const [dni, setDni] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) return;
    
    setHasSearched(true);
    const clientes = store.getClientes();
    const found = clientes.find(c => c.dni === dni.trim());
    
    if (found) {
      setCliente(found);
      const allReservas = store.getReservas();
      setHistorial(allReservas.filter(r => r.clienteId === found.id).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      setServicios(store.getServicios());
    } else {
      setCliente(null);
      setHistorial([]);
    }
  };

  const handleExportPDF = () => {
    if (!cliente) return;
    const data = historial.map(r => {
      const s = servicios.find(srv => srv.id === r.servicio);
      return [
        new Date(r.fecha).toLocaleDateString(),
        s?.nombre || 'Desconocido',
        `S/ ${r.precio}`,
        r.estado
      ];
    });
    exportToPDF(
      `Historial - ${cliente.nombre}`,
      ['Fecha', 'Servicio', 'Precio', 'Estado'],
      data,
      `historial_${cliente.dni}`
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mt-8">
        <h1 className="text-3xl font-bold text-foreground">Búsqueda Rápida</h1>
        <p className="text-muted-foreground">Encuentra el historial de un paciente por su DNI.</p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="Ingrese DNI..." 
            className="pl-10 h-12 text-lg"
            value={dni}
            onChange={e => setDni(e.target.value)}
            maxLength={8}
          />
        </div>
        <Button type="submit" className="h-12 px-8">Buscar</Button>
      </form>

      {hasSearched && (
        <div className="mt-8">
          {cliente ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
                      <div>
                        <p className="text-sm text-muted-foreground">Paciente</p>
                        <p className="font-semibold text-lg">{cliente.nombre}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">DNI</p>
                        <p className="font-semibold">{cliente.dni}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-semibold">{cliente.telefono}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Registro</p>
                        <p className="font-semibold">{new Date(cliente.fechaRegistro).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <FileText className="w-4 h-4 mr-2" /> PDF
                      </Button>
                      <Link href={`/historial/${cliente.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" /> Ficha
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {cliente.condicion && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Condición / Observaciones Generales:</p>
                      <p className="text-sm text-muted-foreground">{cliente.condicion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Últimas Atenciones</CardTitle>
                  <Button size="sm" onClick={() => setLocation("/reservas")}>
                    <CalendarPlus className="w-4 h-4 mr-2" /> Nueva Cita
                  </Button>
                </CardHeader>
                <CardContent>
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
                      {historial.slice(0, 5).map(r => {
                        const s = servicios.find(srv => srv.id === r.servicio);
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.fecha).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{s?.nombre || 'Desconocido'}</TableCell>
                            <TableCell>S/ {r.precio}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                r.estado === 'atendida' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {r.estado}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {historial.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No hay atenciones registradas.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-10 pb-10 text-center flex flex-col items-center">
                <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground">Paciente no encontrado</h3>
                <p className="text-muted-foreground mb-6">No existe ningún paciente registrado con el DNI {dni}</p>
                <Link href="/clientes/nuevo">
                  <Button><Edit className="w-4 h-4 mr-2" /> Registrar Nuevo Paciente</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}