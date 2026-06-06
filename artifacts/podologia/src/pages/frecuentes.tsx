import { useState, useEffect } from "react";
import { store, Cliente, Reserva } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Star, Download, FileText, Filter } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { Link } from "wouter";

type FrequentClient = Cliente & {
  visits: number;
  totalSpent: number;
  lastVisit: string | null;
};

export default function Frecuentes() {
  const [frequentClients, setFrequentClients] = useState<FrequentClient[]>([]);

  useEffect(() => {
    const clientes = store.getClientes();
    const reservas = store.getReservas();

    const data = clientes.map(cliente => {
      const clientReservas = reservas.filter(r => r.clienteId === cliente.id && r.estado === 'atendida');
      const visits = clientReservas.length;
      const totalSpent = clientReservas.reduce((acc, r) => acc + r.precio, 0);
      
      const lastVisitReserva = clientReservas.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )[0];
      
      return {
        ...cliente,
        visits,
        totalSpent,
        lastVisit: lastVisitReserva ? lastVisitReserva.fecha : null
      };
    });

    setFrequentClients(data.filter(c => c.visits > 0).sort((a, b) => b.visits - a.visits));
  }, []);

  const handleExportExcel = () => {
    const data = frequentClients.map(c => ({
      Nombre: c.nombre,
      DNI: c.dni,
      Teléfono: c.telefono,
      Visitas: c.visits,
      'Última Visita': c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A',
      'Total Invertido': `S/ ${c.totalSpent}`
    }));
    exportToExcel(data, 'clientes_frecuentes');
  };

  const handleExportPDF = () => {
    const data = frequentClients.map(c => [
      c.nombre,
      c.dni,
      c.visits.toString(),
      c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A',
      `S/ ${c.totalSpent}`
    ]);
    exportToPDF(
      'Pacientes Frecuentes',
      ['Nombre', 'DNI', 'Visitas', 'Última Visita', 'Total'],
      data,
      'clientes_frecuentes'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes Frecuentes</h1>
          <p className="text-muted-foreground">Listado de pacientes ordenados por cantidad de visitas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="outline" onClick={handleExportExcel}><Download className="w-4 h-4 mr-2" /> Excel</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-center">Visitas</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead>Total Invertido</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {frequentClients.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {c.visits >= 3 && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      {c.nombre}
                    </div>
                  </TableCell>
                  <TableCell>{c.dni}</TableCell>
                  <TableCell>{c.telefono}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{c.visits}</TableCell>
                  <TableCell>{c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-green-600 font-medium">S/ {c.totalSpent}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/historial/${c.id}`}>
                      <Button variant="ghost" size="sm">Ver Ficha</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {frequentClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No hay información de visitas.
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