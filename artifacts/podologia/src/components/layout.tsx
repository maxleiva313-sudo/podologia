import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Users, Calendar, Search, LayoutDashboard, 
  Settings, TrendingUp, Star, LogOut, Activity
} from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/reservas", label: "Reservas", icon: Calendar },
    { href: "/buscar", label: "Buscar DNI", icon: Search },
    { href: "/frecuentes", label: "Frecuentes", icon: Star },
    { href: "/reportes", label: "Reportes", icon: TrendingUp },
    { href: "/precios", label: "Precios", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-[260px] flex flex-col border-r bg-card h-screen fixed">
        <div className="p-6 flex items-center gap-3 border-b">
          <Activity className="text-primary w-8 h-8" />
          <h1 className="text-xl font-bold text-primary">PodoClinic</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
              DG
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Dr. García</p>
              <p className="text-xs text-muted-foreground">Podólogo</p>
            </div>
          </div>
          <button className="flex w-full items-center gap-3 px-4 py-3 mt-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
