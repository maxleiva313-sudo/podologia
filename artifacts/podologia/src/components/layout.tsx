import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Users, Calendar, Search, LayoutDashboard,
  Settings, TrendingUp, Star, LogOut, Activity,
  Menu, X, Clock
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reservas", label: "Reservas", icon: Calendar },
  { href: "/buscar", label: "Buscar DNI", icon: Search },
  { href: "/frecuentes", label: "Frecuentes", icon: Star },
  { href: "/reportes", label: "Reportes", icon: TrendingUp },
  { href: "/precios", label: "Precios", icon: Settings },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function LastSavedLabel() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      const saved = store.getLastSaved();
      if (!saved) { setLabel("Sin guardar"); return; }
      const diff = Math.floor((Date.now() - new Date(saved).getTime()) / 1000);
      if (diff < 60) setLabel("hace un momento");
      else if (diff < 3600) setLabel(`hace ${Math.floor(diff / 60)} min`);
      else setLabel(new Date(saved).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted-foreground">
      <Clock className="w-3 h-3 shrink-0" />
      <span>Guardado: {label}</span>
    </div>
  );
}

function NavLinks({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const items = navItems.filter(i => i.href !== "/configuracion");
  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${isActive
              ? "bg-primary text-primary-foreground font-medium shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t bg-card">
      <LastSavedLabel />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm shrink-0">
          DG
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Dr. García</p>
          <p className="text-xs text-muted-foreground">Podólogo</p>
        </div>
      </div>
      <div className="px-3 pb-3">
        <button
          data-testid="button-logout"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col border-r bg-card h-screen fixed top-0 left-0 z-40">
        <div className="p-5 flex items-center gap-2.5 border-b">
          <Activity className="text-primary w-6 h-6" />
          <h1 className="text-lg font-bold text-primary tracking-tight">PodoClinic</h1>
        </div>
        <NavLinks location={location} />
        <SidebarFooter />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b flex items-center px-4 gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-menu-mobile">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] flex flex-col">
            <div className="p-5 flex items-center justify-between border-b">
              <div className="flex items-center gap-2.5">
                <Activity className="text-primary w-6 h-6" />
                <h1 className="text-lg font-bold text-primary tracking-tight">PodoClinic</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter />
          </SheetContent>
        </Sheet>
        <Activity className="text-primary w-5 h-5" />
        <span className="font-bold text-primary">PodoClinic</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-[240px] mt-14 md:mt-0 min-h-screen">
        <div className="p-6 md:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
