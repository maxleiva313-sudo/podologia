import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store, Cliente, Reserva } from "@/lib/store";
import { Users, CalendarCheck, TrendingUp, CalendarClock, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  useEffect(() => {
    setClientes(store.getClientes());
    setReservas(store.getReservas());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayReservas = reservas.filter(r => r.fecha === today);
  const attendedToday = todayReservas.filter(r => r.estado === 'atendida');
  const todayIncome = attendedToday.reduce((sum, r) => sum + r.precio, 0);

  // Calculate weekly income
  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayIncome = reservas
      .filter(r => r.fecha === dateStr && r.estado === 'atendida')
      .reduce((sum, r) => sum + r.precio, 0);
    return { name: d.toLocaleDateString('es-ES', { weekday: 'short' }), income: dayIncome };
  });

  const recentClientes = [...clientes].sort((a, b) => 
    new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()
  ).slice(0, 5);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de actividad de hoy.</p>
      </div>

      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientes.length}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
              <CalendarClock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayReservas.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Atendidos Hoy</CardTitle>
              <CalendarCheck className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{attendedToday.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">S/ {todayIncome}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ingresos de la semana</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
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

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Citas de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayReservas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay citas para hoy.</p>
              ) : (
                todayReservas.sort((a,b) => a.hora.localeCompare(b.hora)).map(reserva => {
                  const cliente = clientes.find(c => c.id === reserva.clienteId);
                  return (
                    <div key={reserva.id} className="flex items-center justify-between p-2 border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold w-12 text-primary">{reserva.hora}</div>
                        <div>
                          <p className="text-sm font-medium">{cliente?.nombre || 'Desconocido'}</p>
                          <p className="text-xs text-muted-foreground truncate w-32">{reserva.servicio}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                        reserva.estado === 'atendida' ? 'bg-[#52B788]/20 text-[#52B788]' :
                        reserva.estado === 'pendiente' ? 'bg-[#2C7DA0]/20 text-[#2C7DA0]' :
                        reserva.estado === 'cancelada' ? 'bg-destructive/20 text-destructive' :
                        'bg-amber-500/20 text-amber-600'
                      }`}>
                        {reserva.estado}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
