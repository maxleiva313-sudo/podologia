import { useState, useEffect, useMemo } from "react";
import { store, Cliente, Reserva } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Download, FileText } from "lucide-react";
import { exportToExcel, exportFrecuentesPDF } from "@/lib/export";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

type FrequentClient = Cliente & { visits: number; totalSpent: number; lastVisit: string | null; };

export default function Frecuentes() {
  const [all, setAll] = useState<FrequentClient[]>([]);
  const [minVisits, setMinVisits] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const clientes = store.getClientes();
    const reservas = store.getReservas();

    const data = clientes.map(c => {
      const atendidas = reservas.filter(r => r.clienteId === c.id && r.estado === 'atendida');
      const totalSpent = atendidas.reduce((acc, r) => acc + r.precio, 0);
      const sorted = [...atendidas].sort((a, b) => b.fecha.localeCompare(a.fecha));
      return { ...c, visits: atendidas.length, totalSpent, lastVisit: sorted[0]?.fecha || null };
    });

    setAll(data.filter(c => c.visits > 0).sort((a, b) => b.visits - a.visits));
  }, []);

  const filtered = useMemo(() => {
    return all.filter(c => {
      if (c.visits < minVisits) return false;
      if (dateFrom && c.lastVisit && c.lastVisit < dateFrom) return false;
      if (dateTo && c.lastVisit && c.lastVisit > dateTo) return false;
      return true;
    });
  }, [all, minVisits, dateFrom, dateTo]);

  const handleExportExcel = () => {
    const data = filtered.map(c => ({
      Nombre: c.nombre,
      DNI: c.dni,
      Teléfono: c.telefono,
      Visitas: c.visits,
      'Última Visita': c.lastVisit ? new Date(c.lastVisit + 'T12:00:00').toLocaleDateString('es-PE') : 'N/A',
      'Total Invertido (S/)': c.totalSpent,
      VIP: c.visits >= 10 ? 'Sí' : 'No',
    }));
    exportToExcel(data, 'pacientes_frecuentes');
    toast({ title: "Excel exportado" });
  };

  const handleExportPDF = () => {
    exportFrecuentesPDF(filtered);
    toast({ title: "PDF exportado" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes Frecuentes</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} paciente{filtered.length !== 1 ? 's' : ''} con visitas registradas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileText className="w-4 h-4 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="button-export-excel">
            <Download className="w-4 h-4 mr-1.5" /> Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="space-y-1">
          <Label className="text-xs">Mínimo de visitas</Label>
          <Input
            type="number"
            min={1}
            value={minVisits}
            onChange={e => setMinVisits(Number(e.target.value))}
            className="h-8 w-24 text-sm"
            data-testid="input-min-visitas"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Última visita desde</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm" data-testid="input-date-from" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm" data-testid="input-date-to" />
        </div>
        {(minVisits > 1 || dateFrom || dateTo) && (
          <div className="flex items-end">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => { setMinVisits(1); setDateFrom(''); setDateTo(''); }}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-center">Visitas</TableHead>
                  <TableHead>Última visita</TableHead>
                  <TableHead>Total invertido</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, idx) => (
                  <TableRow key={c.id} className="hover:bg-muted/30" data-testid={`row-frecuente-${c.id}`}>
                    <TableCell className="text-muted-foreground text-sm font-mono">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.visits >= 10 && (
                          <span className="flex items-center gap-0.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium" data-testid={`badge-vip-${c.id}`}>
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> VIP
                          </span>
                        )}
                        <span className="font-medium text-sm">{c.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c.dni}</TableCell>
                    <TableCell className="text-sm">{c.telefono}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-primary text-base">{c.visits}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.lastVisit ? new Date(c.lastVisit + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                    <TableCell className="font-semibold text-[#52B788]">S/ {c.totalSpent}</TableCell>
                    <TableCell>
                      <Link href={`/historial/${c.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7" data-testid={`button-ficha-${c.id}`}>Ver ficha</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                      No hay pacientes con los filtros seleccionados.
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
