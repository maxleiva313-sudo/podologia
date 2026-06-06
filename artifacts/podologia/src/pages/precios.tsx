import { useState, useEffect } from "react";
import { store, Servicio } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";

export default function Precios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", nombre: "", precio: "" });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setServicios(store.getServicios());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const precio = Number(formData.precio);
    
    if (precio <= 0) {
      toast({ title: "Error", description: "El precio debe ser mayor a 0", variant: "destructive" });
      return;
    }

    if (isEditing) {
      const updated = servicios.map(s => s.id === formData.id ? { ...s, nombre: formData.nombre, precio } : s);
      store.setServicios(updated);
      setServicios(updated);
      toast({ title: "Servicio actualizado" });
    } else {
      const nuevo: Servicio = {
        id: `s${Date.now()}`,
        nombre: formData.nombre,
        precio
      };
      const added = [...servicios, nuevo];
      store.setServicios(added);
      setServicios(added);
      toast({ title: "Servicio agregado" });
    }
    
    setIsOpen(false);
    setFormData({ id: "", nombre: "", precio: "" });
    setIsEditing(false);
  };

  const openEdit = (s: Servicio) => {
    setFormData({ id: s.id, nombre: s.nombre, precio: s.precio.toString() });
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este servicio? Las citas pasadas mantendrán su precio.")) {
      const updated = servicios.filter(s => s.id !== id);
      store.setServicios(updated);
      setServicios(updated);
      toast({ title: "Servicio eliminado" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración de Precios</h1>
          <p className="text-muted-foreground">Administra los servicios y tarifas ofrecidos.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setFormData({ id: "", nombre: "", precio: "" });
            setIsEditing(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Agregar Servicio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Servicio</Label>
                <Input id="nombre" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (S/)</Label>
                <Input id="precio" type="number" step="0.01" min="0" required value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
              </div>
              <DialogFooter>
                <Button type="submit">{isEditing ? "Guardar Cambios" : "Agregar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Precio (S/)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nombre}</TableCell>
                  <TableCell className="font-bold text-primary">S/ {s.precio}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}