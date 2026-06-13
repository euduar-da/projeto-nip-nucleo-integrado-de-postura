import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  UserCheck,
  DollarSign,
  Activity,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Patients } from "./components/Patients";
import { Agenda } from "./components/Agenda";
import { Prontuario } from "./components/Prontuario";
import { Profissionais } from "./components/Profissionais";
import { Financeiro } from "./components/Financeiro";

type Page = "dashboard" | "pacientes" | "agenda" | "prontuario" | "profissionais" | "financeiro";

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "pacientes" as Page, label: "Pacientes", icon: Users },
  { id: "agenda" as Page, label: "Agenda", icon: Calendar },
  { id: "prontuario" as Page, label: "Prontuário", icon: FileText },
  { id: "profissionais" as Page, label: "Profissionais", icon: UserCheck },
  { id: "financeiro" as Page, label: "Financeiro", icon: DollarSign },
];

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  agenda: "Agenda",
  prontuario: "Prontuário",
  profissionais: "Profissionais",
  financeiro: "Financeiro",
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "pacientes": return <Patients />;
      case "agenda": return <Agenda />;
      case "prontuario": return <Prontuario />;
      case "profissionais": return <Profissionais />;
      case "financeiro": return <Financeiro />;
    }
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border w-60 shrink-0 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Activity size={18} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">FisioClinic</p>
            <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
          </div>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">Principal</p>
          {navItems.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                  ${active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  }`}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors">
            <Settings size={17} />
            <span>Configurações</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-3 mt-1">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-xs text-primary-foreground font-semibold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@clinica.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-5 py-3 bg-card border-b border-border shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground hover:text-foreground p-1" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-semibold text-foreground">{pageTitles[page]}</h2>
              <p className="text-xs text-muted-foreground">Clínica de Fisioterapia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full" />
            </button>
            <div className="size-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-semibold">AD</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
