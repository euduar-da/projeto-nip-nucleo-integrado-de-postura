import { Users, Calendar, Activity, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmado: { label: "Confirmado", color: "#0e7490", bg: "#e0f2f7" },
  em_andamento: { label: "Em andamento", color: "#059669", bg: "#d1fae5" },
  aguardando: { label: "Aguardando", color: "#d97706", bg: "#fef3c7" },
  Agendado: { label: "Agendado", color: "#0e7490", bg: "#e0f2f7" },
  Cancelado: { label: "Cancelado", color: "#dc2626", bg: "#fee2e2" },
};

type SessaoHoje = {
  id: number;
  data: string;
  horario: string;
  status: string;
  paciente_nome: string;
  servico_nome: string;
  colaborador_nome: string | null;
};

type StatsMes = {
  mes: string;
  novos: number;
  atendimentos: number;
};

export function Dashboard() {
  const [totalPacientes, setTotalPacientes] = useState<number | null>(null);
  const [sessoesHoje, setSessoesHoje] = useState<SessaoHoje[]>([]);
  const [totalSessoesHoje, setTotalSessoesHoje] = useState<number | null>(null);
  const [statsData, setStatsData] = useState<StatsMes[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("nip_token");
    if (!token) return;

    const hoje = new Date().toISOString().split("T")[0];

    fetch(`${API_URL}/api/pacientes/listar/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(res => res.json())
      .then(data => setTotalPacientes(data.length))
      .catch(() => {});

    fetch(`${API_URL}/api/sessoes/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(res => res.json())
      .then((data: SessaoHoje[]) => {
        const hoje_sessoes = data.filter(s => s.data === hoje);
        setSessoesHoje(hoje_sessoes);
        setTotalSessoesHoje(hoje_sessoes.length);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/estatisticas/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(() => {});
  }, []);

  const mesAtual = new Date().getMonth();
  const atendimentosMesAtual = statsData[mesAtual]?.atendimentos ?? 0;
  const atendimentosMesAnterior = statsData[mesAtual - 1]?.atendimentos ?? 0;
  const variacaoAtendimentos = atendimentosMesAnterior > 0
    ? Math.round(((atendimentosMesAtual - atendimentosMesAnterior) / atendimentosMesAnterior) * 100)
    : 0;

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dataAtualCapitalizada = dataAtual.charAt(0).toUpperCase() + dataAtual.slice(1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Painel Geral</h1>
        <p className="text-muted-foreground mt-0.5">{dataAtualCapitalizada}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Pacientes Ativos",
            value: totalPacientes !== null ? String(totalPacientes) : "...",
            icon: Users,
            change: "Total cadastrados",
            color: "#0e7490",
            bg: "#e0f2f7"
          },
          {
            label: "Agendamentos Hoje",
            value: totalSessoesHoje !== null ? String(totalSessoesHoje) : "...",
            icon: Calendar,
            change: "Sessões do dia",
            color: "#059669",
            bg: "#d1fae5"
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-semibold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: stat.bg }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agenda de Hoje */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Agenda de Hoje</h3>
          <span className="text-sm text-muted-foreground">
            {totalSessoesHoje !== null ? `${totalSessoesHoje} sessões` : "..."}
          </span>
        </div>
        <div className="divide-y divide-border">
          {sessoesHoje.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {totalSessoesHoje === null ? "Carregando..." : "Nenhuma sessão agendada para hoje."}
            </p>
          ) : (
            sessoesHoje.map((apt) => {
              const statusKey = apt.status in statusConfig ? apt.status : "Agendado";
              const s = statusConfig[statusKey];
              return (
                <div key={apt.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors">
                  <div className="w-14 shrink-0">
                    <span className="text-sm font-medium text-foreground">{apt.horario.slice(0, 5)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{apt.paciente_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {apt.servico_nome} · {apt.colaborador_nome ?? "Profissional a definir"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium" style={{ color: s.color, background: s.bg }}>
                    {s.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}