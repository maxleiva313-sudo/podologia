import { useState, useEffect, useRef, useMemo } from "react";
import { store, Reserva, Cliente, Servicio } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Phone, X, ChevronLeft, ChevronRight, LayoutList, CalendarDays } from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pendiente: 'bg-[#2C7DA0]/10 text-[#2C7DA0] border border-[#2C7DA0]/30',
  atendida:  'bg-[#52B788]/10 text-[#2d7a52] border border-[#52B788]/30',
  cancelada: 'bg-red-50 text-red-700 border border-red-200',
  reprogramada: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const STATUS_BG: Record<string, string> = {
  pendiente:   'bg-[#2C7DA0] text-white',
  atendida:    'bg-[#52B788] text-white',
  cancelada:   'bg-red-500 text-white',
  reprogramada:'bg-amber-500 text-white',
};

const STATUS_LIGHT: Record<string, string> = {
  pendiente:   'bg-[#2C7DA0]/15 border-l-[#2C7DA0] text-[#1a4e63]',
  atendida:    'bg-[#52B788]/15 border-l-[#52B788] text-[#2d7a52]',
  cancelada:   'bg-red-50 border-l-red-400 text-red-800',
  reprogramada:'bg-amber-50 border-l-amber-400 text-amber-800',
};

// 8:00 → 19:30, 30-min intervals
const HORAS: string[] = [];
for (let h = 8; h <= 19; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 19) HORAS.push(`${String(h).padStart(2, '0')}:30`);
}

const SLOT_H = 48; // px per 30-min slot
const HEADER_H = 52; // px for day header
const HOUR_COL_W = 56; // px for time column

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function timeToSlotIndex(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h - 8) * 2 + (m >= 30 ? 1 : 0);
}

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

// ─── Calendar View ────────────────────────────────────────────────────────────

interface CalendarViewProps {
  weekStart: Date;
  reservas: Reserva[];
  clientes: Cliente[];
  servicios: Servicio[];
  onSlotClick: (fecha: string, hora: string) => void;
  onReservaClick: (r: Reserva) => void;
}

function CalendarView({ weekStart, reservas, clientes, servicios, onSlotClick, onReservaClick }: CalendarViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = toDateStr(new Date());

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Scroll to 8:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [weekStart]);

  const reservasByDay = useMemo(() => {
    const map: Record<string, Reserva[]> = {};
    days.forEach(d => { map[toDateStr(d)] = []; });
    reservas.forEach(r => {
      if (map[r.fecha]) map[r.fecha].push(r);
    });
    return map;
  }, [reservas, weekStart]);

  const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || '—';
  const getServiceShort = (id: string) => {
    const s = servicios.find(s => s.id === id)?.nombre || '';
    return s.length > 20 ? s.slice(0, 18) + '…' : s;
  };

  const totalSlots = HORAS.length;
  const gridH = totalSlots * SLOT_H;

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Day headers */}
      <div
        className="grid border-b bg-muted/30"
        style={{ gridTemplateColumns: `${HOUR_COL_W}px repeat(7, 1fr)` }}
      >
        <div className="border-r" style={{ height: HEADER_H }} />
        {days.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          const count = reservasByDay[dateStr]?.length ?? 0;
          return (
            <div
              key={i}
              className={`flex flex-col items-center justify-center border-r last:border-r-0 select-none ${isToday ? 'bg-primary/5' : ''}`}
              style={{ height: HEADER_H }}
            >
              <span className={`text-xs font-medium uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {DAYS_ES[day.getDay()]}
              </span>
              <span className={`text-lg font-bold leading-tight ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {day.getDate()}
              </span>
              {count > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 rounded-full mt-0.5 ${isToday ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '68vh' }}>
        <div
          className="grid relative"
          style={{ gridTemplateColumns: `${HOUR_COL_W}px repeat(7, 1fr)`, height: gridH }}
        >
          {/* Hour labels */}
          <div className="relative border-r">
            {HORAS.map((hora, i) => (
              <div
                key={hora}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: i * SLOT_H, height: SLOT_H }}
              >
                {hora.endsWith(':00') && (
                  <span className="text-[10px] text-muted-foreground font-medium mt-[-6px]">{hora}</span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            const dateStr = toDateStr(day);
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;
            const dayReservas = reservasByDay[dateStr] || [];

            return (
              <div
                key={dayIdx}
                className={`relative border-r last:border-r-0 ${isToday ? 'bg-primary/[0.025]' : isPast ? 'bg-muted/10' : ''}`}
              >
                {/* Horizontal slot lines */}
                {HORAS.map((hora, i) => (
                  <div
                    key={hora}
                    className={`absolute left-0 right-0 cursor-pointer transition-colors hover:bg-primary/5 group ${hora.endsWith(':00') ? 'border-t border-border' : 'border-t border-dashed border-border/40'}`}
                    style={{ top: i * SLOT_H, height: SLOT_H }}
                    onClick={() => onSlotClick(dateStr, hora)}
                    data-testid={`slot-${dateStr}-${hora}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute left-1 top-1 text-[9px] text-primary/70 font-medium transition-opacity">
                      + {hora}
                    </span>
                  </div>
                ))}

                {/* Appointment blocks */}
                {dayReservas.map(r => {
                  const slotIdx = timeToSlotIndex(r.hora);
                  if (slotIdx < 0 || slotIdx >= HORAS.length) return null;
                  const name = getClientName(r.clienteId);
                  const service = getServiceShort(r.servicio);
                  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('');

                  return (
                    <div
                      key={r.id}
                      className={`absolute left-1 right-1 rounded-md border-l-[3px] px-1.5 py-1 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] overflow-hidden z-10 ${STATUS_LIGHT[r.estado]}`}
                      style={{
                        top: slotIdx * SLOT_H + 2,
                        minHeight: SLOT_H - 4,
                      }}
                      onClick={e => { e.stopPropagation(); onReservaClick(r); }}
                      data-testid={`cal-block-${r.id}`}
                      title={`${name} — ${r.hora} — ${service}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${STATUS_BG[r.estado]}`}>
                          {initials}
                        </span>
                        <span className="text-[10px] font-bold leading-tight truncate">{r.hora}</span>
                      </div>
                      <p className="text-[10px] font-semibold leading-tight truncate">{name.split(' ').slice(0, 2).join(' ')}</p>
                      <p className="text-[9px] leading-tight truncate opacity-75">{service}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Reservas() {
  const { toast } = useToast();
  const [reservas, setReservas]   = useState<Reserva[]>([]);
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  // Views: 'lista' | 'semana'
  const [view, setView] = useState<'lista' | 'semana'>('semana');

  // Week navigation
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm());

  // Client autocomplete
  const [clientSearch, setClientSearch]   = useState('');
  const [showDropdown, setShowDropdown]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // List filters
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterFecha, setFilterFecha]   = useState('');

  useEffect(() => {
    setReservas(store.getReservas());
    setClientes(store.getClientes());
    setServicios(store.getServicios());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Autocomplete ──────────────────────────────────────────────────────────

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

  // ── Form helpers ──────────────────────────────────────────────────────────

  const handleServicioChange = (id: string) => {
    const s = servicios.find(s => s.id === id);
    setForm(f => ({ ...f, servicio: id, precio: s ? s.precio : 0 }));
  };

  const openNew = (fecha?: string, hora?: string) => {
    setForm({ ...emptyForm(), fecha: fecha ?? new Date().toISOString().split('T')[0], hora: hora ?? '09:00' });
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
        fecha: form.fecha, hora: form.hora, servicio: form.servicio,
        precio: form.precio, observaciones: form.observaciones,
        evolucion: form.evolucion, estado: form.estado,
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

  // ── Week navigation ───────────────────────────────────────────────────────

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday  = () => setWeekStart(startOfWeek(new Date()));

  const isCurrentWeek = toDateStr(weekStart) === toDateStr(startOfWeek(new Date()));

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()} – ${weekEnd.getDate()} de ${MONTHS_ES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${weekStart.getDate()} ${MONTHS_ES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS_ES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  // ── List filters ──────────────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    return reservas
      .filter(r => filterEstado === 'todos' || r.estado === filterEstado)
      .filter(r => !filterFecha || r.fecha === filterFecha)
      .sort((a, b) => {
        const d = b.fecha.localeCompare(a.fecha);
        return d !== 0 ? d : a.hora.localeCompare(b.hora);
      });
  }, [reservas, filterEstado, filterFecha]);

  const getClientName  = (id: string) => clientes.find(c => c.id === id)?.nombre || '—';
  const getClientPhone = (id: string) => clientes.find(c => c.id === id)?.telefono || '';
  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservas y Citas</h1>
          <p className="text-sm text-muted-foreground">{reservas.length} citas registradas</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView('semana')}
              data-testid="button-view-semana"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'semana' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <CalendarDays className="w-4 h-4" /> Semana
            </button>
            <button
              onClick={() => setView('lista')}
              data-testid="button-view-lista"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'lista' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList className="w-4 h-4" /> Lista
            </button>
          </div>

          <Button size="sm" onClick={() => openNew()} data-testid="button-nueva-cita">
            <Plus className="w-4 h-4 mr-1.5" /> Nueva Cita
          </Button>
        </div>
      </div>

      {/* ── WEEK CALENDAR VIEW ─────────────────────────────────────────────── */}
      {view === 'semana' && (
        <div className="space-y-3">
          {/* Week navigation bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevWeek} data-testid="button-prev-week">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextWeek} data-testid="button-next-week">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground ml-1 capitalize">{weekLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Status legend */}
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                {(['pendiente','atendida','reprogramada','cancelada'] as const).map(s => (
                  <span key={s} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${STATUS_BG[s].split(' ')[0]}`} />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                ))}
              </div>
              {!isCurrentWeek && (
                <Button variant="outline" size="sm" className="h-8" onClick={goToday} data-testid="button-ir-hoy">
                  Hoy
                </Button>
              )}
            </div>
          </div>

          <CalendarView
            weekStart={weekStart}
            reservas={reservas}
            clientes={clientes}
            servicios={servicios}
            onSlotClick={(fecha, hora) => openNew(fecha, hora)}
            onReservaClick={openEdit}
          />

          {/* Compact week summary */}
          {(() => {
            const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(weekStart, i)));
            const weekReservas = reservas.filter(r => weekDates.includes(r.fecha));
            const income = weekReservas.filter(r => r.estado === 'atendida').reduce((s, r) => s + r.precio, 0);
            const pending = weekReservas.filter(r => r.estado === 'pendiente').length;
            const attended = weekReservas.filter(r => r.estado === 'atendida').length;
            return weekReservas.length > 0 ? (
              <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-muted/30 rounded-lg border text-sm">
                <span className="text-muted-foreground">Esta semana:</span>
                <span><strong className="text-foreground">{weekReservas.length}</strong> citas totales</span>
                <span><strong className="text-[#52B788]">{attended}</strong> atendidas</span>
                <span><strong className="text-[#2C7DA0]">{pending}</strong> pendientes</span>
                {income > 0 && <span><strong className="text-[#52B788]">S/ {income}</strong> ingresados</span>}
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {view === 'lista' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              type="date"
              value={filterFecha}
              onChange={e => setFilterFecha(e.target.value)}
              className="h-8 w-auto text-sm"
              data-testid="input-filter-fecha"
            />
            {filterFecha && (
              <Button variant="ghost" size="sm" onClick={() => setFilterFecha('')} className="h-8">
                <X className="w-3 h-3 mr-1" /> Quitar fecha
              </Button>
            )}
            {(['todos','pendiente','atendida','reprogramada','cancelada'] as const).map(e => (
              <button
                key={e}
                onClick={() => setFilterEstado(e)}
                data-testid={`button-filter-${e}`}
                className={`h-8 px-3 rounded-full text-xs font-medium border transition-all ${filterEstado === e ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
              >
                {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
              </button>
            ))}
          </div>

          <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha / Hora</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paciente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Servicio</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Precio</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <TableBody>
                  {filteredList.map(r => {
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
                            <SelectTrigger className={`h-7 text-xs w-[130px] border rounded-full px-2.5 font-medium ${STATUS_STYLES[r.estado]}`} data-testid={`select-estado-${r.id}`}>
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
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)} data-testid={`button-editar-reserva-${r.id}`}>Editar</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                        No hay citas para los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARED DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editingId ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">

            {/* Client search */}
            <div className="space-y-1.5" ref={dropdownRef}>
              <Label className="text-sm">Paciente <span className="text-destructive">*</span></Label>
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
                      <button key={c.id} type="button" onClick={() => selectCliente(c)}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors text-sm"
                        data-testid={`option-cliente-${c.id}`}>
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
                  {form.clienteNombre}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Fecha <span className="text-destructive">*</span></Label>
                <Input type="date" required
                  min={new Date().toISOString().split('T')[0]}
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  data-testid="input-fecha" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Hora <span className="text-destructive">*</span></Label>
                <Select value={form.hora} onValueChange={v => setForm(f => ({ ...f, hora: v }))}>
                  <SelectTrigger data-testid="select-hora"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {HORAS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Servicio <span className="text-destructive">*</span></Label>
                <Select value={form.servicio} onValueChange={handleServicioChange}>
                  <SelectTrigger data-testid="select-servicio"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {servicios.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} — S/{s.precio}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Precio (S/)</Label>
                <Input type="number" min="0"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: Number(e.target.value) }))}
                  data-testid="input-precio" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Estado</Label>
              <div className="flex flex-wrap gap-2">
                {(['pendiente','atendida','reprogramada','cancelada'] as const).map(s => (
                  <button key={s} type="button"
                    onClick={() => setForm(f => ({ ...f, estado: s }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.estado === s ? STATUS_STYLES[s] + ' ring-2 ring-offset-1 ring-current' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                    data-testid={`button-estado-${s}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Observaciones <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea rows={2} value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Notas sobre la atención..." data-testid="textarea-observaciones" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Evolución / Condición detectada <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea rows={2} value={form.evolucion}
                onChange={e => setForm(f => ({ ...f, evolucion: e.target.value }))}
                placeholder="Estado del paciente, evolución, tratamiento indicado..."
                data-testid="textarea-evolucion" />
            </div>

            {form.clienteId && clientes.find(c => c.id === form.clienteId)?.telefono && (
              <a href={`tel:${clientes.find(c => c.id === form.clienteId)?.telefono}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone className="w-4 h-4" />
                Llamar a {form.clienteNombre}
              </a>
            )}

            <DialogFooter className="pt-2">
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
