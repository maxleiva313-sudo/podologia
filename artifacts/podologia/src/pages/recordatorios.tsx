import { useState, useEffect, useMemo } from "react";
import { store, Reserva, Cliente, Servicio, NotificacionEnvio } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle, Copy, CheckCheck, Phone, Calendar,
  Clock, Send, AlertCircle, RefreshCw, BarChart2,
  CheckCircle2, Smartphone, ClipboardCopy
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const DAYS_ES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
}

function buildWhatsAppMessage(
  clienteName: string, fecha: string, hora: string, servicio: string
): string {
  return `Hola ${clienteName.split(' ')[0]} 👋, le recordamos su cita en *PodoClinic* para el día *${formatDateLong(fecha)}* a las *${hora} hrs*.

🦶 Servicio: ${servicio}
📍 Por favor llegar 5 minutos antes.

Para confirmar o reprogramar, responda este mensaje.

¡Hasta pronto! 😊`;
}

function buildWaUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const withCode = cleaned.startsWith('51') ? cleaned : `51${cleaned}`;
  return `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`;
}

type Period = 'manana' | 'hoy' | 'semana';

interface AppointmentRow {
  reserva: Reserva;
  cliente: Cliente;
  servicio: string;
  message: string;
  waUrl: string;
}

// ─── Weekly Stats Bar ─────────────────────────────────────────────────────────

function WeeklyStats({ notificaciones }: { notificaciones: NotificacionEnvio[] }) {
  const today = new Date();
  // Build last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return { date: toDateStr(d), label: DAYS_ES_SHORT[d.getDay()], isToday: i === 6 };
  });

  const byDate: Record<string, { wa: number; copia: number }> = {};
  days.forEach(d => { byDate[d.date] = { wa: 0, copia: 0 }; });
  notificaciones.forEach(n => {
    const d = n.enviadoEn.split('T')[0];
    if (byDate[d]) {
      if (n.metodo === 'whatsapp') byDate[d].wa++;
      else byDate[d].copia++;
    }
  });

  const totalWa    = notificaciones.filter(n => n.metodo === 'whatsapp').length;
  const totalCopia = notificaciones.filter(n => n.metodo === 'copia').length;
  const totalWeek  = notificaciones.length;
  const maxVal = Math.max(...days.map(d => byDate[d.date].wa + byDate[d.date].copia), 1);

  if (totalWeek === 0) return null;

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Contactos esta semana</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#25D366]" />
            {totalWa} por WhatsApp
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2C7DA0]" />
            {totalCopia} copiados
          </span>
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-end justify-between gap-1.5">
          {days.map(d => {
            const { wa, copia } = byDate[d.date];
            const total = wa + copia;
            const barH = total > 0 ? Math.max(Math.round((total / maxVal) * 56), 6) : 0;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                {total > 0 && (
                  <span className="text-[10px] font-bold text-foreground">{total}</span>
                )}
                <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: 60 }}>
                  {total > 0 ? (
                    <div className="w-full rounded-md overflow-hidden" style={{ height: barH }}>
                      <div style={{ height: `${Math.round((wa / total) * 100)}%` }}
                        className="w-full bg-[#25D366]" />
                      <div style={{ height: `${Math.round((copia / total) * 100)}%` }}
                        className="w-full bg-[#2C7DA0]" />
                    </div>
                  ) : (
                    <div className="w-full h-0.5 rounded bg-border self-start mt-auto" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${d.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {d.label}
                  {d.isToday && <span className="ml-0.5">·</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  row,
  notifiedToday,
  onSent,
}: {
  row: AppointmentRow;
  notifiedToday: { metodo: 'whatsapp' | 'copia'; enviadoEn: string } | null;
  onSent: (reservaId: string, clienteId: string, clienteNombre: string, metodo: 'whatsapp' | 'copia') => void;
}) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(row.message).then(() => {
      setJustCopied(true);
      onSent(row.reserva.id, row.cliente.id, row.cliente.nombre, 'copia');
      setTimeout(() => setJustCopied(false), 2500);
    });
  };

  const handleWa = () => {
    onSent(row.reserva.id, row.cliente.id, row.cliente.nombre, 'whatsapp');
  };

  const isToday    = row.reserva.fecha === toDateStr(new Date());
  const isTomorrow = row.reserva.fecha === toDateStr(addDays(new Date(), 1));

  const sentAt = notifiedToday
    ? new Date(notifiedToday.enviadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className={`flex items-stretch gap-0 border rounded-xl overflow-hidden bg-card shadow-sm transition-shadow hover:shadow-md ${notifiedToday ? 'border-[#52B788]/40' : ''}`}
      data-testid={`card-recordatorio-${row.reserva.id}`}
    >
      {/* Status stripe */}
      <div className={`w-1.5 shrink-0 ${notifiedToday ? 'bg-[#52B788]' : 'bg-[#2C7DA0]/40'}`} />

      {/* Content */}
      <div className="flex-1 p-4 min-w-0">

        {/* Top row */}
        <div className="flex flex-wrap items-start gap-2 justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${notifiedToday ? 'bg-[#52B788]/15 text-[#52B788]' : 'bg-primary/10 text-primary'}`}>
              {row.cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm leading-tight">{row.cliente.nombre}</p>
                {notifiedToday && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${notifiedToday.metodo === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/25' : 'bg-[#2C7DA0]/10 text-[#2C7DA0] border-[#2C7DA0]/25'}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {notifiedToday.metodo === 'whatsapp' ? 'Enviado' : 'Copiado'} · {sentAt}
                  </span>
                )}
              </div>
              <a
                href={`tel:${row.cliente.telefono}`}
                className="text-xs text-primary flex items-center gap-0.5 hover:underline mt-0.5"
              >
                <Phone className="w-2.5 h-2.5" />
                {row.cliente.telefono}
              </a>
            </div>
          </div>

          {/* Date / time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            {isToday && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px]">Hoy</span>
            )}
            {isTomorrow && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">Mañana</span>
            )}
            {!isToday && !isTomorrow && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDateLong(row.reserva.fecha)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {row.reserva.hora}
            </span>
          </div>
        </div>

        {/* Service */}
        <p className="text-xs text-muted-foreground pl-11 mb-2">
          🦶 {row.servicio}
          {row.reserva.observaciones && (
            <span className="ml-1.5 text-muted-foreground/60">
              · {row.reserva.observaciones.slice(0, 55)}{row.reserva.observaciones.length > 55 ? '…' : ''}
            </span>
          )}
        </p>

        {/* Message preview */}
        <div className="pl-11">
          <div className="bg-[#f0fdf4] border border-[#52B788]/20 rounded-lg px-3 py-2 text-[11px] text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap max-h-[72px] overflow-hidden relative select-all cursor-text">
            {row.message}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-[#f0fdf4] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Actions column */}
      <div className="flex flex-col gap-2 items-center justify-center px-3 py-4 border-l bg-muted/20 shrink-0">
        <a
          href={row.waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWa}
          data-testid={`button-whatsapp-${row.reserva.id}`}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-white shadow-sm transition-all active:scale-95 hover:shadow-md ${notifiedToday?.metodo === 'whatsapp' ? 'bg-[#52B788]' : 'bg-[#25D366] hover:bg-[#1eb554]'}`}
          title={`Enviar WhatsApp a ${row.cliente.nombre}`}
        >
          {notifiedToday?.metodo === 'whatsapp'
            ? <CheckCheck className="w-5 h-5" />
            : <MessageCircle className="w-5 h-5" />
          }
          <span className="text-[9px] font-semibold tracking-wide">WA</span>
        </a>

        <button
          onClick={handleCopy}
          data-testid={`button-copy-${row.reserva.id}`}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all active:scale-95 ${
            justCopied
              ? 'bg-[#52B788]/15 border-[#52B788]/30 text-[#52B788]'
              : notifiedToday?.metodo === 'copia'
                ? 'bg-[#2C7DA0]/10 border-[#2C7DA0]/30 text-[#2C7DA0]'
                : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
          }`}
          title="Copiar mensaje"
        >
          {justCopied
            ? <CheckCheck className="w-5 h-5" />
            : <Copy className="w-5 h-5" />
          }
          <span className="text-[9px] font-semibold tracking-wide">Copiar</span>
        </button>
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ notificaciones, clientes }: { notificaciones: NotificacionEnvio[]; clientes: Cliente[] }) {
  const today = toDateStr(new Date());
  const todayItems = [...notificaciones]
    .filter(n => n.enviadoEn.startsWith(today))
    .sort((a, b) => b.enviadoEn.localeCompare(a.enviadoEn));

  if (todayItems.length === 0) return null;

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#52B788]" />
        <span className="text-sm font-semibold">Enviados hoy</span>
        <span className="ml-auto text-xs bg-[#52B788]/10 text-[#52B788] font-semibold px-2 py-0.5 rounded-full">
          {todayItems.length}
        </span>
      </div>
      <div className="divide-y max-h-[220px] overflow-y-auto">
        {todayItems.map(n => {
          const hora = new Date(n.enviadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={n.id} className="flex items-center gap-3 px-4 py-2.5" data-testid={`history-item-${n.id}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${n.metodo === 'whatsapp' ? 'bg-[#25D366]/15' : 'bg-[#2C7DA0]/10'}`}>
                {n.metodo === 'whatsapp'
                  ? <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
                  : <ClipboardCopy className="w-3.5 h-3.5 text-[#2C7DA0]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.clienteNombre}</p>
                <p className="text-xs text-muted-foreground">
                  Cita: {formatDateLong(n.fecha)} {n.hora} · {n.servicio.slice(0, 28)}{n.servicio.length > 28 ? '…' : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{hora}</p>
                <p className={`text-[10px] font-semibold ${n.metodo === 'whatsapp' ? 'text-[#25D366]' : 'text-[#2C7DA0]'}`}>
                  {n.metodo === 'whatsapp' ? 'WhatsApp' : 'Copiado'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Recordatorios() {
  const { toast } = useToast();
  const [reservas, setReservas]           = useState<Reserva[]>([]);
  const [clientes, setClientes]           = useState<Cliente[]>([]);
  const [servicios, setServicios]         = useState<Servicio[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionEnvio[]>([]);
  const [period, setPeriod]               = useState<Period>('manana');

  useEffect(() => {
    setReservas(store.getReservas());
    setClientes(store.getClientes());
    setServicios(store.getServicios());
    setNotificaciones(store.getNotificaciones());
  }, []);

  const today    = toDateStr(new Date());
  const tomorrow = toDateStr(addDays(new Date(), 1));

  const weekDates = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i <= 6; i++) s.add(toDateStr(addDays(new Date(), i)));
    return s;
  }, []);

  // Rows filtered by period
  const rows = useMemo((): AppointmentRow[] => {
    const getServicio = (id: string) => servicios.find(s => s.id === id)?.nombre || id;
    return reservas
      .filter(r => {
        if (r.estado !== 'pendiente') return false;
        if (period === 'hoy')    return r.fecha === today;
        if (period === 'manana') return r.fecha === tomorrow;
        if (period === 'semana') return weekDates.has(r.fecha);
        return false;
      })
      .sort((a, b) => a.fecha !== b.fecha ? a.fecha.localeCompare(b.fecha) : a.hora.localeCompare(b.hora))
      .map(r => {
        const cliente = clientes.find(c => c.id === r.clienteId);
        if (!cliente) return null;
        const servicio = getServicio(r.servicio);
        return {
          reserva: r, cliente, servicio,
          message: buildWhatsAppMessage(cliente.nombre, r.fecha, r.hora, servicio),
          waUrl: buildWaUrl(cliente.telefono, buildWhatsAppMessage(cliente.nombre, r.fecha, r.hora, servicio)),
        };
      })
      .filter(Boolean) as AppointmentRow[];
  }, [reservas, clientes, servicios, period, today, tomorrow, weekDates]);

  // Build map: reservaId → latest notification today
  const notifiedTodayMap = useMemo(() => {
    const map: Record<string, { metodo: 'whatsapp' | 'copia'; enviadoEn: string }> = {};
    notificaciones
      .filter(n => n.enviadoEn.startsWith(today))
      .sort((a, b) => a.enviadoEn.localeCompare(b.enviadoEn))
      .forEach(n => { map[n.reservaId] = { metodo: n.metodo, enviadoEn: n.enviadoEn }; });
    return map;
  }, [notificaciones, today]);

  // Stat counts for last 7 days
  const weekStart = toDateStr(addDays(new Date(), -6));
  const weekNotifs = notificaciones.filter(n => n.enviadoEn.split('T')[0] >= weekStart);

  const handleSent = (
    reservaId: string,
    clienteId: string,
    clienteNombre: string,
    metodo: 'whatsapp' | 'copia'
  ) => {
    const row = rows.find(r => r.reserva.id === reservaId);
    if (!row) return;
    const entry: NotificacionEnvio = {
      id: `n${Date.now()}`,
      reservaId, clienteId, clienteNombre,
      fecha: row.reserva.fecha,
      hora: row.reserva.hora,
      servicio: row.servicio,
      enviadoEn: new Date().toISOString(),
      metodo,
    };
    const updated = store.addNotificacion(entry);
    setNotificaciones(updated);
    if (metodo === 'copia') {
      toast({ title: "Mensaje copiado", description: `Listo para enviar a ${clienteNombre.split(' ')[0]}` });
    } else {
      toast({ title: "WhatsApp abierto", description: `Enviando recordatorio a ${clienteNombre.split(' ')[0]}` });
    }
  };

  const handleSendAll = () => {
    const uncontacted = rows.filter(r => !notifiedTodayMap[r.reserva.id]);
    const target = uncontacted.length > 0 ? uncontacted[0] : rows[0];
    if (!target) return;
    window.open(target.waUrl, '_blank');
    handleSent(target.reserva.id, target.cliente.id, target.cliente.nombre, 'whatsapp');
  };

  const sentCount  = rows.filter(r => notifiedTodayMap[r.reserva.id]).length;
  const pendCount  = rows.length - sentCount;

  const periodLabels: { key: Period; label: string; emoji: string }[] = [
    { key: 'manana', label: 'Mañana',       emoji: '🌅' },
    { key: 'hoy',    label: 'Hoy',          emoji: '📅' },
    { key: 'semana', label: 'Esta semana',  emoji: '📆' },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
            Recordatorios WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            Envía confirmaciones de cita a tus pacientes con un clic.
          </p>
        </div>
        {rows.length > 0 && pendCount > 0 && (
          <Button
            size="sm"
            onClick={handleSendAll}
            className="bg-[#25D366] hover:bg-[#1eb554] text-white shadow-sm gap-1.5"
            data-testid="button-send-all"
          >
            <Send className="w-4 h-4" />
            Enviar siguiente
          </Button>
        )}
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {periodLabels.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            data-testid={`button-period-${p.key}`}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium border transition-all ${
              period === p.key
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <span>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Progress bar (when there are rows) */}
      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{sentCount}</strong> de {rows.length} notificados hoy
            </span>
            <span className={sentCount === rows.length ? 'text-[#52B788] font-semibold' : ''}>
              {sentCount === rows.length ? '✓ Todos contactados' : `${pendCount} pendiente${pendCount !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#52B788] rounded-full transition-all duration-500"
              style={{ width: rows.length > 0 ? `${Math.round((sentCount / rows.length) * 100)}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Weekly chart */}
      <WeeklyStats notificaciones={weekNotifs} />

      {/* Appointment list */}
      <div className="space-y-3">
        {rows.map(row => (
          <AppointmentCard
            key={row.reserva.id}
            row={row}
            notifiedToday={notifiedTodayMap[row.reserva.id] || null}
            onSent={handleSent}
          />
        ))}

        {rows.length === 0 && (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                <CheckCheck className="w-7 h-7 text-[#52B788]" />
              </div>
              <p className="font-semibold text-foreground">Sin citas pendientes</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {period === 'manana' && 'No hay citas pendientes para mañana.'}
                {period === 'hoy'    && 'No hay citas pendientes para hoy.'}
                {period === 'semana' && 'No hay citas pendientes para esta semana.'}
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                setReservas(store.getReservas());
                setNotificaciones(store.getNotificaciones());
              }} data-testid="button-refresh">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Actualizar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* History panel */}
      <HistoryPanel notificaciones={notificaciones} clientes={clientes} />

      {/* Info footer */}
      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
        <div className="space-y-1">
          <p><strong className="text-foreground">Solo citas con estado "Pendiente"</strong> aparecen aquí.</p>
          <p>El historial de envíos se guarda localmente en este dispositivo y se limpia automáticamente después de 30 días. Para cambiar el estado de una cita ve a <strong className="text-foreground">Reservas</strong>.</p>
        </div>
      </div>
    </div>
  );
}
