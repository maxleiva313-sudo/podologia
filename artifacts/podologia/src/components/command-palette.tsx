import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { store, Cliente } from "@/lib/store";
import {
  LayoutDashboard, Users, Calendar, Search, Star, TrendingUp,
  Settings, Cog, MessageCircle, UserPlus, CalendarPlus,
  FileText, Stethoscope, ArrowRight, Hash, Phone, MapPin,
  ChevronRight, Command,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionKind = "nav" | "patient" | "action";

interface PaletteItem {
  id: string;
  kind: ActionKind;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  badge?: string;
  href?: string;
  action?: () => void;
  keywords?: string;
}

// ─── Static navigation items ──────────────────────────────────────────────────

const NAV_ITEMS: PaletteItem[] = [
  { id: "nav-/",              kind: "nav", label: "Dashboard",      sublabel: "Métricas del día",            href: "/",              icon: <LayoutDashboard className="w-4 h-4" />,  keywords: "inicio home" },
  { id: "nav-/clientes",      kind: "nav", label: "Clientes",        sublabel: "Gestión de pacientes",        href: "/clientes",      icon: <Users className="w-4 h-4" />,            keywords: "pacientes lista" },
  { id: "nav-/reservas",      kind: "nav", label: "Reservas",         sublabel: "Agenda y calendario",         href: "/reservas",      icon: <Calendar className="w-4 h-4" />,         keywords: "citas agenda" },
  { id: "nav-/recordatorios", kind: "nav", label: "Recordatorios",    sublabel: "Envíos por WhatsApp",         href: "/recordatorios", icon: <MessageCircle className="w-4 h-4" />,     keywords: "whatsapp mensajes" },
  { id: "nav-/buscar",        kind: "nav", label: "Buscar DNI",       sublabel: "Buscar paciente por DNI",     href: "/buscar",        icon: <Search className="w-4 h-4" />,           keywords: "dni busqueda" },
  { id: "nav-/frecuentes",    kind: "nav", label: "Frecuentes",       sublabel: "Pacientes VIP y recurrentes", href: "/frecuentes",    icon: <Star className="w-4 h-4" />,             keywords: "vip recurrentes" },
  { id: "nav-/reportes",      kind: "nav", label: "Reportes",         sublabel: "Estadísticas e informes",     href: "/reportes",      icon: <TrendingUp className="w-4 h-4" />,        keywords: "estadisticas informes" },
  { id: "nav-/precios",       kind: "nav", label: "Precios",          sublabel: "Servicios y tarifas",         href: "/precios",       icon: <Settings className="w-4 h-4" />,         keywords: "servicios tarifas" },
  { id: "nav-/configuracion", kind: "nav", label: "Configuración",    sublabel: "Backup y ajustes",            href: "/configuracion", icon: <Cog className="w-4 h-4" />,              keywords: "ajustes backup" },
];

const ACTION_ITEMS: PaletteItem[] = [
  { id: "act-nuevo-cliente",  kind: "action", label: "Nuevo paciente",   sublabel: "Registrar un paciente nuevo",    href: "/clientes/nuevo", icon: <UserPlus className="w-4 h-4" />,    keywords: "agregar registrar" },
  { id: "act-nueva-reserva",  kind: "action", label: "Nueva reserva",    sublabel: "Agendar una cita",               href: "/reservas",       icon: <CalendarPlus className="w-4 h-4" />, keywords: "cita agendar" },
  { id: "act-reportes-pdf",   kind: "action", label: "Ver reportes",     sublabel: "Exportar informes del período",  href: "/reportes",       icon: <FileText className="w-4 h-4" />,    keywords: "exportar pdf informe" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ICON_COLORS: Record<ActionKind, string> = {
  nav:     "bg-[#2C7DA0]/15 text-[#2C7DA0]",
  patient: "bg-[#52B788]/15 text-[#2d7a52]",
  action:  "bg-violet-100 text-violet-700",
};

const GROUP_LABEL: Record<ActionKind, string> = {
  nav:     "Navegar",
  patient: "Pacientes",
  action:  "Acciones rápidas",
};

function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const norm = normalize(query);
  const idx  = normalize(text).indexOf(norm);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#2C7DA0]/20 text-[#0f2033] font-bold rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query,   setQuery]   = useState("");
  const [cursor,  setCursor]  = useState(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [, setLocation] = useLocation();
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  // Load patients once on mount
  useEffect(() => { setClientes(store.getClientes()); }, []);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // ── Build items list ──────────────────────────────────────────────────────

  const items: PaletteItem[] = (() => {
    const q = normalize(query.trim());

    // Patient results
    const patientItems: PaletteItem[] = clientes
      .filter(c => !q || normalize(c.nombre).includes(q) || c.dni.includes(q) || c.telefono.includes(q))
      .slice(0, 6)
      .map(c => ({
        id:       `pat-${c.id}`,
        kind:     "patient" as ActionKind,
        label:    c.nombre,
        sublabel: `DNI ${c.dni} · ${c.telefono}`,
        icon:     <Users className="w-4 h-4" />,
        href:     `/historial/${c.id}`,
        keywords: c.dni + " " + c.telefono,
      }));

    // Filter nav + actions
    const navFiltered    = NAV_ITEMS   .filter(i => !q || normalize(i.label + " " + (i.keywords || "")).includes(q));
    const actionFiltered = ACTION_ITEMS.filter(i => !q || normalize(i.label + " " + (i.keywords || "")).includes(q));

    return q
      ? [...patientItems, ...actionFiltered, ...navFiltered]
      : [...actionFiltered, ...patientItems, ...navFiltered];
  })();

  // Clamp cursor
  useEffect(() => { setCursor(c => Math.min(c, Math.max(0, items.length - 1))); }, [items.length]);

  // ── Navigate to item ──────────────────────────────────────────────────────

  const go = useCallback((item: PaletteItem) => {
    onClose();
    if (item.action) { item.action(); return; }
    if (item.href)   { setLocation(item.href); }
  }, [onClose, setLocation]);

  // ── Keyboard handling ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor(c => Math.min(c + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor(c => Math.max(c - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[cursor]) go(items[cursor]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, cursor, items, go, onClose]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  // ── Group items for rendering ─────────────────────────────────────────────

  type Group = { kind: ActionKind; items: (PaletteItem & { idx: number })[] };
  const groups: Group[] = [];
  let gi = 0;
  for (const kind of ["action", "patient", "nav"] as ActionKind[]) {
    const sub = items
      .map((item, idx) => ({ ...item, idx }))
      .filter(i => i.kind === kind);
    if (sub.length > 0) groups.push({ kind, items: sub });
  }
  void gi;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed z-50 top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-[580px] px-4"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(44,125,160,0.2)', background: 'white' }}>

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid #e8f0f7' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2C7DA0, #52B788)' }}>
                  <Command className="w-4 h-4 text-white" />
                </div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setCursor(0); }}
                  placeholder="Buscar paciente, navegar, acciones rápidas…"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {items.length === 0 ? (
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Sin resultados para <span className="font-medium text-gray-600">"{query}"</span></p>
                  </div>
                ) : (
                  groups.map(group => (
                    <div key={group.kind} className="py-1.5">
                      <p className="px-4 py-1 text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                        {GROUP_LABEL[group.kind]}
                      </p>
                      {group.items.map(item => {
                        const active = item.idx === cursor;
                        return (
                          <button
                            key={item.id}
                            data-idx={item.idx}
                            onMouseEnter={() => setCursor(item.idx)}
                            onClick={() => go(item)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              active ? "bg-[#f0f7ff]" : "hover:bg-gray-50"
                            }`}
                          >
                            {/* Icon */}
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ICON_COLORS[item.kind]}`}>
                              {item.icon}
                            </span>

                            {/* Text */}
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-gray-800 truncate">
                                {highlight(item.label, query)}
                              </span>
                              {item.sublabel && (
                                <span className="block text-xs text-gray-400 truncate mt-0.5">
                                  {item.kind === "patient" ? (
                                    <span className="flex items-center gap-2">
                                      <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{item.sublabel.split('·')[0].trim()}</span>
                                      <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{item.sublabel.split('·')[1]?.trim()}</span>
                                    </span>
                                  ) : item.sublabel}
                                </span>
                              )}
                            </span>

                            {/* Arrow or badge */}
                            {active
                              ? <ChevronRight className="w-4 h-4 text-[#2C7DA0] shrink-0" />
                              : item.kind === "patient"
                                ? <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Stethoscope className="w-3 h-3" /> Historial</span>
                                : <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            }
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hints */}
              <div className="px-4 py-2.5 flex items-center gap-4 text-[10px] text-gray-400" style={{ borderTop: '1px solid #e8f0f7', background: '#fafcff' }}>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px]">↑↓</kbd> Navegar</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px]">↵</kbd> Seleccionar</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px]">ESC</kbd> Cerrar</span>
                <span className="ml-auto">{items.length} resultado{items.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
