import { useState, useEffect, useMemo } from "react";
import { store, Reserva, Servicio, Cliente } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";
import {
  Download, FileText, TrendingUp, CalendarCheck, DollarSign, Star,
  Trophy, Users, ChevronUp,
} from "lucide-react";
import { exportToExcel, exportReportePDF } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// ─── Types & constants ────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'custom';
type ServiceSort = 'count' | 'income';

const PIE_COLORS  = ['#1D9E75','#0F6E56','#3B6D11','#BA7517','#534AB7','#185FA5','#5DCAA5'];
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(period: Period, customFrom: string, customTo: string): [Date, Date] {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (period === 'today') return [startOfDay(now), now];
  if (period === 'week') {
    const from = new Date(now); from.setDate(now.getDate() - 6);
    return [startOfDay(from), now];
  }
  if (period === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1), now];
  return [
    customFrom ? new Date(customFrom + 'T00:00:00') : new Date(now.getFullYear(), 0, 1),
    customTo   ? new Date(customTo   + 'T23:59:59') : now,
  ];
}

const RANK_MEDAL = ['🥇','🥈','🥉'];

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function MonthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'income' ? `S/ ${p.value}` : `${p.value} atenciones`}
        </p>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Reportes() {
  const { toast } = useToast();
  const [period,     setPeriod]     = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [svcSort,    setSvcSort]    = useState<ServiceSort>('count');
  const [reservas,   setReservas]   = useState<Reserva[]>([]);
  const [servicios,  setServicios]  = useState<Servicio[]>([]);
  const [clientes,   setClientes]   = useState<Cliente[]>([]);

  useEffect(() => {
    setReservas(store.getReservas());
    setServicios(store.getServicios());
    setClientes(store.getClientes());
  }, []);

  // ── Period-filtered data ──────────────────────────────────────────────────

  const [fromDate, toDate] = useMemo(
    () => getDateRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const filtered = useMemo(() =>
    reservas.filter(r => {
      if (r.estado !== 'atendida') return false;
      const d = new Date(r.fecha + 'T12:00:00');
      return d >= fromDate && d <= toDate;
    }),
    [reservas, fromDate, toDate]
  );

  const totalIncome   = filtered.reduce((s, r) => s + r.precio, 0);
  const totalAttended = filtered.length;
  const avgIncome     = totalAttended > 0 ? Math.round(totalIncome / totalAttended) : 0;

  const serviceCount: Record<string, { count: number; income: number }> = {};
  filtered.forEach(r => {
    const name = servicios.find(s => s.id === r.servicio)?.nombre || 'Otros';
    if (!serviceCount[name]) serviceCount[name] = { count: 0, income: 0 };
    serviceCount[name].count++;
    serviceCount[name].income += r.precio;
  });

  const pieData = Object.entries(serviceCount)
    .map(([name, { count }]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value);

  const mostRequested = pieData[0]?.name || '—';

  // Daily bar chart
  const dayMap: Record<string, { income: number; date: string }> = {};
  filtered.forEach(r => {
    const label = new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    if (!dayMap[label]) dayMap[label] = { income: 0, date: r.fecha };
    dayMap[label].income += r.precio;
  });
  const barData = Object.entries(dayMap)
    .map(([name, { income, date }]) => ({ name, income, date }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Global stats (all-time, for advanced section) ─────────────────────────

  const allAttended = useMemo(() => reservas.filter(r => r.estado === 'atendida'), [reservas]);

  // Monthly evolution — last 12 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const dt = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const yr = dt.getFullYear(), mo = dt.getMonth();
      const rows = allAttended.filter(r => {
        const d = new Date(r.fecha + 'T12:00:00');
        return d.getFullYear() === yr && d.getMonth() === mo;
      });
      return {
        name: `${MONTH_NAMES[mo]} ${String(yr).slice(2)}`,
        income: rows.reduce((s, r) => s + r.precio, 0),
        count:  rows.length,
      };
    });
  }, [allAttended]);

  const bestMonth = monthlyData.reduce((best, m) => m.income > best.income ? m : best, { name: '—', income: 0, count: 0 });

  // Top services (all-time)
  const allServiceMap: Record<string, { count: number; income: number; name: string }> = {};
  allAttended.forEach(r => {
    const name = servicios.find(s => s.id === r.servicio)?.nombre || 'Otros';
    if (!allServiceMap[name]) allServiceMap[name] = { count: 0, income: 0, name };
    allServiceMap[name].count++;
    allServiceMap[name].income += r.precio;
  });
  const topServices = Object.values(allServiceMap)
    .sort((a, b) => (svcSort === 'count' ? b.count - a.count : b.income - a.income))
    .slice(0, 6);
  const maxSvcVal = topServices[0]?.[svcSort] || 1;

  // Patient ranking (all-time total spending)
  const patientMap: Record<string, { id: string; nombre: string; total: number; visits: number }> = {};
  allAttended.forEach(r => {
    const c = clientes.find(cl => cl.id === r.clienteId);
    if (!c) return;
    if (!patientMap[c.id]) patientMap[c.id] = { id: c.id, nombre: c.nombre, total: 0, visits: 0 };
    patientMap[c.id].total  += r.precio;
    patientMap[c.id].visits += 1;
  });
  const topPatients = Object.values(patientMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  const maxPatientTotal = topPatients[0]?.total || 1;

  // ── Export ────────────────────────────────────────────────────────────────

  const getClientName  = (id: string) => clientes.find(c => c.id === id)?.nombre || '—';
  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;
  const sortedFiltered = [...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const handleExportExcel = () => {
    const data = sortedFiltered.map(r => ({
      Fecha:      new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE'),
      Hora:       r.hora,
      Paciente:   getClientName(r.clienteId),
      Servicio:   getServiceName(r.servicio),
      'Precio (S/)': r.precio,
    }));
    exportToExcel(data, `reporte_ingresos_${period}`);
    toast({ title: "Excel exportado" });
  };

  const handleExportPDF = () => {
    exportReportePDF(sortedFiltered, servicios, clientes, period);
    toast({ title: "PDF exportado" });
  };

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week',  label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'custom',label: 'Personalizado' },
  ];

  const metrics = [
    { label: 'Ingresos totales', value: `S/ ${totalIncome}`, icon: DollarSign,    color: '#1D9E75', bg: '#e6f7ef' },
    { label: 'Atenciones',       value: totalAttended,        icon: CalendarCheck, color: '#0F6E56', bg: '#e0f0ea' },
    { label: 'Ticket promedio',  value: `S/ ${avgIncome}`,    icon: TrendingUp,    color: '#185FA5', bg: '#e8f0fb' },
    { label: 'Servicio líder',   value: mostRequested,        icon: Star,          color: '#BA7517', bg: '#fdf3e3', small: true },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">Análisis financiero, servicios y pacientes.</p>
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

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2 items-center">
        {periods.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            data-testid={`button-period-${p.key}`}
            className={`h-8 px-4 rounded-full text-sm font-medium border transition-all ${
              period === p.key
                ? 'text-white border-transparent'
                : 'bg-background border-border text-muted-foreground hover:border-[#1D9E75]/50'
            }`}
            style={period === p.key ? { background: '#1D9E75' } : undefined}
          >
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 text-sm w-auto" data-testid="input-custom-from" />
            <span className="text-sm text-muted-foreground">—</span>
            <Input type="date" value={customTo}   onChange={e => setCustomTo(e.target.value)}   className="h-8 text-sm w-auto" data-testid="input-custom-to" />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                  </span>
                </div>
                <p className={`font-bold ${m.small ? 'text-sm leading-snug' : 'text-2xl'}`} style={{ color: m.color }}>{m.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row 1 — period-based */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Ingresos por día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {barData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos para el período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `S/${v}`} />
                    <Tooltip formatter={(v: number) => [`S/ ${v}`, 'Ingresos']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: 'rgba(29,158,117,0.08)' }} />
                    <Bar dataKey="income" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Distribución de servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos para el período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 10, color: '#6c757d' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── ESTADÍSTICAS AVANZADAS ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Estadísticas avanzadas</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Monthly evolution — last 12 months */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-700">Evolución mensual de ingresos</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos 12 meses · Todos los datos</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Mejor mes</p>
            <p className="text-sm font-bold" style={{ color: '#1D9E75' }}>{bestMonth.name} — S/ {bestMonth.income}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            {allAttended.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos históricos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ left: -10, right: 8 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1D9E75" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="countGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#185FA5" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="income" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `S/${v}`} />
                  <YAxis yAxisId="count" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip content={<MonthTooltip />} />
                  <Area yAxisId="income" type="monotone" dataKey="income" stroke="#1D9E75" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ r: 3, fill: '#1D9E75', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Area yAxisId="count"  type="monotone" dataKey="count"  stroke="#185FA5" strokeWidth={2}   fill="url(#countGrad)"  dot={{ r: 3, fill: '#185FA5', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center gap-5 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: '#1D9E75' }} /> Ingresos (S/)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: '#185FA5' }} /> Atenciones
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Services + Patient ranking */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Top Services */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-700">Servicios más solicitados</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Histórico general</p>
            </div>
            <div className="flex rounded-lg overflow-hidden border text-xs shrink-0">
              {(['count','income'] as ServiceSort[]).map(k => (
                <button
                  key={k}
                  onClick={() => setSvcSort(k)}
                  className={`px-2.5 py-1 font-medium transition-colors ${svcSort === k ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
                  style={svcSort === k ? { background: '#1D9E75' } : undefined}
                >
                  {k === 'count' ? 'Cantidad' : 'Ingresos'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {topServices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
            ) : topServices.map((svc, i) => {
              const val    = svc[svcSort];
              const pct    = Math.round((val / maxSvcVal) * 100);
              const label  = svcSort === 'count' ? `${val} veces` : `S/ ${val}`;
              return (
                <div key={svc.name} data-testid={`svc-rank-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-bold w-4 text-center shrink-0" style={{ color: i === 0 ? '#BA7517' : i === 1 ? '#6b7280' : '#92400e' }}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-medium text-gray-700 truncate">{svc.name}</span>
                    </div>
                    <span className="text-xs font-bold shrink-0 ml-2" style={{ color: '#1D9E75' }}>{label}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: i === 0
                          ? 'linear-gradient(90deg,#1D9E75,#5DCAA5)'
                          : i === 1
                          ? 'linear-gradient(90deg,#0F6E56,#1D9E75)'
                          : '#5DCAA5',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {svcSort === 'count'
                      ? `S/ ${svc.income} en ingresos`
                      : `${svc.count} atenciones`
                    }
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Patient Ranking */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" style={{ color: '#BA7517' }} />
                Ranking de pacientes
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Por gasto total acumulado</p>
            </div>
            <Link href="/frecuentes">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Users className="w-3 h-3" /> Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {topPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {topPatients.map((p, i) => {
                  const pct = Math.round((p.total / maxPatientTotal) * 100);
                  const initials = p.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
                  return (
                    <div key={p.id} className="flex items-center gap-3" data-testid={`patient-rank-${i}`}>
                      {/* Rank badge */}
                      <div className="w-6 text-center shrink-0">
                        {i < 3
                          ? <span className="text-base">{RANK_MEDAL[i]}</span>
                          : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                        }
                      </div>
                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ background: i === 0 ? '#1D9E75' : i === 1 ? '#0F6E56' : '#185FA5' }}
                      >
                        {initials}
                      </div>
                      {/* Bar + name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <Link href={`/historial/${p.id}`}>
                            <span className="text-xs font-semibold text-gray-700 hover:text-[#1D9E75] cursor-pointer truncate block">{p.nombre}</span>
                          </Link>
                          <span className="text-xs font-bold shrink-0 ml-2" style={{ color: '#1D9E75' }}>S/ {p.total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: i === 0 ? 'linear-gradient(90deg,#1D9E75,#5DCAA5)' : '#5DCAA5',
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{p.visits} visitas</span>
                        </div>
                      </div>
                      {i === 0 && (
                        <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: '#1D9E75' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Detalle de atenciones ({sortedFiltered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiltered.map(r => (
                  <TableRow key={r.id} data-testid={`row-reporte-${r.id}`}>
                    <TableCell className="text-sm">
                      {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      <span className="text-muted-foreground ml-2 text-xs">{r.hora}</span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <Link href={`/historial/${r.clienteId}`}>
                        <span className="hover:text-[#1D9E75] cursor-pointer">{getClientName(r.clienteId)}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{getServiceName(r.servicio)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">S/ {r.precio}</TableCell>
                  </TableRow>
                ))}
                {sortedFiltered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                      No hay atenciones registradas en este período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {sortedFiltered.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-t bg-muted/20 text-sm font-semibold">
              <span>Total del período</span>
              <span className="text-base" style={{ color: '#1D9E75' }}>S/ {totalIncome}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
