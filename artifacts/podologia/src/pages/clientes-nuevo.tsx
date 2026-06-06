import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { store, Cliente } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface FormErrors {
  nombre?: string;
  dni?: string;
  telefono?: string;
}

export default function ClientesForm({ editMode = false }: { editMode?: boolean }) {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const clienteId = params.id;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    direccion: "",
    condicion: "",
    fechaRegistro: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editMode && clienteId) {
      const found = store.getClientes().find(c => c.id === clienteId);
      if (found) {
        setFormData({
          nombre: found.nombre,
          dni: found.dni,
          telefono: found.telefono,
          direccion: found.direccion || '',
          condicion: found.condicion || '',
          fechaRegistro: found.fechaRegistro.split('T')[0],
        });
      }
    }
  }, [editMode, clienteId]);

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'nombre' && !value.trim()) return 'El nombre es obligatorio.';
    if (name === 'dni') {
      if (!/^\d{8}$/.test(value)) return 'El DNI debe tener exactamente 8 dígitos numéricos.';
      const existing = store.getClientes().find(c => c.dni === value && c.id !== clienteId);
      if (existing) return `DNI ya registrado: ${existing.nombre}`;
    }
    if (name === 'telefono') {
      if (!/^\d{9}$/.test(value)) return 'El teléfono debe tener 9 dígitos numéricos.';
    }
    return undefined;
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (name: string, value: string) => {
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    newErrors.nombre = validateField('nombre', formData.nombre);
    newErrors.dni = validateField('dni', formData.dni);
    newErrors.telefono = validateField('telefono', formData.telefono);
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const clientes = store.getClientes();

    if (editMode && clienteId) {
      const updated = clientes.map(c =>
        c.id === clienteId
          ? { ...c, nombre: formData.nombre, dni: formData.dni, telefono: formData.telefono, direccion: formData.direccion, condicion: formData.condicion, fechaRegistro: new Date(formData.fechaRegistro).toISOString() }
          : c
      );
      store.setClientes(updated);
      toast({ title: "Paciente actualizado", description: `${formData.nombre} fue actualizado correctamente.` });
      setSaved(true);
      setTimeout(() => setLocation('/clientes'), 1200);
    } else {
      const nuevoCliente: Cliente = {
        id: `c${Date.now()}`,
        nombre: formData.nombre,
        dni: formData.dni,
        telefono: formData.telefono,
        direccion: formData.direccion,
        condicion: formData.condicion,
        fechaRegistro: new Date(formData.fechaRegistro).toISOString(),
      };
      store.setClientes([...clientes, nuevoCliente]);
      toast({ title: "Paciente registrado", description: `${formData.nombre} fue registrado exitosamente.` });
      setSaved(true);
      setTimeout(() => setLocation('/clientes'), 1200);
    }
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="flex items-center gap-1 text-xs text-destructive mt-1">
        <AlertCircle className="w-3 h-3" /> {msg}
      </p>
    ) : null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {editMode ? 'Editar Paciente' : 'Nuevo Paciente'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {editMode ? 'Modifica los datos del paciente.' : 'Completa los datos para registrar un nuevo paciente.'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Datos del Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nombre">Nombre completo <span className="text-destructive">*</span></Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={e => handleChange('nombre', e.target.value)}
                  onBlur={e => handleBlur('nombre', e.target.value)}
                  className={errors.nombre ? 'border-destructive focus-visible:ring-destructive' : ''}
                  data-testid="input-nombre"
                />
                <FieldError msg={errors.nombre} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dni">DNI <span className="text-destructive">*</span></Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={e => handleChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onBlur={e => handleBlur('dni', e.target.value)}
                  className={errors.dni ? 'border-destructive focus-visible:ring-destructive' : ''}
                  placeholder="12345678"
                  maxLength={8}
                  data-testid="input-dni"
                />
                <FieldError msg={errors.dni} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono <span className="text-destructive">*</span></Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={e => handleChange('telefono', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  onBlur={e => handleBlur('telefono', e.target.value)}
                  className={errors.telefono ? 'border-destructive focus-visible:ring-destructive' : ''}
                  placeholder="987654321"
                  data-testid="input-telefono"
                />
                <FieldError msg={errors.telefono} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={e => handleChange('direccion', e.target.value)}
                  placeholder="Av. Arequipa 123, Lima"
                  data-testid="input-direccion"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fechaRegistro">Fecha de registro</Label>
                <Input
                  id="fechaRegistro"
                  type="date"
                  value={formData.fechaRegistro}
                  onChange={e => handleChange('fechaRegistro', e.target.value)}
                  data-testid="input-fecha-registro"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condicion">Condición / Observaciones clínicas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                id="condicion"
                rows={4}
                value={formData.condicion}
                onChange={e => handleChange('condicion', e.target.value)}
                placeholder="Condición podológica, antecedentes, alergias, notas relevantes..."
                data-testid="textarea-condicion"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/clientes">
                <Button type="button" variant="outline" data-testid="button-cancelar">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={saved} data-testid="button-guardar">
                {saved ? (
                  <><CheckCircle className="w-4 h-4 mr-1.5" /> Guardado</>
                ) : (
                  editMode ? 'Guardar cambios' : 'Registrar paciente'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
