import { useState, useEffect, useRef, useMemo } from "react";
import { store, Reserva, Cliente, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Phone, X, ChevronDown } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pendiente: 'bg-[#2C7DA0]/10 text-[#2C7DA0] border border-[#2C7DA0]/25',
  atendida: 'bg-[#52B788]/10 text-[#2d7a52] border border-[#52B788]/25',
  cancelada: 'bg-red-50 text-red-700 border border-red-200',
  reprogramada: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const HORAS = Array.from({ length: 23 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  if (h > 19) return null;
  return `${String(h).padStart(2, '0')}:${m}`;
}).filter(Boolean) as string[];

const emptyForm = () => ({
  clienteId: '',
  clienteNombre: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: '09:00',
  servicio: '',
  precio: 0,
  observaciones: '',
  evolucion: '',
  estado: 'pendiente' as Reserva['estado'],
});

export default function Reservas() {
  const { toast } = useToast();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [clientSearch, setClientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterFecha, setFilterFecha] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReservas(store.getReservas());
    setClientes(store.getClientes());
    setServicios(store.getServicios());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clienteSuggestions = useMemo(() => {
    if (!clientSearch.trim()) return [];
    const q = clientSearch.toLowerCase();
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.dni.includes(q)
    ).slice(0, 6);
  }, [clientSearch, clientes]);

  const selectCliente = (c: Cliente) => {
    setForm(f => ({ ...f, clienteId: c.id, clienteNombre: c.nombre }));
    setClientSearch(c.nombre);
    setShowDropdown(false);
  };

  const handleServicioChange = (id: string) => {
    const s = servicios.find(s => s.id === id);
    setForm(f => ({ ...f, servicio: id, precio: s ? s.precio : 0 }));
  };

  const openNew = () => {
    setForm(emptyForm());
    setClientSearch('');
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (r: Reserva) => {
    const c = clientes.find(cl => cl.id === r.clienteId);
    setForm({
      clienteId: r.clienteId,
      clienteNombre: c?.nombre || '',
      fecha: r.fecha,
      hora: r.hora,
      servicio: r.servicio,
      precio: r.precio,
      observaciones: r.observaciones || '',
      evolucion: r.evolucion || '',
      estado: r.estado,
    });
    setClientSearch(c?.nombre || '');
    setEditingId(r.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId || !form.servicio) {
      toast({ title: "Campos requeridos", description: "Selecciona paciente y servicio.", variant: "destructive" });
      return;
    }

    let updated: Reserva[];
    if (editingId) {
      updated = reservas.map(r => r.id === editingId
        ? { ...r, clienteId: form.clienteId, fecha: form.fecha, hora: form.hora, servicio: form.servicio, precio: form.precio, observaciones: form.observaciones, evolucion: form.evolucion, estado: form.estado }
        : r
      );
      toast({ title: "Cita actualizada" });
    } else {
      const nueva: Reserva = {
        id: `r${Date.now()}`,
        clienteId: form.clienteId,
        fecha: form.fecha,
        hora: form.hora,
        servicio: form.servicio,
        precio: form.precio,
        observaciones: form.observaciones,
        evolucion: form.evolucion,
        estado: form.estado,
      };
      updated = [...reservas, nueva];
      toast({ title: "Cita registrada", description: `${form.clienteNombre} — ${form.fecha} ${form.hora}` });
    }

    store.setReservas(updated);
    setReservas(updated);
    setDialogOpen(false);
  };

  const updateEstado = (id: string, estado: Reserva['estado']) => {
    const updated = reservas.map(r => r.id === id ? { ...r, estado } : r);
    store.setReservas(updated);
    setReservas(updated);
  };

  const filtered = useMemo(() => {
    return reservas
      .filter(r => filterEstado === 'todos' || r.estado === filterEstado)
      .filter(r => !filterFecha || r.fecha === filterFecha)
      .sort((a, b) => {
        const d = b.fecha.localeCompare(a.fecha);
        return d !== 0 ? d : a.hora.localeCompare(b.hora);
      });
  }, [reservas, filterEstado, filterFecha]);

  const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || '—';
  const getClientPhone = (id: string) => clientes.find(c => c.id === id)?.telefono || '';
  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservas y Citas</h1>
          <p className="text-sm text-muted-foreground">{reservas.length} citas registradas</p>
        </div>
        <Button size="sm" onClick={openNew} data-testid="button-nueva-cita">
          <Plus className="w-4 h-4 mr-1.5" /> Nueva Cita
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          type="date"
          value={filterFecha}
          onChange={e => setFilterFecha(e.target.value)}
          className="h-8 w-auto text-sm"
          data-testid="input-filter-fecha"
        />
        {filterFecha && (
          <Button variant="ghost" size="sm" onClick={() => setFilterFecha('')} className="h-8">
            <X className="w-3 h-3 mr-1" /> Hoy
          </Button>
        )}
        {(['todos', 'pendiente', 'atendida', 'reprogramada', 'cancelada'] as const).map(e => (
          <button
            key={e}
            onClick={() => setFilterEstado(e)}
            data-testid={`button-filter-${e}`}
            className={`h-8 px-3 rounded-full text-xs font-medium border transition-all ${filterEstado === e
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const phone = getClientPhone(r.clienteId);
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/30" data-testid={`row-reserva-${r.id}`}>
                      <TableCell>
                        <div className="font-medium text-sm">{new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-xs text-muted-foreground">{r.hora}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{getClientName(r.clienteId)}</div>
                        {phone && (
                          <a href={`tel:${phone}`} className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                            <Phone className="w-2.5 h-2.5" /> {phone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{getServiceName(r.servicio)}</TableCell>
                      <TableCell className="font-semibold text-sm">S/ {r.precio}</TableCell>
                      <TableCell>
                        <Select value={r.estado} onValueChange={v => updateEstado(r.id, v as Reserva['estado'])}>
                          <SelectTrigger className={`h-7 text-xs w-[128px] border rounded-full px-2 font-medium ${STATUS_STYLES[r.estado]}`} data-testid={`select-estado-${r.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="atendida">Atendida</SelectItem>
                            <SelectItem value="reprogramada">Reprogramada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} data-testid={`button-editar-reserva-${r.id}`}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                      No hay citas para los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client search */}
            <div className="space-y-1.5" ref={dropdownRef}>
              <Label>Paciente <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nombre o DNI..."
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowDropdown(true); setForm(f => ({ ...f, clienteId: '', clienteNombre: '' })); }}
                  onFocus={() => setShowDropdown(true)}
                  autoComplete="off"
                  data-testid="input-buscar-paciente"
                />
                {showDropdown && clienteSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
                    {clienteSuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCliente(c)}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors text-sm"
                        data-testid={`option-cliente-${c.id}`}
                      >
                        <span className="font-medium">{c.nombre}</span>
                        <span className="text-muted-foreground ml-2 text-xs">DNI: {c.dni}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.clienteId && (
                <p className="text-xs text-[#52B788] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] inline-block" />
                  Paciente seleccionado: {form.clienteNombre}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  data-testid="input-fecha"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hora <span className="text-destructive">*</span></Label>
                <Select value={form.hora} onValueChange={v => setForm(f => ({ ...f, hora: v }))}>
                  <SelectTrigger data-testid="select-hora">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {HORAS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Servicio <span className="text-destructive">*</span></Label>
                <Select value={form.servicio} onValueChange={handleServicioChange}>
                  <SelectTrigger data-testid="select-servicio">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre} — S/{s.precio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Precio (S/)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: Number(e.target.value) }))}
                  data-testid="input-precio"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <div className="flex flex-wrap gap-2">
                {(['pendiente', 'atendida', 'reprogramada', 'cancelada'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, estado: s }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.estado === s ? STATUS_STYLES[s] + ' ring-2 ring-offset-1 ring-current' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                    data-testid={`button-estado-${s}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observaciones del podólogo <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                rows={2}
                value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Notas sobre la atención..."
                data-testid="textarea-observaciones"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Evolución / Condición detectada <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                rows={2}
                value={form.evolucion}
                onChange={e => setForm(f => ({ ...f, evolucion: e.target.value }))}
                placeholder="Estado del paciente, evolución, tratamiento indicado..."
                data-testid="textarea-evolucion"
              />
            </div>

            {form.clienteId && clientes.find(c => c.id === form.clienteId)?.telefono && (
              <a
                href={`tel:${clientes.find(c => c.id === form.clienteId)?.telefono}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="w-4 h-4" />
                Llamar a {form.clienteNombre}
              </a>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" data-testid="button-guardar-cita">
                {editingId ? 'Guardar cambios' : 'Registrar cita'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
