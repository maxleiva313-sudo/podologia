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
  estado: 'pendiente' | 'atendida' | 'cancelada' | 'reprogramada';
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
}

const defaultServicios: Servicio[] = [
  { id: '1', nombre: 'Consulta podológica general', precio: 50 },
  { id: '2', nombre: 'Tratamiento de hongos', precio: 80 },
  { id: '3', nombre: 'Onicocriptosis (uña encarnada)', precio: 100 },
  { id: '4', nombre: 'Callos y durezas', precio: 60 },
  { id: '5', nombre: 'Quiropodia completa', precio: 120 },
  { id: '6', nombre: 'Plantillas ortopédicas', precio: 250 },
  { id: '7', nombre: 'Pie diabético', precio: 150 },
  { id: '8', nombre: 'Otros', precio: 50 },
];

const demoClientes: Cliente[] = [
  { id: 'c1', nombre: 'Juan Pérez', dni: '12345678', telefono: '987654321', direccion: 'Av. Arequipa 123', fechaRegistro: '2023-01-15T10:00:00.000Z', condicion: 'Paciente diabético' },
  { id: 'c2', nombre: 'María García', dni: '87654321', telefono: '912345678', direccion: 'Calle Las Flores 456', fechaRegistro: '2023-02-20T11:30:00.000Z' },
  { id: 'c3', nombre: 'Carlos López', dni: '45678912', telefono: '998877665', direccion: 'Av. Javier Prado 789', fechaRegistro: '2023-03-10T09:15:00.000Z', condicion: 'Uña encarnada recurrente' },
  { id: 'c4', nombre: 'Ana Martínez', dni: '78912345', telefono: '956781234', direccion: 'Jr. Los Pinos 321', fechaRegistro: '2023-04-05T16:45:00.000Z' },
  { id: 'c5', nombre: 'Luis Rodríguez', dni: '32165498', telefono: '945612378', direccion: 'Av. Larco 555', fechaRegistro: '2023-05-12T14:20:00.000Z' },
  { id: 'c6', nombre: 'Carmen Sánchez', dni: '65498732', telefono: '934567812', direccion: 'Calle Los Cedros 777', fechaRegistro: '2023-06-18T10:30:00.000Z', condicion: 'Pie plano' },
  { id: 'c7', nombre: 'Jorge Fernández', dni: '98732165', telefono: '923456781', direccion: 'Av. Brasil 888', fechaRegistro: '2023-07-22T08:00:00.000Z' },
  { id: 'c8', nombre: 'Rosa Gómez', dni: '15975346', telefono: '912384756', direccion: 'Jr. Cuzco 999', fechaRegistro: '2023-08-30T15:10:00.000Z' },
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0];

const demoReservas: Reserva[] = [
  { id: 'r1', clienteId: 'c1', fecha: todayStr, hora: '09:00', servicio: '1', precio: 50, estado: 'atendida' },
  { id: 'r2', clienteId: 'c2', fecha: todayStr, hora: '10:00', servicio: '5', precio: 120, estado: 'atendida' },
  { id: 'r3', clienteId: 'c3', fecha: todayStr, hora: '11:30', servicio: '3', precio: 100, estado: 'pendiente' },
  { id: 'r4', clienteId: 'c4', fecha: todayStr, hora: '14:00', servicio: '4', precio: 60, estado: 'pendiente' },
  { id: 'r5', clienteId: 'c5', fecha: tomorrowStr, hora: '09:30', servicio: '1', precio: 50, estado: 'pendiente' },
  { id: 'r6', clienteId: 'c6', fecha: tomorrowStr, hora: '15:00', servicio: '6', precio: 250, estado: 'pendiente' },
  { id: 'r7', clienteId: 'c7', fecha: yesterdayStr, hora: '10:00', servicio: '2', precio: 80, estado: 'atendida' },
  { id: 'r8', clienteId: 'c8', fecha: yesterdayStr, hora: '16:00', servicio: '1', precio: 50, estado: 'cancelada' },
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
};

// Auto-initialize demo data if empty
if (!localStorage.getItem('podo_clientes') || JSON.parse(localStorage.getItem('podo_clientes') || '[]').length === 0) {
  store.setClientes(demoClientes);
  store.setReservas(demoReservas);
  store.setServicios(defaultServicios);
  store.updateLastSaved();
}
