import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Users, CalendarCheck, TrendingUp, CalendarClock, Star, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

const stateColors: Record<string, string> = {
  atendida: 'bg-[#52B788]/15 text-[#2d7a52] border-[#52B788]/30',
  pendiente: 'bg-[#2C7DA0]/15 text-[#2C7DA0] border-[#2C7DA0]/30',
  cancelada: 'bg-red-100 text-red-700 border-red-200',
  reprogramada: 'bg-amber-100 text-amber-700 border-amber-200',
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    setClientes(store.getClientes());
    setReservas(store.getReservas());
    setServicios(store.getServicios());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayReservas = reservas.filter(r => r.fecha === today).sort((a, b) => a.hora.localeCompare(b.hora));
  const attendedToday = todayReservas.filter(r => r.estado === 'atendida');
  const todayIncome = attendedToday.reduce((sum, r) => sum + r.precio, 0);
  const upcomingToday = todayReservas.filter(r => r.estado === 'pendiente');

  const frecuentes = clientes.filter(c => {
    const visits = reservas.filter(r => r.clienteId === c.id && r.estado === 'atendida').length;
    return visits >= 5;
  });

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 6 + i);
    const dateStr = dt.toISOString().split('T')[0];
    const income = reservas
      .filter(r => r.fecha === dateStr && r.estado === 'atendida')
      .reduce((sum, r) => sum + r.precio, 0);
    return { name: dt.toLocaleDateString('es-PE', { weekday: 'short' }), income };
  });

  const recentClientes = [...clientes]
    .sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime())
    .slice(0, 5);

  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

  const metrics = [
    { label: 'Clientes Totales', value: clientes.length, icon: Users, color: 'text-primary', href: '/clientes' },
    { label: 'Citas Hoy', value: todayReservas.length, icon: CalendarClock, color: 'text-[#2C7DA0]', href: '/reservas' },
    { label: 'Atendidos Hoy', value: attendedToday.length, icon: CalendarCheck, color: 'text-[#52B788]', href: '/reservas' },
    { label: 'Ingresos Hoy', value: `S/ ${todayIncome}`, icon: TrendingUp, color: 'text-[#52B788]', href: '/reportes' },
    { label: 'Clientes Frecuentes', value: frecuentes.length, icon: Star, color: 'text-amber-500', href: '/frecuentes' },
    { label: 'Próximas Citas', value: upcomingToday.length, icon: Clock, color: 'text-[#2C7DA0]', href: '/reservas' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <motion.div
        className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} variants={cardVariants}>
              <Link href={m.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary" data-testid={`card-metric-${m.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground font-medium leading-tight">{m.label}</p>
                      <Icon className={`w-4 h-4 ${m.color} shrink-0`} />
                    </div>
                    <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ingresos de la semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECEF" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                  <Tooltip
                    formatter={(v: number) => [`S/ ${v}`, 'Ingresos']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E9ECEF', fontSize: 12 }}
                    cursor={{ fill: 'rgba(44,125,160,0.06)' }}
                  />
                  <Bar dataKey="income" fill="#2C7DA0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Citas de Hoy</CardTitle>
              <Link href="/reservas">
                <span className="text-xs text-primary hover:underline">Ver todas</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayReservas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay citas para hoy.</p>
              ) : (
                todayReservas.map(reserva => {
                  const cliente = clientes.find(c => c.id === reserva.clienteId);
                  return (
                    <div
                      key={reserva.id}
                      className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-muted/40 transition-colors"
                      data-testid={`row-cita-${reserva.id}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold text-primary w-11 shrink-0">{reserva.hora}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{cliente?.nombre || '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{getServiceName(reserva.servicio)}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ml-2 ${stateColors[reserva.estado]}`}>
                        {reserva.estado}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Últimos pacientes registrados</CardTitle>
            <Link href="/clientes">
              <span className="text-xs text-primary hover:underline">Ver todos</span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {recentClientes.map(c => {
              const visits = reservas.filter(r => r.clienteId === c.id && r.estado === 'atendida').length;
              return (
                <Link key={c.id} href={`/historial/${c.id}`}>
                  <div
                    className="p-3 border rounded-lg hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer"
                    data-testid={`card-cliente-${c.id}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary text-xs font-bold mb-2">
                      {c.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <p className="text-sm font-medium truncate">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">DNI: {c.dni}</p>
                    <p className="text-xs text-muted-foreground">{visits} visita{visits !== 1 ? 's' : ''}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
