export interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  telefono: string;
  direccion?: string;
  fechaRegistro: string;
  condicion?: string;
}

export interface Reserva {
  id: string;
  clienteId: string;
  fecha: string;
  hora: string;
  servicio: string;
  precio: number;
  observaciones?: string;
  evolucion?: string;
  estado: 'pendiente' | 'atendida' | 'cancelada' | 'reprogramada';
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
}

const defaultServicios: Servicio[] = [
  { id: 's1', nombre: 'Consulta podológica general', descripcion: 'Evaluación inicial del estado podológico', precio: 50 },
  { id: 's2', nombre: 'Tratamiento de hongos', descripcion: 'Onicomicosis y tiña pedis', precio: 80 },
  { id: 's3', nombre: 'Onicocriptosis (uña encarnada)', descripcion: 'Extracción y tratamiento de uña encarnada', precio: 100 },
  { id: 's4', nombre: 'Callos y durezas', descripcion: 'Eliminación de hiperqueratosis', precio: 60 },
  { id: 's5', nombre: 'Quiropodia completa', descripcion: 'Limpieza profunda de pies', precio: 120 },
  { id: 's6', nombre: 'Plantillas ortopédicas', descripcion: 'Confección de plantillas personalizadas', precio: 250 },
  { id: 's7', nombre: 'Pie diabético', descripcion: 'Cuidado especializado pie diabético', precio: 150 },
  { id: 's8', nombre: 'Otros', descripcion: 'Procedimientos adicionales', precio: 50 },
];

const today = new Date();
const d = (offset: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split('T')[0];
};

const demoClientes: Cliente[] = [
  { id: 'c1', nombre: 'Juan Pérez Quispe', dni: '12345678', telefono: '987654321', direccion: 'Av. Arequipa 123, Miraflores', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 8, 10).toISOString(), condicion: 'Paciente diabético tipo 2. Requiere atención especial en la circulación periférica. Alérgico a la penicilina.' },
  { id: 'c2', nombre: 'María García Villanueva', dni: '87654321', telefono: '912345678', direccion: 'Calle Las Flores 456, San Borja', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 6, 20).toISOString(), condicion: 'Pie plano bilateral. Usa plantillas ortopédicas desde 2022.' },
  { id: 'c3', nombre: 'Carlos López Mamani', dni: '45678912', telefono: '998877665', direccion: 'Av. Javier Prado 789, San Isidro', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 10, 5).toISOString(), condicion: 'Onicocriptosis recurrente en 1er dedo pie derecho. Tendencia a usar calzado muy ajustado.' },
  { id: 'c4', nombre: 'Ana Martínez Condori', dni: '78912345', telefono: '956781234', direccion: 'Jr. Los Pinos 321, Surco', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 4, 15).toISOString() },
  { id: 'c5', nombre: 'Luis Rodríguez Chávez', dni: '32165498', telefono: '945612378', direccion: 'Av. Larco 555, Miraflores', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 12, 1).toISOString(), condicion: 'Callosidades crónicas en talón y metatarso. Trabajador de pie más de 8 horas.' },
  { id: 'c6', nombre: 'Carmen Sánchez Torres', dni: '65498732', telefono: '934567812', direccion: 'Calle Los Cedros 777, La Molina', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 14, 8).toISOString(), condicion: 'Pie plano severo. Gonalgia bilateral asociada. En tratamiento con traumatología.' },
  { id: 'c7', nombre: 'Jorge Fernández Poma', dni: '98732165', telefono: '923456781', direccion: 'Av. Brasil 888, Pueblo Libre', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 18, 3).toISOString() },
  { id: 'c8', nombre: 'Rosa Gómez Aliaga', dni: '15975346', telefono: '912384756', direccion: 'Jr. Cuzco 999, Breña', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 5, 22).toISOString(), condicion: 'Onicomicosis en ambos pies. Tratamiento antifúngico oral en curso.' },
  { id: 'c9', nombre: 'Pedro Vargas Huanca', dni: '74125896', telefono: '985214736', direccion: 'Av. Colonial 1234, Callao', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 24, 14).toISOString(), condicion: 'Hallux valgus moderado en pie izquierdo. Candidato a cirugía en evaluación.' },
  { id: 'c10', nombre: 'Sofía Castro Ríos', dni: '36925814', telefono: '976543210', direccion: 'Calle Roma 45, Lince', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 3, 18).toISOString() },
  { id: 'c11', nombre: 'Miguel Ángel Flores', dni: '85274196', telefono: '961234587', direccion: 'Av. Universitaria 2000, Los Olivos', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 9, 7).toISOString(), condicion: 'Deportista. Frecuentes ampollas y fisuras en talones. Solicita revisión mensual.' },
  { id: 'c12', nombre: 'Patricia Medina Salas', dni: '52147896', telefono: '954321876', direccion: 'Jr. Huánuco 567, Cercado', fechaRegistro: new Date(today.getFullYear(), today.getMonth() - 7, 11).toISOString() },
];

const demoReservas: Reserva[] = [
  // Hoy
  { id: 'r1', clienteId: 'c1', fecha: d(0), hora: '09:00', servicio: 's7', precio: 150, observaciones: 'Control mensual pie diabético. Sin lesiones activas.', evolucion: 'Mejoría sostenida. Piel hidratada.', estado: 'atendida' },
  { id: 'r2', clienteId: 'c2', fecha: d(0), hora: '10:00', servicio: 's5', precio: 120, observaciones: 'Quiropodia completa + revisión plantillas.', evolucion: 'Plantillas en buen estado, no requieren reemplazo aún.', estado: 'atendida' },
  { id: 'r3', clienteId: 'c3', fecha: d(0), hora: '11:30', servicio: 's3', precio: 100, observaciones: 'Tercera sesión de tratamiento onicocriptosis.', estado: 'pendiente' },
  { id: 'r4', clienteId: 'c4', fecha: d(0), hora: '14:00', servicio: 's4', precio: 60, estado: 'pendiente' },
  // Ayer
  { id: 'r5', clienteId: 'c5', fecha: d(-1), hora: '09:00', servicio: 's4', precio: 60, observaciones: 'Callos plantares bilaterales.', evolucion: 'Reducción notable. Continuar con crema urea.', estado: 'atendida' },
  { id: 'r6', clienteId: 'c6', fecha: d(-1), hora: '10:30', servicio: 's6', precio: 250, observaciones: 'Confección plantillas nuevas.', evolucion: 'Adaptación progresiva. Cita de control en 3 semanas.', estado: 'atendida' },
  { id: 'r7', clienteId: 'c7', fecha: d(-1), hora: '12:00', servicio: 's2', precio: 80, estado: 'cancelada' },
  // Esta semana
  { id: 'r8', clienteId: 'c8', fecha: d(-2), hora: '09:30', servicio: 's2', precio: 80, observaciones: 'Aplicación antimicótico tópico.', evolucion: 'Progreso lento. Continuar 4 semanas más.', estado: 'atendida' },
  { id: 'r9', clienteId: 'c9', fecha: d(-2), hora: '11:00', servicio: 's1', precio: 50, observaciones: 'Evaluación inicial hallux valgus.', evolucion: 'Se recomienda cirugía. Derivación a traumatología.', estado: 'atendida' },
  { id: 'r10', clienteId: 'c11', fecha: d(-3), hora: '08:00', servicio: 's5', precio: 120, observaciones: 'Revisión post-competencia.', evolucion: 'Ampollas resueltas. Piel en buen estado.', estado: 'atendida' },
  { id: 'r11', clienteId: 'c1', fecha: d(-3), hora: '15:00', servicio: 's7', precio: 150, evolucion: 'Sin novedades. Control estable.', estado: 'atendida' },
  { id: 'r12', clienteId: 'c12', fecha: d(-4), hora: '10:00', servicio: 's1', precio: 50, estado: 'atendida' },
  // Próximos días
  { id: 'r13', clienteId: 'c5', fecha: d(1), hora: '09:30', servicio: 's4', precio: 60, estado: 'pendiente' },
  { id: 'r14', clienteId: 'c6', fecha: d(1), hora: '15:00', servicio: 's5', precio: 120, estado: 'pendiente' },
  { id: 'r15', clienteId: 'c11', fecha: d(2), hora: '08:00', servicio: 's5', precio: 120, estado: 'pendiente' },
  { id: 'r16', clienteId: 'c10', fecha: d(2), hora: '11:00', servicio: 's1', precio: 50, estado: 'pendiente' },
  // Semana pasada
  { id: 'r17', clienteId: 'c1', fecha: d(-7), hora: '09:00', servicio: 's7', precio: 150, estado: 'atendida', evolucion: 'Sin complicaciones. Glucemia controlada.' },
  { id: 'r18', clienteId: 'c3', fecha: d(-7), hora: '11:00', servicio: 's3', precio: 100, estado: 'atendida', evolucion: 'Segunda sesión completada. Buena cicatrización.' },
  { id: 'r19', clienteId: 'c5', fecha: d(-8), hora: '09:00', servicio: 's4', precio: 60, estado: 'atendida' },
  { id: 'r20', clienteId: 'c9', fecha: d(-8), hora: '14:00', servicio: 's1', precio: 50, estado: 'atendida', evolucion: 'Primera consulta. Historia clínica completa.' },
  // Mes anterior
  { id: 'r21', clienteId: 'c1', fecha: d(-30), hora: '09:00', servicio: 's7', precio: 150, estado: 'atendida' },
  { id: 'r22', clienteId: 'c2', fecha: d(-28), hora: '10:00', servicio: 's6', precio: 250, estado: 'atendida' },
  { id: 'r23', clienteId: 'c3', fecha: d(-25), hora: '11:00', servicio: 's3', precio: 100, estado: 'atendida' },
  { id: 'r24', clienteId: 'c5', fecha: d(-22), hora: '09:00', servicio: 's4', precio: 60, estado: 'atendida' },
  { id: 'r25', clienteId: 'c6', fecha: d(-20), hora: '15:00', servicio: 's5', precio: 120, estado: 'atendida' },
  { id: 'r26', clienteId: 'c7', fecha: d(-18), hora: '12:00', servicio: 's2', precio: 80, estado: 'atendida' },
  { id: 'r27', clienteId: 'c8', fecha: d(-15), hora: '09:30', servicio: 's2', precio: 80, estado: 'atendida' },
  { id: 'r28', clienteId: 'c11', fecha: d(-14), hora: '08:00', servicio: 's5', precio: 120, estado: 'atendida' },
  { id: 'r29', clienteId: 'c1', fecha: d(-60), hora: '09:00', servicio: 's7', precio: 150, estado: 'atendida' },
  { id: 'r30', clienteId: 'c5', fecha: d(-55), hora: '09:00', servicio: 's4', precio: 60, estado: 'atendida' },
];

export const store = {
  getClientes: (): Cliente[] => JSON.parse(localStorage.getItem('podo_clientes') || '[]'),
  setClientes: (data: Cliente[]) => {
    localStorage.setItem('podo_clientes', JSON.stringify(data));
    store.updateLastSaved();
  },

  getReservas: (): Reserva[] => JSON.parse(localStorage.getItem('podo_reservas') || '[]'),
  setReservas: (data: Reserva[]) => {
    localStorage.setItem('podo_reservas', JSON.stringify(data));
    store.updateLastSaved();
  },

  getServicios: (): Servicio[] => JSON.parse(localStorage.getItem('podo_servicios') || '[]'),
  setServicios: (data: Servicio[]) => {
    localStorage.setItem('podo_servicios', JSON.stringify(data));
    store.updateLastSaved();
  },

  getLastSaved: (): string | null => localStorage.getItem('podo_last_saved'),
  updateLastSaved: () => localStorage.setItem('podo_last_saved', new Date().toISOString()),

  reset: () => {
    localStorage.removeItem('podo_clientes');
    localStorage.removeItem('podo_reservas');
    localStorage.removeItem('podo_servicios');
    localStorage.removeItem('podo_last_saved');
    location.reload();
  },

  exportBackup: () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      clientes: store.getClientes(),
      reservas: store.getReservas(),
      servicios: store.getServicios(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podo_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup: (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (!data.clientes || !data.reservas || !data.servicios) return false;
      store.setClientes(data.clientes);
      store.setReservas(data.reservas);
      store.setServicios(data.servicios);
      return true;
    } catch {
      return false;
    }
  },
};

// Auto-initialize demo data if empty
if (!localStorage.getItem('podo_clientes') || JSON.parse(localStorage.getItem('podo_clientes') || '[]').length === 0) {
  store.setClientes(demoClientes);
  store.setReservas(demoReservas);
  store.setServicios(defaultServicios);
  store.updateLastSaved();
}
