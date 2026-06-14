import { Users, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const API_BASE = RAW_API_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_URL.replace(/\/$/, "")
  : `${RAW_API_URL.replace(/\/$/, "")}/api`;

const ENDPOINTS = {
  pacientes: `${API_BASE}/pacientes/listar/`,
  sessoes: `${API_BASE}/sessoes/`,
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmado: { label: "Confirmado", color: "#0e7490", bg: "#e0f2f7" },
  em_andamento: { label: "Em andamento", color: "#059669", bg: "#d1fae5" },
  aguardando: { label: "Aguardando", color: "#d97706", bg: "#fef3c7" },
  Agendado: { label: "Agendado", color: "#0e7490", bg: "#e0f2f7" },
  Cancelado: { label: "Cancelado", color: "#dc2626", bg: "#fee2e2" },
};

type PacienteApi = {
  id: number;
  nome?: string;
  email?: string;
};

type SessaoHoje = {
  id: number;
  data: string;
  horario: string;
  status: string;
  paciente_nome?: string;
  servico_nome?: string;
  colaborador_nome?: string | null;
};

function limparToken(token: string) {
  return token
    .replace(/^Token\s+/i, "")
    .replace(/^Bearer\s+/i, "")
    .replaceAll('"', "")
    .trim();
}

function getAuthToken() {
  const chavesDiretas = ["nip_token", "token", "authToken", "access"];

  for (const chave of chavesDiretas) {
    const valor = localStorage.getItem(chave);

    if (valor && valor.trim()) {
      return limparToken(valor);
    }
  }

  const chavesUsuario = ["nip_user", "usuario", "user"];

  for (const chave of chavesUsuario) {
    const valor = localStorage.getItem(chave);

    if (!valor) continue;

    try {
      const usuario = JSON.parse(valor);

      if (usuario?.token) {
        return limparToken(String(usuario.token));
      }
    } catch {
      continue;
    }
  }

  return "";
}

function getAuthHeaders() {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  return headers;
}

async function lerRespostaApi(response: Response) {
  const texto = await response.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`A API não retornou JSON: ${response.url}`);
  }
}

function normalizarLista(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getHojeISO() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function getStatusConfig(status: string) {
  if (statusConfig[status]) return statusConfig[status];

  const statusNormalizado = status?.toLowerCase();

  if (statusNormalizado?.includes("cancel")) {
    return statusConfig.Cancelado;
  }

  if (statusNormalizado?.includes("aguard")) {
    return statusConfig.aguardando;
  }

  return statusConfig.Agendado;
}

export function Dashboard() {
  const [totalPacientes, setTotalPacientes] = useState<number | null>(null);
  const [sessoesHoje, setSessoesHoje] = useState<SessaoHoje[]>([]);
  const [totalSessoesHoje, setTotalSessoesHoje] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDashboard() {
      const token = getAuthToken();

      if (!token) {
        setErro("Sessão expirada. Faça login novamente.");
        setTotalPacientes(0);
        setTotalSessoesHoje(0);
        return;
      }

      const hoje = getHojeISO();

      try {
        setErro("");

        const [pacientesResponse, sessoesResponse] = await Promise.all([
          fetch(ENDPOINTS.pacientes, {
            method: "GET",
            headers: getAuthHeaders(),
          }),
          fetch(ENDPOINTS.sessoes, {
            method: "GET",
            headers: getAuthHeaders(),
          }),
        ]);

        const pacientesData = await lerRespostaApi(pacientesResponse);
        const sessoesData = await lerRespostaApi(sessoesResponse);

        if (pacientesResponse.status === 401 || sessoesResponse.status === 401) {
          throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
        }

        if (pacientesResponse.status === 403) {
          throw new Error("Você não tem autorização para listar pacientes.");
        }

        if (!pacientesResponse.ok) {
          throw new Error("Não foi possível carregar a quantidade de pacientes.");
        }

        if (!sessoesResponse.ok) {
          throw new Error("Não foi possível carregar os agendamentos.");
        }

        const pacientes: PacienteApi[] = normalizarLista(pacientesData);
        const sessoes: SessaoHoje[] = normalizarLista(sessoesData);

        const sessoesDoDia = sessoes
          .filter((sessao) => sessao.data === hoje)
          .sort((a, b) => a.horario.localeCompare(b.horario));

        setTotalPacientes(pacientes.length);
        setSessoesHoje(sessoesDoDia);
        setTotalSessoesHoje(sessoesDoDia.length);
      } catch (error: any) {
        setErro(error.message || "Erro ao carregar dados do dashboard.");
        setTotalPacientes(0);
        setTotalSessoesHoje(0);
        setSessoesHoje([]);
      }
    }

    carregarDashboard();
  }, []);

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dataAtualCapitalizada =
    dataAtual.charAt(0).toUpperCase() + dataAtual.slice(1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Painel Geral</h1>
        <p className="text-muted-foreground mt-0.5">{dataAtualCapitalizada}</p>
      </div>

      {erro && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Pacientes Ativos",
            value: totalPacientes !== null ? String(totalPacientes) : "...",
            icon: Users,
            change: "Total cadastrados",
            color: "#0e7490",
            bg: "#e0f2f7",
          },
          {
            label: "Agendamentos Hoje",
            value: totalSessoesHoje !== null ? String(totalSessoesHoje) : "...",
            icon: Calendar,
            change: "Sessões do dia",
            color: "#059669",
            bg: "#d1fae5",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl p-5 border border-border shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p
                  className="text-3xl font-semibold mt-1"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </div>

              <div
                className="rounded-lg p-2.5"
                style={{ background: stat.bg }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

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
              {totalSessoesHoje === null
                ? "Carregando..."
                : "Nenhuma sessão agendada para hoje."}
            </p>
          ) : (
            sessoesHoje.map((apt) => {
              const status = getStatusConfig(apt.status);

              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-14 shrink-0">
                    <span className="text-sm font-medium text-foreground">
                      {apt.horario?.slice(0, 5)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {apt.paciente_nome || "Paciente não informado"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {apt.servico_nome || "Serviço não informado"} ·{" "}
                      {apt.colaborador_nome || "Profissional a definir"}
                    </p>
                  </div>

                  <span
                    className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      color: status.color,
                      background: status.bg,
                    }}
                  >
                    {status.label}
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