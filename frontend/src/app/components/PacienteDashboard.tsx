import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  Bell,
  LogOut,
  Activity,
  FileText,
  Home,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_SHORT = ["D","S","T","Q","Q","S","S"];
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type PacientePerfil = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string | null;
  telefone?: string | null;
  convenio?: string | null;
};

const services = [
  {
    id: 1,
    nome: "RPG",
    descricao: "Reeducação Postural Global — reequilíbrio da postura por meio de posturas ativas.",
    duracao: "50 min",
    cor: "#0e7490",
    bg: "#e0f2f7",
    icone: "🧘",
    beneficios: ["Correção postural", "Alívio de dores crônicas", "Melhora da respiração"],
  },
  {
    id: 2,
    nome: "Fisioterapia Ortopédica",
    descricao: "Tratamento de lesões músculo-esqueléticas, pós-operatórios e dores articulares.",
    duracao: "50 min",
    cor: "#7c3aed",
    bg: "#ede9fe",
    icone: "🦴",
    beneficios: ["Recuperação de lesões", "Fortalecimento muscular", "Retorno ao esporte"],
  },
  {
    id: 3,
    nome: "Fisioterapia Neurológica",
    descricao: "Reabilitação de pacientes com sequelas de AVC, Parkinson e outras doenças neurológicas.",
    duracao: "60 min",
    cor: "#059669",
    bg: "#d1fae5",
    icone: "🧠",
    beneficios: ["Recuperação motora", "Melhora do equilíbrio", "Independência funcional"],
  },
  {
    id: 4,
    nome: "Pilates Terapêutico",
    descricao: "Exercícios baseados no método Pilates adaptados para reabilitação e prevenção.",
    duracao: "50 min",
    cor: "#d97706",
    bg: "#fef3c7",
    icone: "⚡",
    beneficios: ["Fortalecimento do core", "Flexibilidade", "Prevenção de lesões"],
  },
  {
    id: 5,
    nome: "Fisioterapia Esportiva",
    descricao: "Tratamento e prevenção de lesões em atletas amadores e profissionais.",
    duracao: "50 min",
    cor: "#dc2626",
    bg: "#fee2e2",
    icone: "🏃",
    beneficios: ["Recuperação rápida", "Otimização do desempenho", "Prevenção de recidivas"],
  },
  {
    id: 6,
    nome: "Auriculoterapia",
    descricao: "Técnica de acupuntura no pavilhão auricular para tratamento de dor e ansiedade.",
    duracao: "40 min",
    cor: "#0891b2",
    bg: "#cffafe",
    icone: "🌿",
    beneficios: ["Alívio da dor", "Redução da ansiedade", "Equilíbrio energético"],
  },
];

const terapeutas = [
  { id: 1, nome: "Dr. Carlos Souza", especialidade: "Ortopedia · RPG", avaliacao: 4.9, initials: "CS", cor: "#0e7490" },
  { id: 2, nome: "Dra. Patrícia Lima", especialidade: "Esportiva · Pilates", avaliacao: 4.8, initials: "PL", cor: "#7c3aed" },
  { id: 3, nome: "Dra. Juliana Reis", especialidade: "Neurológica", avaliacao: 4.9, initials: "JR", cor: "#d97706" },
];

const horariosDisponiveis = ["07:00","08:00","09:00","09:30","10:00","11:00","14:00","15:00","15:30","16:00","17:00"];

const proximasConsultas = [
  { data: "13/06/2026", hora: "09:00", servico: "RPG", terapeuta: "Dr. Carlos Souza", sala: "Sala 1", status: "confirmado" },
  { data: "17/06/2026", hora: "09:00", servico: "RPG", terapeuta: "Dr. Carlos Souza", sala: "Sala 1", status: "aguardando" },
];

type Tab = "inicio" | "servicos" | "agendar" | "consultas" | "perfil";

type AgendStep = 1 | 2 | 3 | 4;

export function DashboardPaciente() {
  const { logout,user } = useAuth(); 
  const [perfil, setPerfil] = useState<PacientePerfil | null>(null);
  const [tab, setTab] = useState<Tab>("inicio");
  const [selectedService, setSelectedService] = useState<(typeof services)[0] | null>(null);

 useEffect(() => {
  async function carregarPerfil() {
    if (!user?.token) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/paciente/perfil/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Erro ao buscar perfil");
      }

      setPerfil(data);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  }

  carregarPerfil();
}, [user, logout]);
  
  // Agendamento state
  const [agendStep, setAgendStep] = useState<AgendStep>(1);
  const [agendService, setAgendService] = useState<(typeof services)[0] | null>(null);
  const [agendTerapeuta, setAgendTerapeuta] = useState<(typeof terapeutas)[0] | null>(null);
  const [agendDate, setAgendDate] = useState<number | null>(null);
  const [agendHora, setAgendHora] = useState<string | null>(null);
  const [agendDone, setAgendDone] = useState(false);
  const [calDate] = useState(new Date(2026, 5, 11));

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const availableDays = [13, 14, 16, 17, 18, 19, 20, 23, 24, 25];

  const resetAgend = () => {
    setAgendStep(1);
    setAgendService(null);
    setAgendTerapeuta(null);
    setAgendDate(null);
    setAgendHora(null);
    setAgendDone(false);
  };

  const startAgendFromService = (svc: typeof services[0]) => {
    resetAgend();
    setAgendService(svc);
    setAgendStep(2);
    setTab("agendar");
  };

  const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "inicio", label: "Início", icon: Home },
    { id: "servicos", label: "Serviços", icon: Activity },
    { id: "agendar", label: "Agendar", icon: Calendar },
    { id: "consultas", label: "Consultas", icon: FileText },
    { id: "perfil", label: "Perfil", icon: User },
  ];

  const nomePaciente = perfil?.nome ?? user?.nome ?? "Paciente";
  const emailPaciente = perfil?.email ?? user?.email ?? "";

  const iniciaisPaciente = nomePaciente
    .split(" ")
    .filter(Boolean)
    .map((nome) => nome[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function formatarData(data: string | null) {
    if (!data) return "Não informado";

    const apenasData = data.split("T")[0];
    const [ano, mes, dia] = apenasData.split("-");

    if (!ano || !mes || !dia) return data;

    return `${dia}/${mes}/${ano}`;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      {/* Top header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">NIP</span>
            </div>
          <div>
            <p className="font-bold text-foreground text-sm tracking-wide leading-none">NIP</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Portal do Paciente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {/* ── INÍCIO ── */}
          {tab === "inicio" && (
            <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Hero */}
              <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(135deg, #0c6478 0%, #0891b2 100%)" }}>
                <p className="text-white/70 text-sm">Olá, bem-vindo(a) 👋</p>
                <h1 className="text-white font-bold mt-0.5 mb-4">{nomePaciente}</h1>
                <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
                  <p className="text-white/80 text-xs mb-1">Próxima consulta</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{proximasConsultas[0].servico}</p>
                      <p className="text-white/70 text-sm">{proximasConsultas[0].data} às {proximasConsultas[0].hora}</p>
                      <p className="text-white/60 text-xs mt-0.5">{proximasConsultas[0].terapeuta}</p>
                    </div>
                    <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Calendar size={22} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-5 space-y-5">
                {/* Progress card */}
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <p className="text-sm font-semibold mb-3">Meu Tratamento</p>
                  <div className="flex gap-4 mb-3">
                    {[
                      { label: "Sessões feitas", value: "12" },
                      { label: "Total previsto", value: "20" },
                      { label: "Progresso", value: "60%" },
                    ].map((s) => (
                      <div key={s.label} className="flex-1 text-center">
                        <p className="text-xl font-bold text-primary">{s.value}</p>
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Diagnóstico: Lombalgia crônica</p>
                </div>

                {/* Quick actions */}
                <div>
                  <p className="text-sm font-semibold mb-3">Acesso Rápido</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Agendar sessão", icon: Calendar, action: () => { resetAgend(); setTab("agendar"); }, cor: "#0e7490", bg: "#e0f2f7" },
                      { label: "Ver serviços", icon: Activity, action: () => setTab("servicos"), cor: "#7c3aed", bg: "#ede9fe" },
                      { label: "Minhas consultas", icon: FileText, action: () => setTab("consultas"), cor: "#059669", bg: "#d1fae5" },
                      { label: "Meu perfil", icon: User, action: () => setTab("perfil"), cor: "#d97706", bg: "#fef3c7" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all text-left"
                      >
                        <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                          <item.icon size={17} style={{ color: item.cor }} />
                        </div>
                        <span className="text-sm font-medium text-foreground leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Nossos Serviços</p>
                    <button onClick={() => setTab("servicos")} className="text-xs text-primary font-medium">Ver todos</button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                    {services.slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedService(s)}
                        className="shrink-0 w-36 bg-card rounded-2xl border border-border p-3 text-left hover:border-primary/30 transition-all shadow-sm"
                      >
                        <span className="text-2xl">{s.icone}</span>
                        <p className="text-sm font-medium mt-2 leading-tight">{s.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.duracao}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SERVIÇOS ── */}
          {tab === "servicos" && (
            <motion.div key="servicos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6 space-y-4">
              <div>
                <h2 className="font-bold text-foreground">Nossos Serviços</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Conheça todas as especialidades disponíveis</p>
              </div>
              {services.map((s) => (
                <div key={s.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: s.bg }}>
                        {s.icone}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{s.nome}</p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock size={11} /> {s.duracao}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.descricao}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {s.beneficios.map((b) => (
                        <span key={b} className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.cor }}>{b}</span>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => startAgendFromService(s)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: s.cor, color: "#fff" }}
                    >
                      Agendar este serviço
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── AGENDAR ── */}
          {tab === "agendar" && (
            <motion.div key="agendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6">
              <h2 className="font-bold text-foreground mb-1">Agendar Sessão</h2>
              <p className="text-sm text-muted-foreground mb-5">Siga os passos abaixo para confirmar sua sessão</p>

              {/* Progress steps */}
              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                      style={{
                        background: agendStep >= s ? "#0e7490" : "#e5e7eb",
                        color: agendStep >= s ? "#fff" : "#9ca3af",
                      }}
                    >
                      {agendStep > s ? <CheckCircle size={14} /> : s}
                    </div>
                    {s < 4 && <div className="flex-1 h-0.5 rounded" style={{ background: agendStep > s ? "#0e7490" : "#e5e7eb" }} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-6 -mt-2">
                <span>Serviço</span><span>Profissional</span><span>Data/Hora</span><span>Confirmar</span>
              </div>

              {agendDone ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-10 gap-4"
                >
                  <div className="size-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">Sessão Agendada!</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Sua sessão de <strong>{agendService?.nome}</strong> foi agendada para o dia{" "}
                    <strong>{agendDate && `${agendDate}/06/2026`}</strong> às <strong>{agendHora}</strong> com{" "}
                    <strong>{agendTerapeuta?.nome}</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground">Você receberá uma confirmação por e-mail.</p>
                  <button
                    onClick={() => { resetAgend(); setTab("consultas"); }}
                    className="mt-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Ver minhas consultas
                  </button>
                  <button onClick={resetAgend} className="text-sm text-primary font-medium hover:underline">
                    Fazer outro agendamento
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {/* Step 1 — Serviço */}
                  {agendStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <p className="text-sm font-semibold">Escolha o serviço</p>
                      {services.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setAgendService(s); setAgendStep(2); }}
                          className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-all text-left"
                        >
                          <div className="size-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: s.bg }}>
                            {s.icone}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{s.nome}</p>
                            <p className="text-xs text-muted-foreground">{s.duracao}</p>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Step 2 — Profissional */}
                  {agendStep === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => setAgendStep(1)} className="text-muted-foreground hover:text-foreground">
                          <ChevronLeft size={18} />
                        </button>
                        <p className="text-sm font-semibold">Escolha o profissional</p>
                      </div>
                      {agendService && (
                        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 mb-2">
                          <span className="text-lg">{agendService.icone}</span>
                          <span className="text-sm font-medium">{agendService.nome}</span>
                        </div>
                      )}
                      {terapeutas.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setAgendTerapeuta(t); setAgendStep(3); }}
                          className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-all text-left"
                        >
                          <div className="size-11 rounded-full flex items-center justify-center shrink-0 font-bold text-white" style={{ background: t.cor }}>
                            {t.initials}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{t.nome}</p>
                            <p className="text-xs text-muted-foreground">{t.especialidade}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star size={11} className="text-yellow-400 fill-yellow-400" />
                              <span className="text-xs font-medium">{t.avaliacao}</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Step 3 — Data e Hora */}
                  {agendStep === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAgendStep(2)} className="text-muted-foreground hover:text-foreground">
                          <ChevronLeft size={18} />
                        </button>
                        <p className="text-sm font-semibold">Escolha data e horário</p>
                      </div>

                      {/* Mini calendar */}
                      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                        <p className="text-sm font-medium mb-3 text-center">{MONTHS[month]} {year}</p>
                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                          {DAYS_SHORT.map((d, i) => <div key={i} className="text-center text-xs text-muted-foreground py-1">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {calDays.map((day, i) => {
                            const available = day !== null && availableDays.includes(day);
                            const selected = day === agendDate;
                            return (
                              <button
                                key={i}
                                disabled={!available}
                                onClick={() => day && setAgendDate(day)}
                                className={`aspect-square text-xs rounded-lg flex items-center justify-center transition-colors
                                  ${!day ? "invisible" : ""}
                                  ${selected ? "bg-primary text-white font-bold" : ""}
                                  ${available && !selected ? "hover:bg-secondary text-foreground font-medium" : ""}
                                  ${!available && day ? "text-muted-foreground/40 cursor-not-allowed" : ""}
                                `}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {agendDate && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <p className="text-sm font-medium mb-2">Horários disponíveis — {agendDate}/06</p>
                          <div className="grid grid-cols-4 gap-2">
                            {horariosDisponiveis.map((h) => (
                              <button
                                key={h}
                                onClick={() => setAgendHora(h)}
                                className={`py-2 rounded-xl text-sm font-medium border transition-all
                                  ${agendHora === h ? "bg-primary text-white border-primary" : "bg-card border-border hover:border-primary/40"}`}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {agendDate && agendHora && (
                        <button
                          onClick={() => setAgendStep(4)}
                          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Continuar
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Step 4 — Confirmar */}
                  {agendStep === 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAgendStep(3)} className="text-muted-foreground hover:text-foreground">
                          <ChevronLeft size={18} />
                        </button>
                        <p className="text-sm font-semibold">Confirmar agendamento</p>
                      </div>

                      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border" style={{ background: (agendService?.bg || "#e0f2f7") }}>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{agendService?.icone}</span>
                            <div>
                              <p className="font-bold" style={{ color: agendService?.cor }}>{agendService?.nome}</p>
                              <p className="text-sm" style={{ color: agendService?.cor + "bb" }}>{agendService?.duracao}</p>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-border">
                          {[
                            { label: "Profissional", value: agendTerapeuta?.nome },
                            { label: "Data", value: `${agendDate}/06/2026` },
                            { label: "Horário", value: agendHora },
                            { label: "Local", value: "Núcleo Integrado de Postura" },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center px-4 py-3">
                              <span className="text-sm text-muted-foreground">{item.label}</span>
                              <span className="text-sm font-medium">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-secondary/50 rounded-xl px-4 py-3 text-xs text-muted-foreground">
                        Ao confirmar, você concorda com nossa política de cancelamento. Cancelamentos devem ser feitos com no mínimo 24h de antecedência.
                      </div>

                      <button
                        onClick={() => setAgendDone(true)}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Confirmar Agendamento
                      </button>
                      <button
                        onClick={resetAgend}
                        className="w-full border border-border py-3 rounded-xl text-sm font-medium hover:bg-muted/40 transition-colors"
                      >
                        Cancelar
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CONSULTAS ── */}
          {tab === "consultas" && (
            <motion.div key="consultas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6 space-y-4">
              <div>
                <h2 className="font-bold text-foreground">Minhas Consultas</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Próximas sessões agendadas</p>
              </div>
              {proximasConsultas.map((c, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Calendar size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.servico}</p>
                        <p className="text-xs text-muted-foreground">{c.terapeuta}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === "confirmado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {c.status === "confirmado" ? "Confirmado" : "Aguardando"}
                    </span>
                  </div>
                  <div className="flex gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar size={13} /> {c.data}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock size={13} /> {c.hora}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={13} /> {c.sala}
                    </div>
                  </div>
                  <button className="w-full mt-3 border border-destructive/40 text-destructive text-sm py-2 rounded-xl font-medium hover:bg-destructive/10 transition-colors">
                    Cancelar sessão
                  </button>
                </div>
              ))}

              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <p className="text-sm font-semibold mb-3 text-muted-foreground">Histórico</p>
                {[
                  { data: "10/06/2026", hora: "08:00", servico: "RPG", terapeuta: "Dr. Carlos Souza" },
                  { data: "07/06/2026", hora: "08:00", servico: "RPG", terapeuta: "Dr. Carlos Souza" },
                  { data: "04/06/2026", hora: "08:00", servico: "RPG", terapeuta: "Dr. Carlos Souza" },
                ].map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{h.servico}</p>
                      <p className="text-xs text-muted-foreground">{h.terapeuta}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{h.data}</p>
                      <p className="text-xs text-muted-foreground">{h.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PERFIL ── */}
          {tab === "perfil" && (
            <motion.div key="perfil" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6 space-y-4">
              <h2 className="font-bold text-foreground">Meu Perfil</h2>

              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">
                    {iniciaisPaciente || "??"}
                </span>                
                </div>
                <div>
                  <p className="font-bold text-foreground">{nomePaciente}</p>
                  <p className="text-sm text-muted-foreground">{emailPaciente}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium mt-1 inline-block">Paciente ativa</span>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground px-4 py-3 border-b border-border uppercase tracking-wide">Dados Pessoais</p>
                {[
                  { label: "CPF", value: perfil?.cpf ?? "Não informado" },
                  { label: "Data de nascimento", value: formatarData(perfil?.data_nascimento ?? null) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center px-4 py-3 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground px-4 py-3 border-b border-border uppercase tracking-wide">Tratamento Atual</p>
                {[
                  { label: "Diagnóstico", value: "Lombalgia crônica" },
                  { label: "Fisioterapeuta", value: "Dr. Carlos Souza" },
                  { label: "Início", value: "10/03/2026" },
                  { label: "Sessões realizadas", value: "12 de 20" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center px-4 py-3 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground px-4 py-3 border-b border-border uppercase tracking-wide">Contato da Clínica</p>
                {[
                  { icon: Phone, label: "(11) 3456-7890" },
                  { icon: MapPin, label: "Rua das Flores, 123 — São Paulo, SP" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                    <item.icon size={15} className="text-primary shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 border border-destructive/40 text-destructive py-3 rounded-xl text-sm font-semibold hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} /> Sair da conta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
        <div className="flex items-center">
          {navItems.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { if (item.id === "agendar") resetAgend(); setTab(item.id); }}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              >
                <item.icon size={20} style={{ color: active ? "#0e7490" : "#9ca3af" }} />
                <span className="text-[10px] font-medium" style={{ color: active ? "#0e7490" : "#9ca3af" }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Service detail modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setSelectedService(null)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: selectedService.bg }}>
                  {selectedService.icone}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selectedService.nome}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock size={12} /> {selectedService.duracao}</p>
                </div>
              </div>
              <button onClick={() => setSelectedService(null)} className="text-muted-foreground hover:text-foreground p-1">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{selectedService.descricao}</p>
            <div>
              <p className="text-sm font-semibold mb-2">Benefícios</p>
              <div className="space-y-2">
                {selectedService.beneficios.map((b) => (
                  <div key={b} className="flex items-center gap-2">
                    <CheckCircle size={14} style={{ color: selectedService.cor }} />
                    <span className="text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => { startAgendFromService(selectedService); setSelectedService(null); }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: selectedService.cor }}
            >
              Agendar este serviço
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
