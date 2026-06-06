import { useState, useEffect, useMemo } from "react";
import { store, Reserva, Cliente, Servicio } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle, Copy, CheckCheck, Phone, Calendar,
  Clock, ChevronRight, Send, AlertCircle, RefreshCw
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

const MONTHS_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
}

function buildWhatsAppMessage(
  clienteName: string,
  fecha: string,
  hora: string,
  servicio: string
): string {
  const dateLabel = formatDateLong(fecha);
  return `Hola ${clienteName.split(' ')[0]} 👋, le recordamos su cita en *PodoClinic* para el día *${dateLabel}* a las *${hora} hrs*.

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'manana' | 'hoy' | 'semana';

interface AppointmentRow {
  reserva: Reserva;
  cliente: Cliente;
  servicio: string;
  message: string;
  waUrl: string;
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({ row, onCopy }: { row: AppointmentRow; onCopy: (msg: string, name: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(row.message).then(() => {
      setCopied(true);
      onCopy(row.message, row.cliente.nombre);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const isToday = row.reserva.fecha === toDateStr(new Date());
  const isTomorrow = row.reserva.fecha === toDateStr(addDays(new Date(), 1));

  return (
    <div
      className="flex items-stretch gap-0 border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow"
      data-testid={`card-recordatorio-${row.reserva.id}`}
    >
      {/* Color stripe */}
      <div className="w-1.5 shrink-0 bg-[#52B788]" />

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="flex flex-wrap items-start gap-2 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {row.cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{row.cliente.nombre}</p>
                <a
                  href={`tel:${row.cliente.telefono}`}
                  className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                >
                  <Phone className="w-2.5 h-2.5" />
                  {row.cliente.telefono}
                </a>
              </div>
            </div>
          </div>

          {/* Date/time badge */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {isToday && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px]">Hoy</span>
            )}
            {isTomorrow && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">Mañana</span>
            )}
            {!isToday && !isTomorrow && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateLong(row.reserva.fecha)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {row.reserva.hora}
            </span>
          </div>
        </div>

        {/* Service */}
        <p className="text-xs text-muted-foreground mt-2 pl-10">
          🦶 {row.servicio}
          {row.reserva.observaciones && (
            <span className="ml-2 text-muted-foreground/70">· {row.reserva.observaciones.slice(0, 60)}{row.reserva.observaciones.length > 60 ? '…' : ''}</span>
          )}
        </p>

        {/* Message preview */}
        <div className="mt-3 pl-10">
          <div className="bg-[#f0fdf4] border border-[#52B788]/20 rounded-lg p-2.5 text-[11px] text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap max-h-[80px] overflow-hidden relative">
            {row.message}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-[#f0fdf4] to-transparent" />
          </div>
        </div>
      </div>

      {/* Actions column */}
      <div className="flex flex-col gap-2 items-center justify-center px-3 py-4 border-l bg-muted/20 shrink-0">
        <a
          href={row.waUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`button-whatsapp-${row.reserva.id}`}
          className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#25D366] text-white hover:bg-[#1eb554] transition-colors shadow-sm hover:shadow-md active:scale-95"
          title={`Enviar WhatsApp a ${row.cliente.nombre}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[9px] font-semibold tracking-wide">WA</span>
        </a>

        <button
          onClick={handleCopy}
          data-testid={`button-copy-${row.reserva.id}`}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all active:scale-95 ${copied ? 'bg-[#52B788]/15 border-[#52B788]/30 text-[#52B788]' : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary'}`}
          title="Copiar mensaje"
        >
          {copied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          <span className="text-[9px] font-semibold tracking-wide">{copied ? 'OK' : 'Copiar'}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Recordatorios() {
  const { toast } = useToast();
  const [reservas, setReservas]   = useState<Reserva[]>([]);
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [period, setPeriod]       = useState<Period>('manana');
  const [sentIds, setSentIds]     = useState<Set<string>>(new Set());

  useEffect(() => {
    setReservas(store.getReservas());
    setClientes(store.getClientes());
    setServicios(store.getServicios());
  }, []);

  const today    = toDateStr(new Date());
  const tomorrow = toDateStr(addDays(new Date(), 1));

  const weekDates = useMemo(() => {
    const dates = new Set<string>();
    for (let i = 0; i <= 6; i++) dates.add(toDateStr(addDays(new Date(), i)));
    return dates;
  }, []);

  const rows = useMemo((): AppointmentRow[] => {
    const getClientName = (id: string) => clientes.find(c => c.id === id) || null;
    const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

    return reservas
      .filter(r => {
        if (r.estado !== 'pendiente') return false;
        if (period === 'hoy')    return r.fecha === today;
        if (period === 'manana') return r.fecha === tomorrow;
        if (period === 'semana') return weekDates.has(r.fecha);
        return false;
      })
      .sort((a, b) => {
        const d = a.fecha.localeCompare(b.fecha);
        return d !== 0 ? d : a.hora.localeCompare(b.hora);
      })
      .map(r => {
        const cliente = getClientName(r.clienteId);
        if (!cliente) return null;
        const servicio = getServiceName(r.servicio);
        const message = buildWhatsAppMessage(cliente.nombre, r.fecha, r.hora, servicio);
        const waUrl = buildWaUrl(cliente.telefono, message);
        return { reserva: r, cliente, servicio, message, waUrl };
      })
      .filter(Boolean) as AppointmentRow[];
  }, [reservas, clientes, servicios, period, today, tomorrow, weekDates]);

  const handleCopy = (_msg: string, name: string) => {
    setSentIds(prev => new Set([...prev, name]));
    toast({ title: "Mensaje copiado", description: `Listo para enviar a ${name.split(' ')[0]}` });
  };

  const handleSendAll = () => {
    if (rows.length === 0) return;
    // Open first unsent in new tab
    const unsent = rows.filter(r => !sentIds.has(r.cliente.nombre));
    const target = unsent.length > 0 ? unsent[0] : rows[0];
    window.open(target.waUrl, '_blank');
    toast({
      title: `Abriendo WhatsApp`,
      description: `${target.cliente.nombre.split(' ')[0]} — ${target.reserva.hora}. Continúa con los demás botones individualmente.`,
    });
  };

  const periodLabels: { key: Period; label: string; emoji: string }[] = [
    { key: 'manana', label: 'Mañana', emoji: '🌅' },
    { key: 'hoy',    label: 'Hoy',    emoji: '📅' },
    { key: 'semana', label: 'Esta semana', emoji: '📆' },
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
        {rows.length > 0 && (
          <Button
            size="sm"
            onClick={handleSendAll}
            className="bg-[#25D366] hover:bg-[#1eb554] text-white shadow-sm gap-1.5"
            data-testid="button-send-all"
          >
            <Send className="w-4 h-4" />
            Abrir primero
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
            <span>{p.emoji}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      {rows.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-[#25D366]/5 border border-[#25D366]/20 rounded-lg text-sm">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{rows.length}</strong> cita{rows.length !== 1 ? 's' : ''} pendiente{rows.length !== 1 ? 's' : ''}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground text-xs">
            Haz clic en <MessageCircle className="inline w-3 h-3 text-[#25D366]" /> para abrir WhatsApp con el mensaje ya escrito
          </span>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {rows.map(row => (
          <AppointmentCard key={row.reserva.id} row={row} onCopy={handleCopy} />
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
                {period === 'hoy' && 'No hay citas pendientes para hoy.'}
                {period === 'semana' && 'No hay citas pendientes para esta semana.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setReservas(store.getReservas());
                  setClientes(store.getClientes());
                  setServicios(store.getServicios());
                }}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Actualizar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
        <div className="space-y-1">
          <p><strong className="text-foreground">Solo citas con estado "Pendiente"</strong> aparecen aquí.</p>
          <p>Al pulsar el botón verde se abre WhatsApp Web o la app con el mensaje ya redactado. El número de teléfono debe tener 9 dígitos peruanos. Para cambiar el estado de una cita, ve a <strong className="text-foreground">Reservas</strong>.</p>
        </div>
      </div>
    </div>
  );
}
