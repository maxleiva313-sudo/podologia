import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Cliente, Reserva, Servicio } from './store';

const PRIMARY = [44, 125, 160] as [number, number, number];
const GREEN = [82, 183, 136] as [number, number, number];

// ─── Generic ───────────────────────────────────────────────────────────────

export const exportToExcel = (data: Record<string, unknown>[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (title: string, headers: string[], rows: string[][], filename: string) => {
  const doc = new jsPDF();
  addHeader(doc, title);
  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 255, 254] },
  });
  doc.save(`${filename}.pdf`);
};

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PodoClinic', 14, 10);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 17);
  if (subtitle) doc.text(subtitle, 14, 22);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 29);
  doc.setTextColor(0, 0, 0);
}

// ─── Clientes PDF ──────────────────────────────────────────────────────────

export const exportClientesPDF = (clientes: (Cliente & { visitas: number })[]) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  addHeader(doc, 'Listado de Pacientes');
  autoTable(doc, {
    startY: 34,
    head: [['Nombre', 'DNI', 'Teléfono', 'Dirección', 'Registro', 'Visitas', 'Condición']],
    body: clientes.map(c => [
      c.nombre,
      c.dni,
      c.telefono,
      c.direccion || '—',
      new Date(c.fechaRegistro).toLocaleDateString('es-PE'),
      String(c.visitas),
      c.condicion || '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 6: { cellWidth: 50 } },
  });
  doc.save('pacientes.pdf');
};

// ─── Historial PDF ─────────────────────────────────────────────────────────

export const exportHistorialPDF = (cliente: Cliente, historial: Reserva[], servicios: Servicio[]) => {
  const doc = new jsPDF();
  addHeader(doc, `Historial Clínico — ${cliente.nombre}`);

  // Patient card
  let y = 36;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PACIENTE', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const info = [
    ['DNI', cliente.dni, 'Teléfono', cliente.telefono],
    ['Dirección', cliente.direccion || '—', 'Registro', new Date(cliente.fechaRegistro).toLocaleDateString('es-PE')],
  ];
  info.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0] + ':', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 35, y);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2] + ':', 105, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row[3], 125, y);
    y += 5;
  });

  if (cliente.condicion) {
    doc.setFont('helvetica', 'bold');
    doc.text('Condición:', 14, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(cliente.condicion, 160);
    doc.text(lines, 40, y);
    y += lines.length * 4 + 2;
  }

  const atendidas = historial.filter(r => r.estado === 'atendida');
  const totalSpent = atendidas.reduce((acc, r) => acc + r.precio, 0);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total visitas: ${atendidas.length}   Total invertido: S/ ${totalSpent}`, 14, y + 3);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Hora', 'Servicio', 'Precio', 'Estado', 'Observaciones', 'Evolución']],
    body: historial.map(r => {
      const s = servicios.find(srv => srv.id === r.servicio);
      return [
        new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE'),
        r.hora,
        s?.nombre || r.servicio,
        `S/ ${r.precio}`,
        r.estado,
        r.observaciones || '—',
        r.evolucion || '—',
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 5: { cellWidth: 35 }, 6: { cellWidth: 35 } },
  });

  doc.save(`historial_${cliente.dni}.pdf`);
};

// ─── Frecuentes PDF ────────────────────────────────────────────────────────

export const exportFrecuentesPDF = (clientes: (Cliente & { visits: number; totalSpent: number; lastVisit: string | null })[]) => {
  const doc = new jsPDF();
  addHeader(doc, 'Pacientes Frecuentes');
  autoTable(doc, {
    startY: 34,
    head: [['#', 'Nombre', 'DNI', 'Teléfono', 'Visitas', 'Última visita', 'Total (S/)']],
    body: clientes.map((c, i) => [
      String(i + 1),
      (c.visits >= 10 ? '★ ' : '') + c.nombre,
      c.dni,
      c.telefono,
      String(c.visits),
      c.lastVisit ? new Date(c.lastVisit + 'T12:00:00').toLocaleDateString('es-PE') : '—',
      String(c.totalSpent),
    ]),
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
  });
  doc.save('pacientes_frecuentes.pdf');
};

// ─── Reporte PDF ───────────────────────────────────────────────────────────

export const exportReportePDF = (
  reservas: Reserva[],
  servicios: Servicio[],
  clientes: Cliente[],
  period: string
) => {
  const doc = new jsPDF();
  const labels: Record<string, string> = {
    today: 'Hoy', week: 'Esta semana', month: 'Este mes', custom: 'Período personalizado', all: 'Todo el historial',
  };
  addHeader(doc, 'Reporte de Ingresos', labels[period] || period);

  const totalIncome = reservas.reduce((sum, r) => sum + r.precio, 0);
  const avg = reservas.length > 0 ? (totalIncome / reservas.length).toFixed(2) : '0';

  let y = 36;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de ingresos: S/ ${totalIncome}   Atenciones: ${reservas.length}   Promedio: S/ ${avg}`, 14, y);
  y += 8;

  const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || '—';
  const getServiceName = (id: string) => servicios.find(s => s.id === id)?.nombre || id;

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Hora', 'Paciente', 'Servicio', 'Precio (S/)']],
    body: reservas.map(r => [
      new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE'),
      r.hora,
      getClientName(r.clienteId),
      getServiceName(r.servicio),
      String(r.precio),
    ]),
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    foot: [['', '', '', 'TOTAL', `S/ ${totalIncome}`]],
    footStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', fontSize: 9 },
  });
  doc.save(`reporte_ingresos_${period}.pdf`);
};
