import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Clientes from "@/pages/clientes";
import ClientesNuevo from "@/pages/clientes-nuevo";
import ClientesEditar from "@/pages/clientes-editar";
import Reservas from "@/pages/reservas";
import Historial from "@/pages/historial";
import Buscar from "@/pages/buscar";
import Frecuentes from "@/pages/frecuentes";
import Reportes from "@/pages/reportes";
import Precios from "@/pages/precios";
import Configuracion from "@/pages/configuracion";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clientes" component={Clientes} />
        <Route path="/clientes/nuevo" component={ClientesNuevo} />
        <Route path="/clientes/:id/editar" component={ClientesEditar} />
        <Route path="/reservas" component={Reservas} />
        <Route path="/historial/:clienteId" component={Historial} />
        <Route path="/buscar" component={Buscar} />
        <Route path="/frecuentes" component={Frecuentes} />
        <Route path="/reportes" component={Reportes} />
        <Route path="/precios" component={Precios} />
        <Route path="/configuracion" component={Configuracion} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
