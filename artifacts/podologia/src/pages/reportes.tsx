import { useState, useEffect, useMemo } from "react";
import { store, Reserva, Servicio, Cliente } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Download, FileText, TrendingUp, CalendarCheck, DollarSign, Star } from "lucide-react";
import { exportToExcel, exportReportePDF } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

type Period = 'today' | 'week' | 'month' | 'custom';

const COLORS = ['#2C7DA0', '#52B788', '#ADE8F4', '#FFB703', '#F4A261', '#E76F51', '#8ECAE6'];

function getDateRange(period: Period, customFrom: string, customTo: string): [Date, Date] {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (period === 'today') {
    return [startOfDay(now), now];
  }
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return [startOfDay(from), now];
  }
  if (period === 'month') {
    return [new Date(now.getFullYear(), now.getMonth(), 1), now];
  }
  return [
    customFrom ? new Date(customFrom + 'T00:00:00') : new Date(now.getFullYear(), 0, 1),
    customTo ? new Date(customTo + 'T23:59:59') : now,
  ];
}

export default function Reportes() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    setReservas(store.getReservas());
    setServicios(store.getServicios());
    setClientes(store.getClientes());
  }, []);

  const [fromDate, toDate] = useMemo(() => getDateRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const filtered = useMemo(() => {
    return reservas.filter(r => {
      if (r.estado !== 'atendida') return false;
      const d = new Date(r.fecha + 'T12:00:00');
      return d >= fromDate && d <= toDate;
    });
  }, [reservas, fromDate, toDate]);

  const totalIncome = filtered.reduce((sum, r) => sum + r.precio, 0);
  const totalAttended = filtered.length;
  const avgIncome = totalAttended > 0 ? (totalIncome / totalAttended).toFixed(2) : '0';

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

  const mostRequested = pieData.length > 0 ? pieData[0].name : '—';

  // Build bar chart by day
  const dayMap: Record<string, number> = {};
  filtered.forEach(r => {
    const label = new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short'
    });
    dayMap[label] = (dayMap[label] || 0) + r.precio;
  });
  const barData = Object.entries(dayMap)
    .map(([name, income]) => ({ name, income }))
    .sort((a, b) => {
      const dA = filtered.find(r => new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) === a.name)?.fecha || '';
      const dB = filtered.find(r => new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) === b.name)?.fecha || '';
      return dA.localeCompare(dB);
    });

  const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || '—';
  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

  const sortedFiltered = [...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const handleExportExcel = () => {
    const data = sortedFiltered.map(r => ({
      Fecha: new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE'),
      Hora: r.hora,
      Paciente: getClientName(r.clienteId),
      Servicio: getServiceName(r.servicio),
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
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'custom', label: 'Personalizado' },
  ];

  const metrics = [
    { label: 'Ingresos totales', value: `S/ ${totalIncome}`, icon: DollarSign, color: 'text-[#52B788]' },
    { label: 'Atenciones', value: totalAttended, icon: CalendarCheck, color: 'text-primary' },
    { label: 'Ticket promedio', value: `S/ ${avgIncome}`, icon: TrendingUp, color: 'text-[#2C7DA0]' },
    { label: 'Servicio líder', value: mostRequested, icon: Star, color: 'text-amber-500', small: true },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes de Ingresos</h1>
          <p className="text-sm text-muted-foreground">Análisis financiero y de atenciones.</p>
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
            className={`h-8 px-4 rounded-full text-sm font-medium border transition-all ${period === p.key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 text-sm w-auto" data-testid="input-custom-from" />
            <span className="text-sm text-muted-foreground">—</span>
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-8 text-sm w-auto" data-testid="input-custom-to" />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <p className={`font-bold ${m.color} ${m.small ? 'text-sm leading-snug' : 'text-2xl'}`}>{m.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ingresos por día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {barData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos para el período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECEF" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `S/${v}`} />
                    <Tooltip
                      formatter={(v: number) => [`S/ ${v}`, 'Ingresos']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E9ECEF', fontSize: 12 }}
                      cursor={{ fill: 'rgba(44,125,160,0.06)' }}
                    />
                    <Bar dataKey="income" fill="#2C7DA0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribución de servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos para el período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [v, name]}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E9ECEF', fontSize: 12 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 11, color: '#6c757d' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Detalle de atenciones ({sortedFiltered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
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
                    <TableCell className="text-sm font-medium">{getClientName(r.clienteId)}</TableCell>
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
              <span className="text-[#52B788] text-base">S/ {totalIncome}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
