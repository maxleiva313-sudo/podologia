import { useState, useEffect } from "react";
import { store, Reserva, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Download, FileText } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";

export default function Reportes() {
  const [period, setPeriod] = useState("week");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    setReservas(store.getReservas().filter(r => r.estado === 'atendida'));
    setServicios(store.getServicios());
  }, []);

  // Filter based on period (simplified logic for demo)
  const filteredReservas = reservas.filter(r => {
    const d = new Date(r.fecha);
    const now = new Date();
    if (period === 'today') return d.toDateString() === now.toDateString();
    if (period === 'week') return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true; // all
  });

  const totalIncome = filteredReservas.reduce((sum, r) => sum + r.precio, 0);
  const totalAttended = filteredReservas.length;
  const avgIncome = totalAttended > 0 ? (totalIncome / totalAttended).toFixed(2) : 0;

  // Service distribution
  const serviceCount: Record<string, number> = {};
  filteredReservas.forEach(r => {
    const s = servicios.find(srv => srv.id === r.servicio)?.nombre || 'Desconocido';
    serviceCount[s] = (serviceCount[s] || 0) + 1;
  });

  const pieData = Object.entries(serviceCount).map(([name, value]) => ({ name, value }));
  const COLORS = ['#2C7DA0', '#52B788', '#ADE8F4', '#FFB703', '#F4A261', '#E76F51'];

  // Income by day for bar chart
  const incomeByDay: Record<string, number> = {};
  filteredReservas.forEach(r => {
    const d = new Date(r.fecha).toLocaleDateString('es-ES', { weekday: 'short' });
    incomeByDay[d] = (incomeByDay[d] || 0) + r.precio;
  });
  const barData = Object.entries(incomeByDay).map(([name, income]) => ({ name, income }));

  const mostRequested = pieData.length > 0 ? pieData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : 'N/A';

  const handleExportExcel = () => {
    const data = filteredReservas.map(r => ({
      Fecha: new Date(r.fecha).toLocaleDateString(),
      Servicio: servicios.find(s => s.id === r.servicio)?.nombre || 'Desconocido',
      Precio: r.precio,
    }));
    exportToExcel(data, `reporte_ingresos_${period}`);
  };

  const handleExportPDF = () => {
    const data = filteredReservas.map(r => [
      new Date(r.fecha).toLocaleDateString(),
      servicios.find(s => s.id === r.servicio)?.nombre || 'Desconocido',
      `S/ ${r.precio}`
    ]);
    exportToPDF(
      'Reporte de Ingresos',
      ['Fecha', 'Servicio', 'Precio'],
      data,
      `reporte_ingresos_${period}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes de Ingresos</h1>
          <p className="text-muted-foreground">Análisis de atenciones e ingresos.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="all">Todo el Historial</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportPDF}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="outline" onClick={handleExportExcel}><Download className="w-4 h-4 mr-2" /> Excel</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">S/ {totalIncome}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atenciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">S/ {avgIncome}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Servicio Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{mostRequested}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECEF" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `S/${val}`} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="income" fill="#2C7DA0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-muted-foreground">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}