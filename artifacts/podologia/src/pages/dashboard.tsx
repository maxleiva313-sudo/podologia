import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Users, CalendarCheck, TrendingUp, CalendarClock, Star, Clock, ChevronRight, Download, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { border: string; bg: string; text: string; pill: string; label: string }> = {
  atendida:    { border: '#1D9E75', bg: '#f0faf5', text: '#0a5c3d', pill: 'bg-[#1D9E75]/15 text-[#0a5c3d]',   label: 'Atendida'     },
  pendiente:   { border: '#185FA5', bg: '#f0f5ff', text: '#0f3e70', pill: 'bg-[#185FA5]/15 text-[#0f3e70]',   label: 'Pendiente'    },
  cancelada:   { border: '#dc2626', bg: '#fef2f2', text: '#991b1b', pill: 'bg-red-100 text-red-700',           label: 'Cancelada'    },
  reprogramada:{ border: '#d97706', bg: '#fffbeb', text: '#92400e', pill: 'bg-amber-100 text-amber-700',       label: 'Reprogramada' },
};

const WEEKDAYS_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_SHORT   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const cardVariants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const container    = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(dt: Date) { return dt.toISOString().split('T')[0]; }

function buildWeekDays(from: Date, count = 7) {
  return Array.from({ length: count }).map((_, i) => {
    const dt = new Date(from);
    dt.setDate(from.getDate() + i);
    return { date: dateStr(dt), weekday: WEEKDAYS_SHORT[dt.getDay()], day: dt.getDate(), month: MONTHS_SHORT[dt.getMonth()] };
  });
}

// ─── Weekly agenda widget ─────────────────────────────────────────────────────

function WeekAgenda({ reservas, clientes, servicios, today }: {
  reservas: Reserva[]; clientes: Cliente[]; servicios: Servicio[]; today: string;
}) {
  const [selected, setSelected] = useState(today);
  const weekDays = buildWeekDays(new Date(today + 'T12:00:00'));

  const byDate = (date: string) =>
    reservas.filter(r => r.fecha === date).sort((a, b) => a.hora.localeCompare(b.hora));

  const selectedAppointments = byDate(selected);
  const selectedDay = weekDays.find(d => d.date === selected) || weekDays[0];

  const getClient  = (id: string) => clientes.find(c => c.id === id);
  const getSvcName = (id: string) => {
    const n = servicios.find(s => s.id === id)?.nombre || id;
    return n.length > 30 ? n.slice(0, 28) + '…' : n;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4" style={{ color: '#1D9E75' }} />
            Agenda semanal
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Próximos 7 días</p>
        </div>
        <Link href="/reservas">
          <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 mt-0.5">
            Abrir calendario <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">

        {/* Day selector strip */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map(d => {
            const count   = byDate(d.date).length;
            const isToday = d.date === today;
            const isSel   = d.date === selected;
            const hasCitas = count > 0;
            return (
              <button
                key={d.date}
                onClick={() => setSelected(d.date)}
                data-testid={`week-day-${d.date}`}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border ${
                  isSel
                    ? 'text-white border-transparent shadow-md'
                    : isToday
                    ? 'border-[#1D9E75]/40 bg-[#1D9E75]/8'
                    : 'border-transparent hover:bg-muted/60'
                }`}
                style={isSel ? { background: '#1D9E75' } : undefined}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isSel ? 'text-white/80' : isToday ? 'text-[#1D9E75]' : 'text-muted-foreground'
                }`}>
                  {d.weekday}
                </span>
                <span className={`text-base font-bold leading-none mt-0.5 ${
                  isSel ? 'text-white' : isToday ? 'text-[#1D9E75]' : 'text-foreground'
                }`}>
                  {d.day}
                </span>
                <span className={`text-[9px] mt-0.5 ${isSel ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {d.month}
                </span>
                {/* Appointment count dot */}
                {hasCitas && (
                  <span className={`mt-1 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center ${
                    isSel ? 'bg-white/25 text-white' : 'text-white'
                  }`}
                  style={!isSel ? { background: '#1D9E75' } : undefined}>
                    {count}
                  </span>
                )}
                {!hasCitas && <span className="mt-1 h-[18px]" />}
              </button>
            );
          })}
        </div>

        {/* Appointment list for selected day */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {selectedAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-muted/20 border border-dashed border-muted-foreground/20">
                <CalendarCheck className="w-7 h-7 text-muted-foreground/25 mb-1.5" />
                <p className="text-sm text-muted-foreground">
                  Sin citas {selectedDay.date === today ? 'hoy' : `el ${selectedDay.weekday} ${selectedDay.day}`}
                </p>
                <Link href="/reservas">
                  <span className="text-xs text-[#1D9E75] hover:underline mt-1">+ Agendar cita</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-0.5">
                {selectedAppointments.map((r, idx) => {
                  const c  = getClient(r.clienteId);
                  const st = STATUS_STYLE[r.estado] || STATUS_STYLE.pendiente;
                  const initials = c?.nombre.split(' ').map(n => n[0]).slice(0, 2).join('') || '?';
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.15 }}
                    >
                      <Link href={`/historial/${r.clienteId}`}>
                        <div
                          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:shadow-sm transition-all group"
                          style={{
                            background: st.bg,
                            borderLeft: `3px solid ${st.border}`,
                            border: `1px solid ${st.border}20`,
                            borderLeftWidth: '3px',
                          }}
                          data-testid={`agenda-row-${r.id}`}
                        >
                          {/* Time */}
                          <div className="text-center shrink-0 w-10">
                            <p className="text-xs font-bold" style={{ color: st.border }}>{r.hora}</p>
                          </div>

                          {/* Avatar */}
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ background: st.border }}
                          >
                            {initials}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate leading-tight group-hover:underline" style={{ color: st.text }}>
                              {c?.nombre || '—'}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">{getSvcName(r.servicio)}</p>
                          </div>

                          {/* Status + price */}
                          <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.pill}`}>
                              {st.label}
                            </span>
                            <span className="text-[11px] font-semibold" style={{ color: st.border }}>
                              S/ {r.precio}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Day summary footer */}
        {selectedAppointments.length > 0 && (
          <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {selectedAppointments.filter(r => r.estado === 'atendida').length} atendidas ·{' '}
              {selectedAppointments.filter(r => r.estado === 'pendiente').length} pendientes
            </span>
            <span className="font-semibold" style={{ color: '#1D9E75' }}>
              S/ {selectedAppointments.filter(r => r.estado === 'atendida').reduce((s, r) => s + r.precio, 0)} recaudados
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

interface Metric {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; gradient: string; href: string;
}

export default function Dashboard() {
  const [clientes,  setClientes]  = useState<Cliente[]>([]);
  const [reservas,  setReservas]  = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    setClientes(store.getClientes());
    setReservas(store.getReservas());
    setServicios(store.getServicios());
  }, []);

  const today         = new Date().toISOString().split('T')[0];
  const todayReservas = reservas.filter(r => r.fecha === today).sort((a, b) => a.hora.localeCompare(b.hora));
  const attendedToday = todayReservas.filter(r => r.estado === 'atendida');
  const upcomingToday = todayReservas.filter(r => r.estado === 'pendiente');
  const todayIncome   = attendedToday.reduce((s, r) => s + r.precio, 0);
  const frecuentes    = clientes.filter(c => reservas.filter(r => r.clienteId === c.id && r.estado === 'atendida').length >= 5);

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 6 + i);
    const ds  = dt.toISOString().split('T')[0];
    const income = reservas.filter(r => r.fecha === ds && r.estado === 'atendida').reduce((s, r) => s + r.precio, 0);
    return { name: dt.toLocaleDateString('es-PE', { weekday: 'short' }), income, isToday: ds === today };
  });

  const recentClientes = [...clientes]
    .sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime())
    .slice(0, 5);

  const getSvcName = (id: string) => {
    const s = servicios.find(s => s.id === id)?.nombre || id;
    return s.length > 24 ? s.slice(0, 22) + '…' : s;
  };

  const metrics: Metric[] = [
    { label: 'Clientes totales', value: clientes.length,         sub: 'pacientes registrados',               icon: Users,        gradient: 'metric-blue',   href: '/clientes'      },
    { label: 'Citas hoy',        value: todayReservas.length,    sub: 'en agenda de hoy',                    icon: CalendarClock,gradient: 'metric-teal',   href: '/reservas'      },
    { label: 'Atendidos hoy',    value: attendedToday.length,    sub: `de ${todayReservas.length} programadas`, icon: CalendarCheck, gradient: 'metric-green',  href: '/reservas'   },
    { label: 'Ingresos hoy',     value: `S/ ${todayIncome}`,     sub: 'cobrados hoy',                        icon: TrendingUp,   gradient: 'metric-amber',  href: '/reportes'      },
    { label: 'Pacientes VIP',    value: frecuentes.length,       sub: '5+ visitas registradas',              icon: Star,         gradient: 'metric-violet', href: '/frecuentes'    },
    { label: 'Por confirmar',    value: upcomingToday.length,    sub: 'citas pendientes hoy',                icon: Clock,        gradient: 'metric-indigo', href: '/recordatorios' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => store.exportBackup()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[#1D9E75]/40 transition-all shadow-sm"
          title="Exportar backup completo"
          data-testid="button-dashboard-backup"
        >
          <Download className="w-3.5 h-3.5" /> Backup JSON
        </button>
      </div>

      {/* Metric cards */}
      <motion.div
        className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        variants={container} initial="hidden" animate="show"
      >
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} variants={cardVariants}>
              <Link href={m.href}>
                <div
                  className={`${m.gradient} rounded-2xl p-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group`}
                  data-testid={`card-metric-${m.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-2xl font-bold text-white leading-tight">{m.value}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 leading-tight">{m.label}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Bar chart */}
        <Card className="lg:col-span-3 shadow-sm border-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Ingresos de la semana</CardTitle>
            <Link href="/reportes">
              <span className="text-xs text-muted-foreground hover:text-foreground">Ver reporte</span>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7b8d' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7b8d' }} tickFormatter={v => `S/${v}`} />
                  <Tooltip
                    formatter={(v: number) => [`S/ ${v}`, 'Ingresos']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: 'rgba(29,158,117,0.07)' }}
                  />
                  <Bar dataKey="income" radius={[5, 5, 0, 0]} fill="#1D9E75" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's appointments */}
        <Card className="lg:col-span-2 shadow-sm border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Citas de Hoy</CardTitle>
              <Link href="/reservas">
                <span className="text-xs text-muted-foreground hover:text-foreground">Ver todas</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {todayReservas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarCheck className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin citas para hoy</p>
                </div>
              ) : todayReservas.map(r => {
                const c  = clientes.find(cl => cl.id === r.clienteId);
                const st = STATUS_STYLE[r.estado] || STATUS_STYLE.pendiente;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                    data-testid={`row-cita-${r.id}`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                      style={{ background: st.border }}>
                      {c?.nombre.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{c?.nombre || '—'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{getSvcName(r.servicio)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold" style={{ color: st.border }}>{r.hora}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${st.pill}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── WEEKLY AGENDA ──────────────────────────────────────────────────── */}
      <WeekAgenda
        reservas={reservas}
        clientes={clientes}
        servicios={servicios}
        today={today}
      />

      {/* Recent patients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Últimos pacientes registrados</h2>
          <Link href="/clientes">
            <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {recentClientes.map((c, i) => {
            const visits  = reservas.filter(r => r.clienteId === c.id && r.estado === 'atendida').length;
            const colorMap = ['#1D9E75','#0F6E56','#534AB7','#BA7517','#185FA5'];
            const bg = colorMap[i % colorMap.length];
            return (
              <Link key={c.id} href={`/historial/${c.id}`}>
                <div
                  className="p-4 rounded-2xl bg-card border-0 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 group"
                  data-testid={`card-cliente-${c.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold mb-3 shadow-sm"
                    style={{ background: bg }}
                  >
                    {c.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <p className="text-sm font-semibold truncate leading-tight group-hover:text-[#1D9E75] transition-colors">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">DNI: {c.dni}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1 rounded-full flex-1 bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(visits * 10, 100)}%`, background: bg }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">{visits}v</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Storage notice */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-[#1D9E75]/6 border-[#1D9E75]/15 text-xs text-[#0a5c3d]">
        <div className="w-6 h-6 rounded-lg bg-[#1D9E75]/15 flex items-center justify-center shrink-0">
          <span className="text-sm">💾</span>
        </div>
        <p>
          <strong>Datos guardados automáticamente</strong> en tu navegador (localStorage).
          Persisten aunque cierres o apagues la computadora. Usa <strong>Backup JSON</strong> o ve a{' '}
          <Link href="/configuracion"><strong className="hover:underline cursor-pointer">Configuración</strong></Link>{' '}
          para exportar/restaurar tus datos.
        </p>
      </div>
    </div>
  );
}
