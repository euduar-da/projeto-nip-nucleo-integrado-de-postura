import { useEffect, useState, useCallback } from "react";
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
  Loader2,
  AlertCircle,
  Dumbbell,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DAYS_SHORT = ["D","S","T","Q","Q","S","S"];

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const ENDPOINTS = {
  perfil:    `${API_BASE}/api/paciente/perfil/`,
  sessoes:   `${API_BASE}/api/sessoes/`,
  servicos:  `${API_BASE}/api/servicos/listar/`,
  exercicios:`${API_BASE}/api/meus-exercicios/`,
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PacientePerfil = {
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string | null;
};

/** Formato exato que o SessaoSerializer devolve */
type Sessao = {
  id: number;
  data: string;          // "YYYY-MM-DD"
  horario: string;       // "HH:MM:SS"
  status: string;        // "Agendado" | "Cancelado" | "Realizado" …
  paciente: number;
  paciente_nome: string;
  servico: number;
  servico_nome: string;
  colaborador: number | null;
  colaborador_nome: string;
};

/** Formato exato que o ServicoListSerializer devolve */
type Servico = {
  id: number;
  nome: string;
};

type Exercicio = {
  id: number;
  nome: string;
  descricao_base: string;
  url_midia: string | null;
};

type Prescricao = {
  id: number;
  series: number;
  repeticoes: number;
  exercicios: Exercicio[];
};

type Tab = "inicio" | "servicos" | "agendar" | "consultas" | "exercicios" | "perfil";
type AgendStep = 1 | 2 | 3 | 4;

// ─── Metadados visuais dos serviços (o back só devolve id + nome) ─────────────

const SERVICO_META: Record<string, { cor: string; bg: string; icone: string; duracao: string; descricao: string; beneficios: string[] }> = {
  "RPG": {
    cor: "#0e7490", bg: "#e0f2f7", icone: "🧘", duracao: "50 min",
    descricao: "Reeducação Postural Global — reequilíbrio da postura por meio de posturas ativas.",
    beneficios: ["Correção postural","Alívio de dores crônicas","Melhora da respiração"],
  },
  "Fisioterapia Ortopédica": {
    cor: "#7c3aed", bg: "#ede9fe", icone: "🦴", duracao: "50 min",
    descricao: "Tratamento de lesões músculo-esqueléticas, pós-operatórios e dores articulares.",
    beneficios: ["Recuperação de lesões","Fortalecimento muscular","Retorno ao esporte"],
  },
  "Fisioterapia Neurológica": {
    cor: "#059669", bg: "#d1fae5", icone: "🧠", duracao: "60 min",
    descricao: "Reabilitação de pacientes com sequelas de AVC, Parkinson e outras doenças neurológicas.",
    beneficios: ["Recuperação motora","Melhora do equilíbrio","Independência funcional"],
  },
  "Pilates Terapêutico": {
    cor: "#d97706", bg: "#fef3c7", icone: "⚡", duracao: "50 min",
    descricao: "Exercícios baseados no método Pilates adaptados para reabilitação e prevenção.",
    beneficios: ["Fortalecimento do core","Flexibilidade","Prevenção de lesões"],
  },
  "Fisioterapia Esportiva": {
    cor: "#dc2626", bg: "#fee2e2", icone: "🏃", duracao: "50 min",
    descricao: "Tratamento e prevenção de lesões em atletas amadores e profissionais.",
    beneficios: ["Recuperação rápida","Otimização do desempenho","Prevenção de recidivas"],
  },
  "Auriculoterapia": {
    cor: "#0891b2", bg: "#cffafe", icone: "🌿", duracao: "40 min",
    descricao: "Técnica de acupuntura no pavilhão auricular para tratamento de dor e ansiedade.",
    beneficios: ["Alívio da dor","Redução da ansiedade","Equilíbrio energético"],
  },
};

const META_FALLBACK = {
  cor: "#0e7490", bg: "#e0f2f7", icone: "💆", duracao: "50 min",
  descricao: "Serviço de fisioterapia e reabilitação.", beneficios: [],
};

function metaServico(nome: string) {
  return SERVICO_META[nome] ?? META_FALLBACK;
}

// ─── Terapeutas (ainda mockados até o back expor um endpoint) ─────────────────

const terapeutas = [
  { id: 1, nome: "Dr. Carlos Souza",    especialidade: "Ortopedia · RPG",     avaliacao: 4.9, initials: "CS", cor: "#0e7490" },
  { id: 2, nome: "Dra. Patrícia Lima",  especialidade: "Esportiva · Pilates", avaliacao: 4.8, initials: "PL", cor: "#7c3aed" },
  { id: 3, nome: "Dra. Juliana Reis",   especialidade: "Neurológica",          avaliacao: 4.9, initials: "JR", cor: "#d97706" },
];

const horariosDisponiveis = [
  "07:00","08:00","09:00","09:30","10:00","11:00",
  "14:00","15:00","15:30","16:00","17:00",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(data: string | null) {
  if (!data) return "Não informado";
  const apenasData = data.split("T")[0];
  const [ano, mes, dia] = apenasData.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function formatarHorario(horario: string) {
  // "09:00:00" → "09:00"
  return horario?.slice(0, 5) ?? "";
}

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function statusLabel(status: string) {
  const s = status?.toLowerCase();
  if (s === "realizado" || s === "concluído" || s === "concluido") return "Realizado";
  if (s === "cancelado") return "Cancelado";
  return "Agendado";
}

function statusColor(status: string): { bg: string; text: string } {
  const s = statusLabel(status);
  if (s === "Realizado")  return { bg: "bg-green-100",  text: "text-green-700"  };
  if (s === "Cancelado")  return { bg: "bg-red-100",    text: "text-red-700"    };
  return                         { bg: "bg-yellow-100", text: "text-yellow-700" };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function DashboardPaciente() {
  const { logout, user } = useAuth();

  // — dados do back —
  const [perfil,   setPerfil]   = useState<PacientePerfil | null>(null);
  const [sessoes,  setSessoes]  = useState<Sessao[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);

  // — estados de carregamento —
  const [loadingPerfil,   setLoadingPerfil]   = useState(true);
  const [loadingSessoes,  setLoadingSessoes]  = useState(true);
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [loadingExercicios, setLoadingExercicios] = useState(true);
  const [erroPerfil,   setErroPerfil]   = useState("");
  const [erroSessoes,  setErroSessoes]  = useState("");
  const [erroServicos, setErroServicos] = useState("");
  const [erroExercicios, setErroExercicios] = useState("");

  // — navegação —
  const [tab, setTab] = useState<Tab>("inicio");

  // — modal de detalhe de serviço —
  const [selectedService, setSelectedService] = useState<Servico | null>(null);

  // — agendamento —
  const [agendStep,      setAgendStep]      = useState<AgendStep>(1);
  const [agendService,   setAgendService]   = useState<Servico | null>(null);
  const [agendTerapeuta, setAgendTerapeuta] = useState<typeof terapeutas[0] | null>(null);
  const [agendDate,      setAgendDate]      = useState<number | null>(null);
  const [agendHora,      setAgendHora]      = useState<string | null>(null);
  const [agendDone,      setAgendDone]      = useState(false);
  const [agendLoading,   setAgendLoading]   = useState(false);
  const [agendErro,      setAgendErro]      = useState("");

  // calendário fixo no mês atual
  const [calDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year       = calDate.getFullYear();
  const month      = calDate.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // dias disponíveis: hoje em diante (simplificado)
  const today = new Date();
  const availableDays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (d) => new Date(year, month, d) >= today
  );

  // — headers —
  const authHeaders = useCallback((): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Token ${user?.token ?? ""}`,
  }), [user?.token]);

  // ── Fetch perfil ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.token) { logout(); return; }

    setLoadingPerfil(true);
    fetch(ENDPOINTS.perfil, { headers: authHeaders() })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.erro ?? "Erro ao buscar perfil");
        setPerfil(data);
      })
      .catch((e) => setErroPerfil(e.message))
      .finally(() => setLoadingPerfil(false));
  }, [user?.token]);

  // ── Fetch sessões ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.token) return;

    setLoadingSessoes(true);
    fetch(ENDPOINTS.sessoes, { headers: authHeaders() })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error("Erro ao buscar sessões");
        setSessoes(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch((e) => setErroSessoes(e.message))
      .finally(() => setLoadingSessoes(false));
  }, [user?.token]);

  // ── Fetch serviços ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.token) return;

    setLoadingServicos(true);
    fetch(ENDPOINTS.servicos, { headers: authHeaders() })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error("Erro ao buscar serviços");
        setServicos(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch((e) => setErroServicos(e.message))
      .finally(() => setLoadingServicos(false));
  }, [user?.token]);

  // ── Fetch exercícios/prescrições ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.token) return;

    setLoadingExercicios(true);
    fetch(ENDPOINTS.exercicios, { headers: authHeaders() })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.erro ?? "Erro ao buscar exercícios");
        setPrescricoes(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch((e) => setErroExercicios(e.message))
      .finally(() => setLoadingExercicios(false));
  }, [user?.token]);

  // ── Derivados de sessões ────────────────────────────────────────────────────
  const sessoesFuturas = sessoes
    .filter((s) => statusLabel(s.status) === "Agendado")
    .sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`));

  const sessoesPassadas = sessoes
    .filter((s) => statusLabel(s.status) === "Realizado")
    .sort((a, b) => `${b.data}${b.horario}`.localeCompare(`${a.data}${a.horario}`));

  const proximaSessao = sessoesFuturas[0] ?? null;

  // ── Agendamento ─────────────────────────────────────────────────────────────
  const resetAgend = () => {
    setAgendStep(1); setAgendService(null); setAgendTerapeuta(null);
    setAgendDate(null); setAgendHora(null); setAgendDone(false);
    setAgendErro(""); setAgendLoading(false);
  };

  const startAgendFromService = (svc: Servico) => {
    resetAgend(); setAgendService(svc); setAgendStep(2); setTab("agendar");
  };

  const confirmarAgendamento = async () => {
    if (!agendService || !agendTerapeuta || !agendDate || !agendHora) return;

    setAgendLoading(true);
    setAgendErro("");

    // monta data ISO
    const dataISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(agendDate).padStart(2, "0")}`;
    const horarioFormatado = `${agendHora}:00`;

    // encontra o colaborador pelo nome (provisório até ter endpoint de colaboradores no paciente)
    // usamos o id do terapeuta mockado como placeholder — ajuste quando o back expuser colaborador_id
    const body = {
      data:        dataISO,
      horario:     horarioFormatado,
      servico:     agendService.id,
      colaborador: agendTerapeuta.id,
    };

    try {
      const r = await fetch(ENDPOINTS.sessoes, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        const msg = data?.erro
          ? Object.values(data.erro).flat().join(" ")
          : "Erro ao agendar sessão.";
        throw new Error(msg);
      }

      // adiciona a nova sessão na lista local
      setSessoes((prev) => [...prev, data.sessao ?? data]);
      setAgendDone(true);
    } catch (e: any) {
      setAgendErro(e.message);
    } finally {
      setAgendLoading(false);
    }
  };

  // ── Nav items ────────────────────────────────────────────────────────────────
  const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "inicio",      label: "Início",     icon: Home      },
    { id: "servicos",    label: "Serviços",   icon: Activity  },
    { id: "agendar",     label: "Agendar",    icon: Calendar  },
    { id: "consultas",   label: "Consultas",  icon: FileText  },
    { id: "exercicios",  label: "Exercícios", icon: Dumbbell  },
    { id: "perfil",      label: "Perfil",     icon: User      },
  ];

  const nomePaciente    = perfil?.nome  ?? user?.nome  ?? "Paciente";
  const emailPaciente   = perfil?.email ?? user?.email ?? "";
  const iniciaisPaciente = iniciais(nomePaciente);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>

      {/* ── Header ── */}
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
            {sessoesFuturas.length > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full" />
            )}
          </button>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">

          {/* ══ INÍCIO ══════════════════════════════════════════════════════════ */}
          {tab === "inicio" && (
            <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              {/* Hero */}
              <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(135deg,#0c6478 0%,#0891b2 100%)" }}>
                <p className="text-white/70 text-sm">Olá, bem-vindo(a) 👋</p>
                {loadingPerfil
                  ? <div className="h-7 w-40 bg-white/20 rounded animate-pulse mt-0.5 mb-4" />
                  : <h1 className="text-white font-bold mt-0.5 mb-4">{nomePaciente}</h1>
                }

                {/* Card próxima sessão */}
                <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
                  <p className="text-white/80 text-xs mb-1">Próxima sessão</p>
                  {loadingSessoes ? (
                    <div className="space-y-1.5">
                      <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                      <div className="h-4 w-48 bg-white/20 rounded animate-pulse" />
                    </div>
                  ) : proximaSessao ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{proximaSessao.servico_nome}</p>
                        <p className="text-white/70 text-sm">
                          {formatarData(proximaSessao.data)} às {formatarHorario(proximaSessao.horario)}
                        </p>
                        <p className="text-white/60 text-xs mt-0.5">{proximaSessao.colaborador_nome}</p>
                      </div>
                      <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Calendar size={22} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">Nenhuma sessão agendada</p>
                        <p className="text-white/70 text-sm">Agende sua próxima consulta</p>
                      </div>
                      <button
                        onClick={() => { resetAgend(); setTab("agendar"); }}
                        className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                      >
                        Agendar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 pt-5 space-y-5">

                {/* Card progresso */}
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <p className="text-sm font-semibold mb-3">Meu Tratamento</p>
                  {loadingSessoes ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-2 bg-muted rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-4 mb-3">
                        {[
                          { label: "Sessões feitas",  value: String(sessoesPassadas.length) },
                          { label: "Agendadas",        value: String(sessoesFuturas.length)  },
                          { label: "Total",            value: String(sessoes.length)          },
                        ].map((s) => (
                          <div key={s.label} className="flex-1 text-center">
                            <p className="text-xl font-bold text-primary">{s.value}</p>
                            <p className="text-[11px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {sessoes.length > 0 && (
                        <>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.round((sessoesPassadas.length / sessoes.length) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {Math.round((sessoesPassadas.length / sessoes.length) * 100)}% concluído
                          </p>
                        </>
                      )}
                      {sessoes.length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhuma sessão registrada ainda.</p>
                      )}
                    </>
                  )}
                </div>

                {/* Acesso rápido */}
                <div>
                  <p className="text-sm font-semibold mb-3">Acesso Rápido</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Agendar sessão",   icon: Calendar, action: () => { resetAgend(); setTab("agendar"); }, cor: "#0e7490", bg: "#e0f2f7" },
                      { label: "Ver serviços",      icon: Activity, action: () => setTab("servicos"),    cor: "#7c3aed", bg: "#ede9fe" },
                      { label: "Minhas consultas",  icon: FileText, action: () => setTab("consultas"),   cor: "#059669", bg: "#d1fae5" },
                      { label: "Meu perfil",        icon: User,     action: () => setTab("perfil"),      cor: "#d97706", bg: "#fef3c7" },
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

                {/* Preview serviços */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Nossos Serviços</p>
                    <button onClick={() => setTab("servicos")} className="text-xs text-primary font-medium">Ver todos</button>
                  </div>
                  {loadingServicos ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                      {[1,2,3].map((i) => (
                        <div key={i} className="shrink-0 w-36 h-24 bg-muted rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                      {servicos.slice(0, 4).map((s) => {
                        const meta = metaServico(s.nome);
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedService(s)}
                            className="shrink-0 w-36 bg-card rounded-2xl border border-border p-3 text-left hover:border-primary/30 transition-all shadow-sm"
                          >
                            <span className="text-2xl">{meta.icone}</span>
                            <p className="text-sm font-medium mt-2 leading-tight">{s.nome}</p>
                            <p className="text-xs text-muted-foreground mt-1">{meta.duracao}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Preview exercícios */}
                {(loadingExercicios || prescricoes.length > 0) && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold">Meus Exercícios</p>
                      <button onClick={() => setTab("exercicios")} className="text-xs text-primary font-medium">Ver todos</button>
                    </div>
                    {loadingExercicios ? (
                      <div className="space-y-2">
                        <div className="h-16 bg-muted rounded-2xl animate-pulse" />
                        <div className="h-16 bg-muted rounded-2xl animate-pulse" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {prescricoes.slice(0, 1).map((p) =>
                          p.exercicios.slice(0, 2).map((e) => (
                            <div key={e.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3 shadow-sm">
                              <div className="size-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                                <Dumbbell size={16} className="text-cyan-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{e.nome}</p>
                                <p className="text-xs text-muted-foreground">{p.series}x{p.repeticoes} repetições</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══ SERVIÇOS ════════════════════════════════════════════════════════ */}
          {tab === "servicos" && (
            <motion.div key="servicos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6 space-y-4">
              <div>
                <h2 className="font-bold text-foreground">Nossos Serviços</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Conheça todas as especialidades disponíveis</p>
              </div>

              {loadingServicos && (
                <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" /><span className="text-sm">Carregando serviços…</span>
                </div>
              )}

              {erroServicos && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} /> {erroServicos}
                </div>
              )}

              {!loadingServicos && !erroServicos && servicos.map((s) => {
                const meta = metaServico(s.nome);
                return (
                  <div key={s.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="size-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: meta.bg }}>
                          {meta.icone}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground">{s.nome}</p>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                              <Clock size={11} /> {meta.duracao}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{meta.descricao}</p>
                        </div>
                      </div>
                      {meta.beneficios.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {meta.beneficios.map((b) => (
                            <span key={b} className="text-xs px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.cor }}>{b}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => startAgendFromService(s)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors text-white"
                        style={{ background: meta.cor }}
                      >
                        Agendar este serviço
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ══ AGENDAR ═════════════════════════════════════════════════════════ */}
          {tab === "agendar" && (
            <motion.div key="agendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6">
              <h2 className="font-bold text-foreground mb-1">Agendar Sessão</h2>
              <p className="text-sm text-muted-foreground mb-5">Siga os passos abaixo para confirmar sua sessão</p>

              {/* Barra de progresso */}
              <div className="flex items-center gap-1 mb-6">
                {[1,2,3,4].map((s) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                      style={{ background: agendStep >= s ? "#0e7490" : "#e5e7eb", color: agendStep >= s ? "#fff" : "#9ca3af" }}
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
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10 gap-4">
                  <div className="size-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">Sessão Agendada!</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Sua sessão de <strong>{agendService?.nome}</strong> foi agendada para{" "}
                    <strong>
                      {agendDate && `${String(agendDate).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}`}
                    </strong>{" "}
                    às <strong>{agendHora}</strong> com <strong>{agendTerapeuta?.nome}</strong>.
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
                      {loadingServicos && (
                        <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
                          <Loader2 size={18} className="animate-spin" /><span className="text-sm">Carregando…</span>
                        </div>
                      )}
                      {!loadingServicos && servicos.map((s) => {
                        const meta = metaServico(s.nome);
                        return (
                          <button
                            key={s.id}
                            onClick={() => { setAgendService(s); setAgendStep(2); }}
                            className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-all text-left"
                          >
                            <div className="size-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: meta.bg }}>
                              {meta.icone}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{s.nome}</p>
                              <p className="text-xs text-muted-foreground">{meta.duracao}</p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                          </button>
                        );
                      })}
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
                          <span className="text-lg">{metaServico(agendService.nome).icone}</span>
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

                      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                        <p className="text-sm font-medium mb-3 text-center">{MONTHS[month]} {year}</p>
                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                          {DAYS_SHORT.map((d, i) => <div key={i} className="text-center text-xs text-muted-foreground py-1">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {calDays.map((day, i) => {
                            const available = day !== null && availableDays.includes(day);
                            const selected  = day === agendDate;
                            return (
                              <button
                                key={i}
                                disabled={!available}
                                onClick={() => day && setAgendDate(day)}
                                className={`aspect-square text-xs rounded-lg flex items-center justify-center transition-colors
                                  ${!day ? "invisible" : ""}
                                  ${selected ? "bg-primary text-white font-bold" : ""}
                                  ${available && !selected ? "hover:bg-secondary text-foreground font-medium" : ""}
                                  ${!available && day ? "text-muted-foreground/40 cursor-not-allowed" : ""}`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {agendDate && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <p className="text-sm font-medium mb-2">
                            Horários disponíveis — {String(agendDate).padStart(2,"0")}/{String(month+1).padStart(2,"0")}
                          </p>
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
                        <button onClick={() => setAgendStep(4)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                          Continuar
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Step 4 — Confirmar */}
                  {agendStep === 4 && agendService && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAgendStep(3)} className="text-muted-foreground hover:text-foreground">
                          <ChevronLeft size={18} />
                        </button>
                        <p className="text-sm font-semibold">Confirmar agendamento</p>
                      </div>

                      {(() => {
                        const meta = metaServico(agendService.nome);
                        return (
                          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border" style={{ background: meta.bg }}>
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{meta.icone}</span>
                                <div>
                                  <p className="font-bold" style={{ color: meta.cor }}>{agendService.nome}</p>
                                  <p className="text-sm" style={{ color: meta.cor + "bb" }}>{meta.duracao}</p>
                                </div>
                              </div>
                            </div>
                            <div className="divide-y divide-border">
                              {[
                                { label: "Profissional", value: agendTerapeuta?.nome },
                                { label: "Data",         value: `${String(agendDate).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}` },
                                { label: "Horário",      value: agendHora },
                                { label: "Local",        value: "Núcleo Integrado de Postura" },
                              ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center px-4 py-3">
                                  <span className="text-sm text-muted-foreground">{item.label}</span>
                                  <span className="text-sm font-medium">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {agendErro && (
                        <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-xl text-sm">
                          <AlertCircle size={15} /> {agendErro}
                        </div>
                      )}

                      <div className="bg-secondary/50 rounded-xl px-4 py-3 text-xs text-muted-foreground">
                        Cancelamentos devem ser feitos com no mínimo 24h de antecedência.
                      </div>

                      <button
                        onClick={confirmarAgendamento}
                        disabled={agendLoading}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {agendLoading && <Loader2 size={16} className="animate-spin" />}
                        {agendLoading ? "Agendando…" : "Confirmar Agendamento"}
                      </button>
                      <button onClick={resetAgend} className="w-full border border-border py-3 rounded-xl text-sm font-medium hover:bg-muted/40 transition-colors">
                        Cancelar
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ CONSULTAS ═══════════════════════════════════════════════════════ */}
          {tab === "consultas" && (
            <motion.div key="consultas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6 space-y-4">
              <div>
                <h2 className="font-bold text-foreground">Minhas Consultas</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Histórico e próximas sessões</p>
              </div>

              {loadingSessoes && (
                <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" /><span className="text-sm">Carregando sessões…</span>
                </div>
              )}

              {erroSessoes && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} /> {erroSessoes}
                </div>
              )}

              {/* Próximas */}
              {!loadingSessoes && !erroSessoes && (
                <>
                  {sessoesFuturas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Próximas</p>
                      {sessoesFuturas.map((s) => {
                        const sc = statusColor(s.status);
                        return (
                          <div key={s.id} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                                  <Calendar size={18} className="text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{s.servico_nome}</p>
                                  <p className="text-xs text-muted-foreground">{s.colaborador_nome}</p>
                                </div>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                                {statusLabel(s.status)}
                              </span>
                            </div>
                            <div className="flex gap-4 pt-3 border-t border-border">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar size={13} /> {formatarData(s.data)}
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock size={13} /> {formatarHorario(s.horario)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {sessoesFuturas.length === 0 && (
                    <div className="bg-card rounded-2xl border border-border p-6 text-center">
                      <Calendar size={28} className="text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">Nenhuma sessão agendada</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">Agende sua próxima consulta agora</p>
                      <button
                        onClick={() => { resetAgend(); setTab("agendar"); }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Agendar sessão
                      </button>
                    </div>
                  )}

                  {/* Histórico */}
                  {sessoesPassadas.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                      <p className="text-xs font-semibold text-muted-foreground px-4 py-3 border-b border-border uppercase tracking-wide">
                        Histórico ({sessoesPassadas.length})
                      </p>
                      {sessoesPassadas.map((s, i) => (
                        <div key={s.id} className={`flex items-center justify-between px-4 py-3 ${i < sessoesPassadas.length - 1 ? "border-b border-border" : ""}`}>
                          <div>
                            <p className="text-sm font-medium">{s.servico_nome}</p>
                            <p className="text-xs text-muted-foreground">{s.colaborador_nome}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{formatarData(s.data)}</p>
                            <p className="text-xs text-muted-foreground">{formatarHorario(s.horario)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ══ EXERCÍCIOS ══════════════════════════════════════════════════════ */}
          {tab === "exercicios" && (
            <motion.div key="exercicios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6 space-y-4">
              <div>
                <h2 className="font-bold text-foreground">Meus Exercícios</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Prescrições de exercícios para casa</p>
              </div>

              {loadingExercicios && (
                <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" /><span className="text-sm">Carregando exercícios…</span>
                </div>
              )}

              {erroExercicios && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} /> {erroExercicios}
                </div>
              )}

              {!loadingExercicios && !erroExercicios && prescricoes.length === 0 && (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <Dumbbell size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Nenhum exercício prescrito</p>
                  <p className="text-xs text-muted-foreground mt-1">Seu fisioterapeuta ainda não adicionou exercícios para casa.</p>
                </div>
              )}

              {!loadingExercicios && !erroExercicios && prescricoes.map((p, pi) => (
                <div key={p.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Prescrição {prescricoes.length > 1 ? pi + 1 : ""}
                    </p>
                    <span className="text-xs bg-cyan-100 text-cyan-700 px-2.5 py-0.5 rounded-full font-medium">
                      {p.series} séries · {p.repeticoes} reps
                    </span>
                  </div>

                  {p.exercicios.length === 0 && (
                    <p className="text-sm text-muted-foreground px-4 py-4">Nenhum exercício nesta prescrição.</p>
                  )}

                  {p.exercicios.map((e, ei) => (
                    <div key={e.id} className={`p-4 ${ei < p.exercicios.length - 1 ? "border-b border-border" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                          <Dumbbell size={18} className="text-cyan-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{e.nome}</p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{e.descricao_base}</p>
                          {e.url_midia && (
                            <a
                              href={e.url_midia}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary font-medium hover:underline"
                            >
                              Ver demonstração →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          )}

          {/* ══ PERFIL ══════════════════════════════════════════════════════════ */}
          {tab === "perfil" && (
            <motion.div key="perfil" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 pt-6 space-y-4">
              <h2 className="font-bold text-foreground">Meu Perfil</h2>

              {loadingPerfil ? (
                <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-muted animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted rounded animate-pulse w-40" />
                    <div className="h-4 bg-muted rounded animate-pulse w-56" />
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-primary">{iniciaisPaciente || "??"}</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{nomePaciente}</p>
                    <p className="text-sm text-muted-foreground">{emailPaciente}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium mt-1 inline-block">Paciente ativo</span>
                  </div>
                </div>
              )}

              {erroPerfil && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} /> {erroPerfil}
                </div>
              )}

              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground px-4 py-3 border-b border-border uppercase tracking-wide">Dados Pessoais</p>
                {[
                  { label: "CPF",                value: perfil?.cpf ?? "—" },
                  { label: "Data de nascimento", value: formatarData(perfil?.data_nascimento ?? null) },
                  { label: "E-mail",             value: emailPaciente || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center px-4 py-3 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Resumo de sessões */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground px-4 py-3 border-b border-border uppercase tracking-wide">Meu Tratamento</p>
                {loadingSessoes ? (
                  <div className="px-4 py-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                ) : (
                  <>
                    {[
                      { label: "Sessões realizadas", value: String(sessoesPassadas.length) },
                      { label: "Próxima sessão",     value: proximaSessao ? `${formatarData(proximaSessao.data)} às ${formatarHorario(proximaSessao.horario)}` : "—" },
                      { label: "Serviço atual",      value: proximaSessao?.servico_nome ?? sessoesPassadas[0]?.servico_nome ?? "—" },
                      { label: "Profissional",       value: proximaSessao?.colaborador_nome ?? sessoesPassadas[0]?.colaborador_nome ?? "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-3 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground px-4 py-3 border-b border-border uppercase tracking-wide">Contato da Clínica</p>
                {[
                  { icon: Phone,  label: "(11) 3456-7890" },
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

      {/* ── Bottom nav ── */}
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

      {/* ── Modal detalhe de serviço ── */}
      {selectedService && (() => {
        const meta = metaServico(selectedService.nome);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setSelectedService(null)}>
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: meta.bg }}>
                    {meta.icone}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{selectedService.nome}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock size={12} /> {meta.duracao}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedService(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{meta.descricao}</p>
              {meta.beneficios.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Benefícios</p>
                  <div className="space-y-2">
                    {meta.beneficios.map((b) => (
                      <div key={b} className="flex items-center gap-2">
                        <CheckCircle size={14} style={{ color: meta.cor }} />
                        <span className="text-sm">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => { startAgendFromService(selectedService); setSelectedService(null); }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: meta.cor }}
              >
                Agendar este serviço
              </button>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}