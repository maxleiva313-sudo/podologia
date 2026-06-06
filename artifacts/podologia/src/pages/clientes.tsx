import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { store, Cliente, Reserva } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, FileText, Download, Trash2, Eye, Edit, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportClientesPDF } from "@/lib/export";

type SortKey = 'nombre' | 'dni' | 'telefono' | 'fechaRegistro' | 'visitas';
type SortDir = 'asc' | 'desc';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('fechaRegistro');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setClientes(store.getClientes());
    setReservas(store.getReservas());
  }, []);

  const visitCount = (id: string) =>
    reservas.filter(r => r.clienteId === id && r.estado === 'atendida').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.dni.includes(q) ||
      c.telefono.includes(q)
    );
  }, [clientes, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortKey === 'nombre') { va = a.nombre; vb = b.nombre; }
      else if (sortKey === 'dni') { va = a.dni; vb = b.dni; }
      else if (sortKey === 'telefono') { va = a.telefono; vb = b.telefono; }
      else if (sortKey === 'fechaRegistro') { va = a.fechaRegistro; vb = b.fechaRegistro; }
      else if (sortKey === 'visitas') { va = visitCount(a.id); vb = visitCount(b.id); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir, reservas]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const newClientes = clientes.filter(c => c.id !== deleteTarget.id);
    const newReservas = reservas.filter(r => r.clienteId !== deleteTarget.id);
    store.setClientes(newClientes);
    store.setReservas(newReservas);
    setClientes(newClientes);
    setReservas(newReservas);
    toast({ title: "Paciente eliminado", description: `${deleteTarget.nombre} y su historial fueron eliminados.` });
    setDeleteTarget(null);
  };

  const handleExportExcel = () => {
    const data = sorted.map(c => ({
      Nombre: c.nombre,
      DNI: c.dni,
      Teléfono: c.telefono,
      Dirección: c.direccion || '',
      'Fecha Registro': new Date(c.fechaRegistro).toLocaleDateString('es-PE'),
      Visitas: visitCount(c.id),
      'Condición/Observaciones': c.condicion || '',
    }));
    exportToExcel(data, 'pacientes');
    toast({ title: "Excel exportado" });
  };

  const handleExportPDF = () => {
    const data = sorted.map(c => ({
      ...c,
      visitas: visitCount(c.id),
    }));
    exportClientesPDF(data);
    toast({ title: "PDF exportado" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} pacientes registrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileText className="w-4 h-4 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="button-export-excel">
            <Download className="w-4 h-4 mr-1.5" /> Excel
          </Button>
          <Link href="/clientes/nuevo">
            <Button size="sm" data-testid="button-nuevo-paciente">
              <Plus className="w-4 h-4 mr-1.5" /> Nuevo Paciente
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI o teléfono..."
              className="pl-9 h-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              data-testid="input-search-clientes"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mostrar:</span>
            <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[72px]" data-testid="select-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {([
                    { key: 'nombre', label: 'Nombre' },
                    { key: 'dni', label: 'DNI' },
                    { key: 'telefono', label: 'Teléfono' },
                    { key: 'fechaRegistro', label: 'Registro' },
                    { key: 'visitas', label: 'Visitas' },
                  ] as { key: SortKey; label: string }[]).map(col => (
                    <TableHead
                      key={col.key}
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => toggleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon k={col.key} />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead>Condición</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(c => (
                  <TableRow key={c.id} className="hover:bg-muted/30" data-testid={`row-cliente-${c.id}`}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="font-mono text-sm">{c.dni}</TableCell>
                    <TableCell>{c.telefono}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(c.fechaRegistro).toLocaleDateString('es-PE')}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">{visitCount(c.id)}</span>
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      {c.condicion
                        ? <span className="text-xs text-muted-foreground truncate block" title={c.condicion}>{c.condicion}</span>
                        : <span className="text-xs text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/historial/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-historial-${c.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/clientes/${c.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-editar-${c.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(c)}
                          data-testid={`button-eliminar-${c.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      {search ? `Sin resultados para "${search}"` : 'No hay pacientes registrados.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <span>{sorted.length} resultado{sorted.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                data-testid="button-prev-page"
              >
                Anterior
              </Button>
              <span className="text-sm">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                data-testid="button-next-page"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{deleteTarget?.nombre}</strong> (DNI: {deleteTarget?.dni}).
              <br /><br />
              <span className="text-destructive font-medium">Esta acción también eliminará todo su historial clínico y no se puede deshacer.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
