import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { store, Cliente, Reserva, Servicio } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileDown, Phone, MapPin, Calendar, Activity } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

function parseDate(dateStr: string): Date {
  // Handles both "YYYY-MM-DD" and full ISO timestamps
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
}

function fmtDate(dateStr: string) {
  const d = parseDate(dateStr);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function fmtDateShort(dateStr: string) {
  return parseDate(dateStr).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  atendida:    { bg: '#e6f7ef', text: '#1a7a4a' },
  pendiente:   { bg: '#e0f0fa', text: '#1a5f7a' },
  cancelada:   { bg: '#fdecea', text: '#b71c1c' },
  reprogramada:{ bg: '#fff8e1', text: '#e65100' },
};

const STATUS_LABEL: Record<string, string> = {
  atendida: 'Atendida', pendiente: 'Pendiente',
  cancelada: 'Cancelada', reprogramada: 'Reprogramada',
};

// ─── Print styles (injected at runtime so they only affect this page) ─────────

const PRINT_STYLE = `
@media print {
  body > #root > div > aside,
  body > #root > div > header,
  .no-print { display: none !important; }
  body > #root > div > main {
    margin: 0 !important;
    padding: 0 !important;
  }
  .print-area {
    padding: 0 !important;
    max-width: 100% !important;
  }
  .print-page {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    width: 210mm !important;
    min-height: 297mm !important;
    margin: 0 auto !important;
  }
  .page-break { page-break-before: always; }
  @page { margin: 12mm; size: A4; }
}
`;

// ─── PDF Export ───────────────────────────────────────────────────────────────

function exportFichaPDF(cliente: Cliente, historial: Reserva[], servicios: Servicio[]) {
  const doc = new jsPDF();
  const PRIMARY: [number,number,number] = [44, 125, 160];
  const GREEN:   [number,number,number] = [82, 183, 136];

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PodoClinic', 14, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión Podológica', 14, 18);
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 150, 14, { align: 'right' });
  doc.text('FICHA CLÍNICA DEL PACIENTE', 150, 20, { align: 'right' });

  // Section: Patient data
  let y = 32;
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(240, 247, 252);
  doc.roundedRect(10, y, 190, 42, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text(cliente.nombre, 16, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const left = [
    ['DNI',      cliente.dni],
    ['Teléfono', cliente.telefono],
    ['Registro', fmtDate(cliente.fechaRegistro)],
  ];
  const right = [
    ['Dirección', cliente.direccion || '—'],
  ];

  left.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.text(k + ':', 16, y + 15 + i * 7);
    doc.setFont('helvetica', 'normal'); doc.text(v, 38, y + 15 + i * 7);
  });
  doc.setFont('helvetica', 'bold'); doc.text('Dirección:', 110, y + 15);
  doc.setFont('helvetica', 'normal');
  const addrLines = doc.splitTextToSize(cliente.direccion || '—', 85);
  doc.text(addrLines, 130, y + 15);

  y += 48;

  // Condition
  if (cliente.condicion) {
    doc.setFillColor(255, 248, 230);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.4);
    const condLines = doc.splitTextToSize(cliente.condicion, 176);
    const condH = condLines.length * 5 + 10;
    doc.roundedRect(10, y, 190, condH, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 100, 0); doc.text('CONDICIÓN MÉDICA', 16, y + 6);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 50, 0);
    doc.text(condLines, 16, y + 12);
    y += condH + 6;
  }

  // Stats bar
  const atendidas = historial.filter(r => r.estado === 'atendida');
  const totalSpent = atendidas.reduce((s, r) => s + r.precio, 0);
  const sorted = [...atendidas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const firstVisit = sorted[0]?.fecha;
  const lastVisit = sorted[sorted.length - 1]?.fecha;

  doc.setFillColor(...GREEN);
  doc.roundedRect(10, y, 190, 16, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const stats = [
    `Visitas totales: ${historial.length}`,
    `Atendidas: ${atendidas.length}`,
    `Total invertido: S/ ${totalSpent}`,
    `Primera visita: ${firstVisit ? fmtDateShort(firstVisit) : '—'}`,
    `Última visita: ${lastVisit ? fmtDateShort(lastVisit) : '—'}`,
  ];
  stats.forEach((s, i) => {
    doc.setFont(i === 0 ? 'helvetica' : 'helvetica', i === 0 ? 'bold' : 'normal');
    doc.text(s, 16 + i * 38, y + 10);
  });

  y += 22;

  // History table
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text('HISTORIAL DE VISITAS', 14, y);
  y += 4;

  const rows = historial.map(r => {
    const svc = servicios.find(s => s.id === r.servicio)?.nombre || r.servicio;
    return [
      fmtDateShort(r.fecha),
      r.hora,
      svc.length > 28 ? svc.slice(0, 26) + '…' : svc,
      `S/ ${r.precio}`,
      STATUS_LABEL[r.estado] || r.estado,
      (r.observaciones || '—').slice(0, 50),
      (r.evolucion || '—').slice(0, 50),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Hora', 'Servicio', 'Precio', 'Estado', 'Observaciones', 'Evolución']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 250, 255] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 13 },
      2: { cellWidth: 38 },
      3: { cellWidth: 16 },
      4: { cellWidth: 22 },
      5: { cellWidth: 35 },
      6: { cellWidth: 35 },
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `PodoClinic — Ficha clínica de ${cliente.nombre} — Pág. ${i}/${pageCount}`,
      105, 290, { align: 'center' }
    );
  }

  doc.save(`ficha_clinica_${cliente.dni}.pdf`);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Ficha() {
  const { clienteId } = useParams();
  const { toast } = useToast();
  const [cliente, setCliente]   = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Inject print styles
    const el = document.createElement('style');
    el.textContent = PRINT_STYLE;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { el.remove(); };
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    const found = store.getClientes().find(c => c.id === clienteId);
    setCliente(found || null);
    const allReservas = store.getReservas()
      .filter(r => r.clienteId === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
    setHistorial(allReservas);
    setServicios(store.getServicios());
  }, [clienteId]);

  if (!cliente) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Cargando ficha...</p>
    </div>
  );

  const atendidas  = historial.filter(r => r.estado === 'atendida');
  const totalSpent = atendidas.reduce((s, r) => s + r.precio, 0);
  const sorted     = [...atendidas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const firstVisit = sorted[0]?.fecha;
  const lastVisit  = sorted[sorted.length - 1]?.fecha;
  const getService = (id: string) => servicios.find(s => s.id === id)?.nombre || id;
  const initials   = cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('');

  const handlePrint = () => window.print();
  const handlePDF   = () => {
    exportFichaPDF(cliente, historial, servicios);
    toast({ title: "PDF generado", description: `ficha_clinica_${cliente.dni}.pdf` });
  };

  return (
    <div className="print-area">
      {/* Toolbar — hidden when printing */}
      <div className="no-print flex items-center justify-between gap-3 mb-5 flex-wrap">
        <Link href={`/historial/${clienteId}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Volver al historial
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5" data-testid="button-export-pdf">
            <FileDown className="w-4 h-4" /> Exportar PDF
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5" data-testid="button-print">
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
        </div>
      </div>

      {/* ── FICHA DOCUMENT ─────────────────────────────────────────── */}
      <div className="print-page bg-white rounded-2xl shadow-md overflow-hidden border max-w-4xl mx-auto">

        {/* Document header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ background: 'linear-gradient(135deg, #0f2033 0%, #2C7DA0 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #52B788, #2C7DA0)' }}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">PodoClinic</h1>
              <p className="text-white/60 text-xs">Sistema de Gestión Podológica</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white text-sm font-bold tracking-wider uppercase">Ficha Clínica</p>
            <p className="text-white/50 text-xs mt-0.5">Generado: {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Patient data card */}
          <div className="flex gap-5 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4ee 100%)', border: '1px solid #c8e6f4' }}>
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg, #2C7DA0, #52B788)' }}>
                {initials}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-[#0f2033] leading-tight">{cliente.nombre}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mt-2">
                <InfoRow icon="🪪" label="DNI" value={cliente.dni} />
                <InfoRow icon={<Phone className="w-3 h-3" />} label="Teléfono" value={cliente.telefono} />
                <InfoRow icon={<Calendar className="w-3 h-3" />} label="Registro" value={fmtDate(cliente.fechaRegistro)} />
                {cliente.direccion && (
                  <InfoRow icon={<MapPin className="w-3 h-3" />} label="Dirección" value={cliente.direccion} cls="col-span-2" />
                )}
              </div>
            </div>
          </div>

          {/* Medical condition */}
          {cliente.condicion && (
            <div className="rounded-xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1.5 flex items-center gap-1.5">
                <span>⚠️</span> Condición médica / Antecedentes
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">{cliente.condicion}</p>
            </div>
          )}

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Visitas totales',  value: historial.length,                        color: '#2C7DA0' },
              { label: 'Atenciones',       value: atendidas.length,                        color: '#52B788' },
              { label: 'Total invertido',  value: `S/ ${totalSpent}`,                      color: '#f59e0b' },
              { label: 'Primera visita',   value: firstVisit ? fmtDateShort(firstVisit) : '—', color: '#7c3aed' },
              { label: 'Última visita',    value: lastVisit  ? fmtDateShort(lastVisit)  : '—', color: '#0d9488' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-white border shadow-sm">
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Visit history */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(#2C7DA0, #52B788)' }} />
              <h3 className="text-sm font-bold text-[#0f2033] uppercase tracking-wide">Historial de visitas</h3>
              <span className="ml-auto text-xs text-gray-400 font-medium">{historial.length} registros</span>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f2033, #2C7DA0)' }}>
                    {['Fecha','Hora','Servicio','Precio','Estado','Observaciones','Evolución'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[11px] font-semibold text-white uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historial.map((r, i) => {
                    const sc = STATUS_COLOR[r.estado] || { bg: '#f5f5f5', text: '#333' };
                    return (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8fbff]'} data-testid={`ficha-row-${r.id}`}>
                        <td className="px-3 py-2 text-xs font-medium text-gray-700 whitespace-nowrap">{fmtDateShort(r.fecha)}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{r.hora}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 max-w-[160px]">
                          <span className="line-clamp-2">{getService(r.servicio)}</span>
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-800 whitespace-nowrap">S/ {r.precio}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                            style={{ background: sc.bg, color: sc.text }}>
                            {STATUS_LABEL[r.estado]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 max-w-[140px]">
                          <span className="line-clamp-2">{r.observaciones || '—'}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 max-w-[140px]">
                          <span className="line-clamp-2">{r.evolucion || '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-sm text-gray-400">Sin registros de visitas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature area */}
          <div className="grid grid-cols-2 gap-8 pt-6" style={{ borderTop: '1px dashed #d1dce5' }}>
            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-300 mb-2" />
              <p className="text-xs text-gray-500">Firma del profesional</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">Dr. García — Podólogo</p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-300 mb-2" />
              <p className="text-xs text-gray-500">Firma del paciente</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">{cliente.nombre}</p>
            </div>
          </div>
        </div>

        {/* Document footer */}
        <div className="px-8 py-3 flex items-center justify-between" style={{ background: '#f8fbff', borderTop: '1px solid #e0ecf5' }}>
          <p className="text-[10px] text-gray-400">PodoClinic · Sistema de Gestión Podológica</p>
          <p className="text-[10px] text-gray-400">DNI: {cliente.dni} · {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

function InfoRow({ icon, label, value, cls = '' }: {
  icon: React.ReactNode; label: string; value: string; cls?: string;
}) {
  return (
    <div className={cls}>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-[#0f2033] flex items-center gap-1 mt-0.5">
        <span className="text-[#2C7DA0] shrink-0">{icon}</span>
        {value}
      </p>
    </div>
  );
}
