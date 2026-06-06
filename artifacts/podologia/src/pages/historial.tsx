import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CalendarPlus, FileText } from "lucide-react";

export default function Historial() {
  const { clienteId } = useParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    if (!clienteId) return;
    const allClientes = store.getClientes();
    const found = allClientes.find(c => c.id === clienteId);
    setCliente(found || null);

    const allReservas = store.getReservas();
    setHistorial(allReservas.filter(r => r.clienteId === clienteId).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    
    setServicios(store.getServicios());
  }, [clienteId]);

  if (!cliente) return <div className="p-8 text-center text-muted-foreground">Cargando paciente...</div>;

  const totalSpent = historial.filter(r => r.estado === 'atendida').reduce((acc, r) => acc + r.precio, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Historial Clínico</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><FileText className="w-4 h-4 mr-2" /> PDF</Button>
          <Link href="/reservas">
            <Button><CalendarPlus className="w-4 h-4 mr-2" /> Nueva Cita</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Paciente</p>
              <p className="font-semibold">{cliente.nombre}</p>
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
              <p className="text-sm text-muted-foreground">Total Invertido</p>
              <p className="font-semibold text-green-600">S/ {totalSpent}</p>
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
        <CardHeader>
          <CardTitle>Historial de Atenciones</CardTitle>
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
              {historial.map(r => {
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
  );
}