import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Users, CalendarCheck, TrendingUp, CalendarClock, Star, Clock, ChevronRight, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

const stateColors: Record<string, { bg: string; text: string; label: string }> = {
  atendida:    { bg: '#52B788/15', text: '#2d7a52', label: 'Atendida' },
  pendiente:   { bg: '#2C7DA0/15', text: '#2C7DA0', label: 'Pendiente' },
  cancelada:   { bg: 'red-100', text: 'red-700', label: 'Cancelada' },
  reprogramada:{ bg: 'amber-100', text: 'amber-700', label: 'Reprogramada' },
};

const stateStyle: Record<string, string> = {
  atendida:    'bg-[#52B788]/15 text-[#2d7a52] border-[#52B788]/30',
  pendiente:   'bg-[#2C7DA0]/15 text-[#2C7DA0] border-[#2C7DA0]/30',
  cancelada:   'bg-red-100 text-red-700 border-red-200',
  reprogramada:'bg-amber-100 text-amber-700 border-amber-200',
};

const cardVariants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const container    = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

interface Metric {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  href: string;
}

export default function Dashboard() {
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [reservas, setReservas]   = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    setClientes(store.getClientes());
    setReservas(store.getReservas());
    setServicios(store.getServicios());
  }, []);

  const today        = new Date().toISOString().split('T')[0];
  const todayReservas = reservas.filter(r => r.fecha === today).sort((a, b) => a.hora.localeCompare(b.hora));
  const attendedToday = todayReservas.filter(r => r.estado === 'atendida');
  const upcomingToday = todayReservas.filter(r => r.estado === 'pendiente');
  const todayIncome   = attendedToday.reduce((s, r) => s + r.precio, 0);
  const frecuentes    = clientes.filter(c => reservas.filter(r => r.clienteId === c.id && r.estado === 'atendida').length >= 5);

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 6 + i);
    const dateStr = dt.toISOString().split('T')[0];
    const income = reservas.filter(r => r.fecha === dateStr && r.estado === 'atendida').reduce((s, r) => s + r.precio, 0);
    return { name: dt.toLocaleDateString('es-PE', { weekday: 'short' }), income, isToday: dateStr === today };
  });

  const recentClientes = [...clientes]
    .sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime())
    .slice(0, 5);

  const getServiceName = (id: string) => {
    const s = servicios.find(s => s.id === id)?.nombre || id;
    return s.length > 24 ? s.slice(0, 22) + '…' : s;
  };

  const metrics: Metric[] = [
    { label: 'Clientes totales',  value: clientes.length,         sub: 'pacientes registrados',      icon: Users,        gradient: 'metric-blue',   href: '/clientes'  },
    { label: 'Citas hoy',         value: todayReservas.length,    sub: 'en agenda de hoy',           icon: CalendarClock,gradient: 'metric-teal',   href: '/reservas'  },
    { label: 'Atendidos hoy',     value: attendedToday.length,    sub: `de ${todayReservas.length} programadas`, icon: CalendarCheck, gradient: 'metric-green',  href: '/reservas'  },
    { label: 'Ingresos hoy',      value: `S/ ${todayIncome}`,     sub: 'cobrados hoy',               icon: TrendingUp,   gradient: 'metric-amber',  href: '/reportes'  },
    { label: 'Pacientes VIP',     value: frecuentes.length,       sub: '5+ visitas registradas',     icon: Star,         gradient: 'metric-violet', href: '/frecuentes'},
    { label: 'Por confirmar',     value: upcomingToday.length,    sub: 'citas pendientes hoy',       icon: Clock,        gradient: 'metric-indigo', href: '/recordatorios'},
  ];

  const handleBackup = () => store.exportBackup();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleBackup}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all shadow-sm"
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
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Ingresos de la semana</CardTitle>
            <Link href="/reportes">
              <span className="text-xs text-primary hover:underline">Ver reporte</span>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D1DCE5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7b8d' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7b8d' }} tickFormatter={v => `S/${v}`} />
                  <Tooltip
                    formatter={(v: number) => [`S/ ${v}`, 'Ingresos']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #D1DCE5', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: 'rgba(44,125,160,0.07)' }}
                  />
                  <Bar
                    dataKey="income"
                    radius={[5, 5, 0, 0]}
                    fill="#2C7DA0"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's appointments */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Citas de Hoy</CardTitle>
              <Link href="/reservas">
                <span className="text-xs text-primary hover:underline">Ver todas</span>
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
              ) : (
                todayReservas.map(reserva => {
                  const cliente = clientes.find(c => c.id === reserva.clienteId);
                  return (
                    <div
                      key={reserva.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                      data-testid={`row-cita-${reserva.id}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {cliente?.nombre.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">{cliente?.nombre || '—'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{getServiceName(reserva.servicio)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">{reserva.hora}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${stateStyle[reserva.estado]}`}>
                          {stateColors[reserva.estado]?.label || reserva.estado}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent patients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Últimos pacientes registrados</h2>
          <Link href="/clientes">
            <span className="text-xs text-primary hover:underline flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {recentClientes.map((c, i) => {
            const visits = reservas.filter(r => r.clienteId === c.id && r.estado === 'atendida').length;
            const colorMap = ['#2C7DA0','#52B788','#7c3aed','#f59e0b','#0d9488'];
            const bg = colorMap[i % colorMap.length];
            return (
              <Link key={c.id} href={`/historial/${c.id}`}>
                <div
                  className="p-4 rounded-2xl bg-card border hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 group"
                  data-testid={`card-cliente-${c.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold mb-3 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${bg}, ${bg}bb)` }}
                  >
                    {c.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <p className="text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">{c.nombre}</p>
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
      <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-[#52B788]/8 border-[#52B788]/20 text-xs text-[#2d7a52]">
        <div className="w-6 h-6 rounded-lg bg-[#52B788]/20 flex items-center justify-center shrink-0">
          <span className="text-sm">💾</span>
        </div>
        <p>
          <strong>Datos guardados automáticamente</strong> en tu navegador (localStorage). 
          Persisten aunque cierres o apagues la computadora. Usa <strong>Backup JSON</strong> o ve a <strong>Configuración</strong> para exportar/restaurar tus datos.
        </p>
      </div>
    </div>
  );
}
