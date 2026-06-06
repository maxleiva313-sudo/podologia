import { useState } from "react";
import { useLocation } from "wouter";
import { store, Cliente } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ClientesNuevo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    direccion: "",
    condicion: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clientes = store.getClientes();
    
    if (clientes.some(c => c.dni === formData.dni)) {
      toast({ title: "Error", description: "El DNI ya está registrado", variant: "destructive" });
      return;
    }

    const nuevoCliente: Cliente = {
      id: `c${Date.now()}`,
      ...formData,
      fechaRegistro: new Date().toISOString()
    };

    store.setClientes([...clientes, nuevoCliente]);
    toast({ title: "Paciente registrado exitosamente" });
    setLocation("/clientes");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Paciente</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" required minLength={8} maxLength={8} value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección (Opcional)</Label>
                <Input id="direccion" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="condicion">Condiciones / Observaciones</Label>
              <Textarea id="condicion" rows={4} value={formData.condicion} onChange={e => setFormData({...formData, condicion: e.target.value})} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/clientes">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit">Registrar Paciente</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}