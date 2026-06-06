import { useState, useEffect } from "react";
import { store, Reserva, Cliente, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function Reservas() {
  const { toast } = useToast();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    clienteId: "",
    fecha: new Date().toISOString().split('T')[0],
    hora: "09:00",
    servicio: "",
    precio: 0,
    estado: "pendiente" as const
  });

  useEffect(() => {
    setReservas(store.getReservas());
    setClientes(store.getClientes());
    setServicios(store.getServicios());
  }, []);

  const handleServicioChange = (val: string) => {
    const s = servicios.find(s => s.id === val);
    setFormData({ ...formData, servicio: val, precio: s ? s.precio : 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clienteId || !formData.servicio) {
      toast({ title: "Error", description: "Seleccione cliente y servicio", variant: "destructive" });
      return;
    }

    const nuevaReserva: Reserva = {
      id: `r${Date.now()}`,
      ...formData
    };

    const newReservas = [...reservas, nuevaReserva];
    store.setReservas(newReservas);
    setReservas(newReservas);
    setShowForm(false);
    toast({ title: "Reserva registrada" });
  };

  const updateEstado = (id: string, estado: any) => {
    const newReservas = reservas.map(r => r.id === id ? { ...r, estado } : r);
    store.setReservas(newReservas);
    setReservas(newReservas);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservas</h1>
          <p className="text-muted-foreground">Gestiona las citas de la clínica.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Cita
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle>Agendar Nueva Cita</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select value={formData.clienteId} onValueChange={v => setFormData({...formData, clienteId: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} - {c.dni}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" required value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Servicio</Label>
                <Select value={formData.servicio} onValueChange={handleServicioChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {servicios.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precio (S/)</Label>
                <Input type="number" required value={formData.precio} onChange={e => setFormData({...formData, precio: Number(e.target.value)})} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full">Cancelar</Button>
                <Button type="submit" className="w-full">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha / Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservas.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(r => {
                const cliente = clientes.find(c => c.id === r.clienteId);
                const servicio = servicios.find(s => s.id === r.servicio);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {new Date(r.fecha).toLocaleDateString()} <span className="text-muted-foreground ml-2">{r.hora}</span>
                    </TableCell>
                    <TableCell>{cliente?.nombre || 'Desconocido'}</TableCell>
                    <TableCell>{servicio?.nombre || 'Desconocido'}</TableCell>
                    <TableCell>S/ {r.precio}</TableCell>
                    <TableCell>
                      <Select value={r.estado} onValueChange={(v) => updateEstado(r.id, v)}>
                        <SelectTrigger className="h-8 text-xs w-[130px]">
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}