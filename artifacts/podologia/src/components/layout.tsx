import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Users, Calendar, Search, LayoutDashboard,
  TrendingUp, Star, LogOut, Activity,
  Menu, X, Clock, MessageCircle, Cog, Settings,
  Wifi, WifiOff, Download, Command
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { CommandPalette } from "@/components/command-palette";

// ─── Nav items ────────────────────────────────────────────────────────────────

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/",              label: "Panel",         icon: LayoutDashboard, color: "#5DCAA5" },
      { href: "/clientes",      label: "Clientes",      icon: Users,           color: "#5DCAA5" },
      { href: "/reservas",      label: "Reservas",      icon: Calendar,        color: "#5DCAA5" },
      { href: "/recordatorios", label: "Recordatorios", icon: MessageCircle,   color: "#5DCAA5" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/buscar",        label: "Buscar DNI",    icon: Search,          color: "#5DCAA5" },
      { href: "/frecuentes",    label: "Frecuentes",    icon: Star,            color: "#5DCAA5" },
      { href: "/reportes",      label: "Reportes",      icon: TrendingUp,      color: "#5DCAA5" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/precios",       label: "Precios",       icon: Settings,        color: "#5DCAA5" },
      { href: "/configuracion", label: "Configuración", icon: Cog,             color: "#5DCAA5" },
    ],
  },
];

// ─── Last saved + offline indicator ──────────────────────────────────────────

function StatusBar() {
  const [label, setLabel] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => {
      const saved = store.getLastSaved();
      if (!saved) { setLabel("Sin guardar"); return; }
      const diff = Math.floor((Date.now() - new Date(saved).getTime()) / 1000);
      if (diff < 60) setLabel("Guardado");
      else if (diff < 3600) setLabel(`Hace ${Math.floor(diff / 60)} min`);
      else setLabel(new Date(saved).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 30000);

    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(id);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="px-4 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#6a9980' }}>
        <Clock className="w-3 h-3 shrink-0" />
        <span>{label}</span>
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${online ? 'bg-[#1D9E75]/20 text-[#5DCAA5]' : 'bg-red-500/20 text-red-400'}`}>
        {online
          ? <><Wifi className="w-2.5 h-2.5" /> Online</>
          : <><WifiOff className="w-2.5 h-2.5" /> Offline</>
        }
      </div>
    </div>
  );
}

// ─── Nav links ────────────────────────────────────────────────────────────────

function NavLinks({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 py-4 overflow-y-auto">
      {navGroups.map(group => (
        <div key={group.label} className="mb-4">
          <p
            className="px-4 mb-1 text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: '#4a7060' }}
          >
            {group.label}
          </p>
          {group.items.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all text-sm mb-0.5 group ${
                  isActive
                    ? 'font-semibold text-[#5DCAA5]'
                    : 'hover:bg-[#1D9E75]/10 hover:text-[#5DCAA5]'
                }`}
                style={{
                  color: isActive ? '#5DCAA5' : '#8abfaa',
                  ...(isActive ? { background: 'rgba(29,158,117,0.25)', boxShadow: '0 0 0 1px rgba(93,202,165,0.25)' } : {}),
                }}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${!isActive ? 'group-hover:scale-110' : ''}`}
                  style={{ background: isActive ? 'rgba(29,158,117,0.35)' : 'rgba(255,255,255,0.05)' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? '#5DCAA5' : '#6a9980' }} />
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#5DCAA5' }} />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// ─── Sidebar footer ───────────────────────────────────────────────────────────

function SidebarFooter({ onNavigate: _onNavigate }: { onNavigate?: () => void }) {
  const handleExport = () => { store.exportBackup(); };

  return (
    <div style={{ borderTop: '1px solid rgba(93,202,165,0.12)' }}>
      <StatusBar />
      {/* Quick backup */}
      <div className="px-3 pb-2">
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs rounded-xl transition-all hover:bg-[#1D9E75]/10"
          style={{ color: '#6a9980' }}
          title="Exportar backup JSON"
          data-testid="button-quick-backup"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar backup</span>
        </button>
      </div>
      {/* User */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: '1px solid rgba(93,202,165,0.10)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
          style={{ background: '#1D9E75', color: 'white' }}
        >
          DG
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">Dr. García</p>
          <p className="text-xs" style={{ color: '#6a9980' }}>Podólogo</p>
        </div>
        <button
          data-testid="button-logout"
          className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-colors"
          style={{ color: '#4a7060' }}
          title="Salir"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col h-screen fixed top-0 left-0 z-40 sidebar-dark">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(93,202,165,0.12)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: '#1D9E75' }}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">PodoSalud</h1>
            <p className="text-[10px] mt-0.5" style={{ color: '#6a9980' }}>Sistema de Gestión</p>
          </div>
        </div>

        {/* Search / Command palette trigger */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setPaletteOpen(true)}
            data-testid="button-command-palette"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs group hover:bg-[#1D9E75]/10"
            style={{
              color: '#6a9980',
              border: '1px solid rgba(93,202,165,0.15)',
            }}
          >
            <Search className="w-3.5 h-3.5 shrink-0 group-hover:text-[#5DCAA5] transition-colors" />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(93,202,165,0.2)', color: '#6a9980' }}
            >
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
        </div>

        <NavLinks location={location} />
        <SidebarFooter />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3 sidebar-dark">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" data-testid="button-menu-mobile">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] flex flex-col border-0 sidebar-dark">
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(93,202,165,0.12)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#1D9E75' }}
                >
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-base font-bold text-white">PodoSalud</h1>
              </div>
              <Button variant="ghost" size="icon" className="text-white/60 hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#1D9E75' }}
          >
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">PodoSalud</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 md:ml-[240px] mt-14 md:mt-0 min-h-screen">
        <div className="p-5 md:p-7 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
