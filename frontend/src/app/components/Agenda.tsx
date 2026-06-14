import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  Search,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

const ENDPOINTS = {
  sessoes: `${API_URL}/sessoes/`,
  servicos: `${API_URL}/servicos/`,
  colaboradores: `${API_URL}/colaboradores/listar/`,
  pacientes: `${API_URL}/pacientes/listar/`,
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

type SessaoApi = {
  id: number;
  data: string;
  horario: string;
  status: string;
  paciente: number;
  paciente_nome?: string;
  servico: number;
  servico_nome?: string;
  colaborador?: number | null;
  colaborador_nome?: string | null;
};

type Option = {
  id: number;
  nome: string;
};

type FormAgendamento = {
  paciente: string;
  servico: string;
  colaborador: string;
  data: string;
  horario: string;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  options: Option[];
  placeholder: string;
  emptyMessage?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

type SessaoComLayout = SessaoApi & {
  laneIndex: number;
  lanes: number;
};

const cores = ["#0e7490", "#7c3aed", "#059669", "#d97706", "#dc2626"];

function formatDateISO(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");

  return `${year}-${m}-${d}`;
}

function toHHMM(horario: string) {
  return horario?.slice(0, 5);
}

function getToken() {
  const possiveisChaves = ["token", "nip_token", "authToken", "access"];

  for (const chave of possiveisChaves) {
    const valor = localStorage.getItem(chave);

    if (valor && valor.trim()) {
      return valor
        .replace(/^Token\s+/i, "")
        .replace(/^Bearer\s+/i, "")
        .replaceAll('"', "")
        .trim();
    }
  }

  const possiveisUsuarios = ["nip_user", "usuario", "user"];

  for (const chave of possiveisUsuarios) {
    const valor = localStorage.getItem(chave);

    if (!valor) continue;

    try {
      const usuario = JSON.parse(valor);

      if (usuario?.token) {
        return String(usuario.token)
          .replace(/^Token\s+/i, "")
          .replace(/^Bearer\s+/i, "")
          .replaceAll('"', "")
          .trim();
      }
    } catch {
      continue;
    }
  }

  return "";
}

function getPerfil() {
  const perfilDireto =
    localStorage.getItem("perfil") ||
    localStorage.getItem("tipo_usuario") ||
    localStorage.getItem("tipo") ||
    "";

  if (perfilDireto) return perfilDireto;

  const possiveisUsuarios = ["nip_user", "usuario", "user"];

  for (const chave of possiveisUsuarios) {
    const valor = localStorage.getItem(chave);

    if (!valor) continue;

    try {
      const usuario = JSON.parse(valor);

      return usuario?.perfil || usuario?.tipo || "";
    } catch {
      continue;
    }
  }

  return "";
}

function usuarioEhPaciente() {
  const perfil = getPerfil().toLowerCase();

  return perfil.includes("paciente");
}

function apiHeaders() {
  const token = getToken();

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

  let body: any = null;

  if (texto) {
    try {
      body = JSON.parse(texto);
    } catch {
      throw new Error(
        `A API não retornou JSON. Verifique se a URL está correta: ${response.url}`,
      );
    }
  }

  if (response.status === 401) {
    throw new Error(
      body?.detail ||
        body?.erro ||
        "Sessão expirada ou credenciais inválidas. Faça login novamente.",
    );
  }

  return body;
}

function normalizarLista(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function montarNomeUsuario(item: any) {
  const usuario = item.usuario || item.user;

  const nomeCompletoUsuario = [usuario?.first_name, usuario?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    item.nome ||
    item.nome_completo ||
    item.paciente_nome ||
    item.colaborador_nome ||
    item.usuario_nome ||
    nomeCompletoUsuario ||
    usuario?.nome ||
    usuario?.email ||
    item.email ||
    `ID ${item.id}`
  );
}

function mapearOptions(data: any): Option[] {
  return normalizarLista(data).map((item) => ({
    id: item.id,
    nome: montarNomeUsuario(item),
  }));
}

function getStatusColor(status: string) {
  const statusNormalizado = status?.toLowerCase() || "";

  if (statusNormalizado.includes("cancel")) return "#dc2626";
  if (statusNormalizado.includes("aguard")) return "#d97706";

  return "#059669";
}

function formatarErroApi(body: any) {
  if (!body) return "Não foi possível concluir a operação.";

  if (typeof body === "string") return body;

  if (typeof body?.erro === "string") return body.erro;

  if (Array.isArray(body?.erro)) return body.erro.join(", ");

  if (typeof body?.detail === "string") return body.detail;

  if (body?.erro && typeof body.erro === "object") {
    return Object.entries(body.erro)
      .map(([campo, mensagens]) => {
        if (Array.isArray(mensagens)) {
          return `${campo}: ${mensagens.join(", ")}`;
        }

        return `${campo}: ${String(mensagens)}`;
      })
      .join(" | ");
  }

  if (typeof body === "object") {
    return Object.entries(body)
      .map(([campo, mensagens]) => {
        if (Array.isArray(mensagens)) {
          return `${campo}: ${mensagens.join(", ")}`;
        }

        return `${campo}: ${String(mensagens)}`;
      })
      .join(" | ");
  }

  return "Não foi possível concluir a operação.";
}

function getHojeISO() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function getHoraAtualHHMM() {
  const agora = new Date();

  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");

  return `${hora}:${minuto}`;
}

function horarioPassou(data: string, horario: string) {
  const hojeISO = getHojeISO();
  const horaAtual = getHoraAtualHHMM();

  if (data < hojeISO) return true;
  if (data === hojeISO && horario < horaAtual) return true;

  return false;
}

function getProximoHorarioValido(data: string) {
  const hojeISO = getHojeISO();

  if (data !== hojeISO) {
    return "08:00";
  }

  const horaAtual = getHoraAtualHHMM();
  const proximoHorario = HOURS.find((hora) => hora >= horaAtual);

  return proximoHorario || "";
}

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  emptyMessage = "Nenhuma opção encontrada.",
  disabled = false,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(() => {
    return options.find((option) => String(option.id) === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return options;

    return options.filter((option) => option.nome.toLowerCase().includes(term));
  }, [options, search]);

  useEffect(() => {
    if (selectedOption) {
      setSearch(selectedOption.nome);
      return;
    }

    if (!value) {
      setSearch("");
    }
  }, [selectedOption, value]);

  function handleInputChange(texto: string) {
    setSearch(texto);
    setOpen(true);

    if (selectedOption && texto !== selectedOption.nome) {
      onChange("");
    }
  }

  function handleBlur() {
    window.setTimeout(() => {
      setOpen(false);

      const optionAtual = options.find((option) => String(option.id) === value);

      if (optionAtual) {
        setSearch(optionAtual.nome);
      }
    }, 150);
  }

  return (
    <div className="relative">
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label}
      </label>

      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <input
          type="text"
          value={search}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background disabled:opacity-60"
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(String(option.id));
                  setSearch(option.nome);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  String(option.id) === value ? "bg-muted font-medium" : ""
                }`}
              >
                {option.nome}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function Agenda() {
  const hoje = new Date();

  const [currentDate, setCurrentDate] = useState(hoje);
  const [selectedDay, setSelectedDay] = useState(hoje.getDate());

  const [sessoes, setSessoes] = useState<SessaoApi[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<SessaoApi | null>(null);

  const [servicos, setServicos] = useState<Option[]>([]);
  const [colaboradores, setColaboradores] = useState<Option[]>([]);
  const [pacientes, setPacientes] = useState<Option[]>([]);

  const [terapeutaFilter, setTerapeutaFilter] = useState("Todos");
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modalErro, setModalErro] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const selectedDateISO = formatDateISO(year, month, selectedDay);
  const hojeISO = getHojeISO();
  const horaAtualHHMM = getHoraAtualHHMM();
  const isPaciente = usuarioEhPaciente();

  const [form, setForm] = useState<FormAgendamento>({
    paciente: "",
    servico: "",
    colaborador: "",
    data: selectedDateISO,
    horario: "08:00",
  });

  const calDays: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const terapeutasFiltro = useMemo(() => {
    const nomes = sessoes
      .map((s) => s.colaborador_nome || "Não atribuído")
      .filter(Boolean);

    return ["Todos", ...Array.from(new Set(nomes))];
  }, [sessoes]);

  const dayAppts = useMemo(() => {
    return sessoes
      .filter((s) => s.data === selectedDateISO)
      .filter((s) => {
        if (terapeutaFilter === "Todos") return true;

        return (s.colaborador_nome || "Não atribuído") === terapeutaFilter;
      });
  }, [sessoes, selectedDateISO, terapeutaFilter]);

  const dayApptsComLayout = useMemo<SessaoComLayout[]>(() => {
    const grupos = new Map<string, SessaoApi[]>();

    dayAppts.forEach((sessao) => {
      const chave = `${sessao.data}-${toHHMM(sessao.horario)}`;
      const grupoAtual = grupos.get(chave) || [];

      grupoAtual.push(sessao);
      grupos.set(chave, grupoAtual);
    });

    const resultado: SessaoComLayout[] = [];

    grupos.forEach((grupo) => {
      const grupoOrdenado = [...grupo].sort((a, b) => {
        const colaboradorA = a.colaborador_nome || "";
        const colaboradorB = b.colaborador_nome || "";

        return colaboradorA.localeCompare(colaboradorB);
      });

      grupoOrdenado.forEach((sessao, index) => {
        resultado.push({
          ...sessao,
          laneIndex: index,
          lanes: grupoOrdenado.length,
        });
      });
    });

    return resultado.sort((a, b) => {
      const horarioA = toHHMM(a.horario);
      const horarioB = toHHMM(b.horario);

      if (horarioA !== horarioB) {
        return horarioA.localeCompare(horarioB);
      }

      return a.laneIndex - b.laneIndex;
    });
  }, [dayAppts]);

  const horarioIndisponivel = useMemo(() => {
    if (!form.data || !form.horario || !form.colaborador) return false;

    return sessoes.some(
      (s) =>
        s.data === form.data &&
        toHHMM(s.horario) === form.horario &&
        String(s.colaborador) === form.colaborador &&
        !s.status?.toLowerCase().includes("cancel"),
    );
  }, [sessoes, form]);

  const agendamentoNoPassado = useMemo(() => {
    if (!form.data || !form.horario) return false;

    return horarioPassou(form.data, form.horario);
  }, [form.data, form.horario]);

  useEffect(() => {
    carregarSessoes();
    carregarOpcoes();
  }, []);

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  async function carregarSessoes() {
    try {
      setLoading(true);
      setErro("");

      const response = await fetch(ENDPOINTS.sessoes, {
        method: "GET",
        headers: apiHeaders(),
      });

      const body = await lerRespostaApi(response);

      if (!response.ok) {
        throw new Error(formatarErroApi(body));
      }

      setSessoes(normalizarLista(body));
    } catch (error: any) {
      setErro(error.message || "Erro ao carregar agendamentos.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarOptionsDeEndpoint(
    endpoint: string,
    setState: (options: Option[]) => void,
    nomeRecurso: string,
  ) {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: apiHeaders(),
    });

    if (response.status === 404) {
      throw new Error(`Endpoint de ${nomeRecurso} não encontrado: ${endpoint}`);
    }

    const body = await lerRespostaApi(response);

    if (!response.ok) {
      throw new Error(formatarErroApi(body));
    }

    setState(mapearOptions(body));
  }

  async function carregarOpcoes() {
    try {
      setLoadingOptions(true);
      setModalErro("");

      const resultados = await Promise.allSettled([
        carregarOptionsDeEndpoint(ENDPOINTS.servicos, setServicos, "serviços"),
        carregarOptionsDeEndpoint(
          ENDPOINTS.colaboradores,
          setColaboradores,
          "profissionais",
        ),
        !isPaciente
          ? carregarOptionsDeEndpoint(ENDPOINTS.pacientes, setPacientes, "pacientes")
          : Promise.resolve(),
      ]);

      const erros = resultados
        .filter((resultado) => resultado.status === "rejected")
        .map((resultado) =>
          resultado.status === "rejected"
            ? resultado.reason?.message || "Erro ao carregar opções."
            : "",
        )
        .filter(Boolean);

      if (erros.length > 0) {
        setModalErro(
          `Não foi possível carregar as opções do agendamento. ${erros.join(" | ")}`,
        );
      }
    } finally {
      setLoadingOptions(false);
    }
  }

  function abrirModalNovoAgendamento() {
    setErro("");
    setSucesso("");
    setModalErro("");

    const dataInicial = selectedDateISO < hojeISO ? hojeISO : selectedDateISO;
    const horarioInicial = getProximoHorarioValido(dataInicial);

    setForm({
      paciente: "",
      servico: "",
      colaborador: "",
      data: dataInicial,
      horario: horarioInicial,
    });

    setShowNew(true);
    carregarOpcoes();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setModalErro("");
      setSucesso("");

      if (!form.data) {
        setModalErro("Informe a data da sessão.");
        return;
      }

      if (!form.horario) {
        setModalErro("Informe o horário da sessão.");
        return;
      }

      if (form.data < hojeISO) {
        setModalErro(
          "Não é possível agendar uma sessão para uma data anterior à atual.",
        );
        return;
      }

      if (form.data === hojeISO && form.horario < horaAtualHHMM) {
        setModalErro(
          "Não é possível agendar uma sessão em um horário anterior ao horário atual.",
        );
        return;
      }

      if (!form.servico) {
        setModalErro("Busque e selecione o serviço.");
        return;
      }

      if (!form.colaborador) {
        setModalErro("Busque e selecione o profissional.");
        return;
      }

      if (!isPaciente && !form.paciente) {
        setModalErro("Busque e selecione o paciente.");
        return;
      }

      if (horarioIndisponivel) {
        setModalErro("Este profissional já possui agendamento nesse dia e horário.");
        return;
      }

      const payload: any = {
        data: form.data,
        horario: form.horario,
        servico: Number(form.servico),
        colaborador: Number(form.colaborador),
      };

      if (!isPaciente) {
        payload.paciente = Number(form.paciente);
      }

      const response = await fetch(ENDPOINTS.sessoes, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify(payload),
      });

      const body = await lerRespostaApi(response);

      if (!response.ok) {
        throw new Error(formatarErroApi(body));
      }

      setSucesso("Sessão agendada com sucesso.");
      setShowNew(false);

      setForm({
        paciente: "",
        servico: "",
        colaborador: "",
        data: selectedDateISO,
        horario: "08:00",
      });

      await carregarSessoes();
    } catch (error: any) {
      setModalErro(error.message || "Erro ao agendar sessão.");
    } finally {
      setSaving(false);
    }
  }

  function hasAppointmentOnDay(day: number) {
    const data = formatDateISO(year, month, day);

    return sessoes.some((s) => s.data === data);
  }

  function hourToY(horario: string) {
    const [h, m] = toHHMM(horario).split(":").map(Number);

    return ((h - 7) * 60 + m) * (56 / 60);
  }

  function getAppointmentColor(sessao: SessaoApi) {
    const index = sessao.colaborador ? sessao.colaborador % cores.length : 0;

    return cores[index];
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {MONTHS[month]} {year}
          </p>
        </div>

        <div className="flex gap-3">
          <select
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none"
            value={terapeutaFilter}
            onChange={(e) => setTerapeutaFilter(e.target.value)}
          >
            {terapeutasFiltro.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <button
            onClick={abrirModalNovoAgendamento}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Agendar
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-4 py-3 text-sm">
          {sucesso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-medium">
              {MONTHS[month]} {year}
            </span>

            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((day, i) => (
              <button
                key={i}
                disabled={!day}
                onClick={() => day && setSelectedDay(day)}
                className={`relative aspect-square text-xs rounded-lg flex items-center justify-center transition-colors
                  ${!day ? "invisible" : ""}
                  ${
                    day === selectedDay
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-muted text-foreground"
                  }
                  ${
                    day && hasAppointmentOnDay(day) && day !== selectedDay
                      ? "font-semibold"
                      : ""
                  }
                `}
              >
                {day}

                {day && hasAppointmentOnDay(day) && day !== selectedDay && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-border pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Profissionais
            </p>

            {terapeutasFiltro
              .filter((t) => t !== "Todos")
              .map((nome, index) => (
                <div key={nome} className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ background: cores[index % cores.length] }}
                  />
                  <span className="text-xs">{nome}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">
              {selectedDay} de {MONTHS[month]}
            </h3>

            <span className="text-sm text-muted-foreground">
              {loading ? "Carregando..." : `${dayAppts.length} agendamento(s)`}
            </span>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
            <div
              className="relative"
              style={{ minHeight: `${HOURS.length * 56}px` }}
            >
              {HOURS.map((h, i) => (
                <div key={h} className="flex" style={{ height: 56 }}>
                  <div className="w-16 shrink-0 flex items-start pt-2 px-3">
                    <span className="text-xs text-muted-foreground">{h}</span>
                  </div>

                  <div
                    className={`flex-1 border-t border-border ${
                      i % 2 === 0 ? "" : "bg-muted/20"
                    }`}
                  />
                </div>
              ))}

              {!loading && dayAppts.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Clock size={28} className="mb-2 opacity-60" />
                  <p className="text-sm">
                    Nenhuma sessão agendada para este dia.
                  </p>
                </div>
              )}

              {dayApptsComLayout.map((sessao) => {
                const cor = getAppointmentColor(sessao);
                const top = hourToY(sessao.horario) + 8;
                const height = 56 - 4;

                return (
                  <button
                    key={sessao.id}
                    onClick={() => setSelectedAppt(sessao)}
                    className="absolute rounded-lg px-3 py-2 text-left hover:opacity-90 transition-opacity shadow-sm overflow-hidden"
                    style={{
                      top,
                      height,
                      left: `calc(4rem + ${sessao.laneIndex} * ((100% - 5rem) / ${sessao.lanes}))`,
                      width: `calc((100% - 5rem) / ${sessao.lanes} - 0.25rem)`,
                      background: cor + "22",
                      borderLeft: `3px solid ${cor}`,
                    }}
                  >
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: cor }}
                    >
                      {sessao.paciente_nome || `Paciente #${sessao.paciente}`}
                    </p>

                    <p
                      className="text-xs opacity-80 truncate"
                      style={{ color: cor }}
                    >
                      {sessao.servico_nome || `Serviço #${sessao.servico}`} ·{" "}
                      {toHHMM(sessao.horario)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedAppt && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setSelectedAppt(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Detalhes do Agendamento</h3>

              <button
                onClick={() => setSelectedAppt(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="p-4 rounded-xl"
                style={{
                  background: getAppointmentColor(selectedAppt) + "15",
                  borderLeft: `4px solid ${getAppointmentColor(selectedAppt)}`,
                }}
              >
                <p className="font-semibold text-foreground">
                  {selectedAppt.paciente_nome ||
                    `Paciente #${selectedAppt.paciente}`}
                </p>

                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedAppt.servico_nome ||
                    `Serviço #${selectedAppt.servico}`}
                </p>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="text-sm font-medium">{selectedAppt.data}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Horário</span>
                <span className="text-sm font-medium">
                  {toHHMM(selectedAppt.horario)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Profissional
                </span>
                <span className="text-sm font-medium">
                  {selectedAppt.colaborador_nome || "Não atribuído"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>

                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    color: getStatusColor(selectedAppt.status),
                    background: getStatusColor(selectedAppt.status) + "20",
                  }}
                >
                  {selectedAppt.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => {
            setShowNew(false);
            setModalErro("");
          }}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Novo Agendamento</h2>

              <button
                onClick={() => {
                  setShowNew(false);
                  setModalErro("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {modalErro && (
                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-3 py-2 text-sm">
                  {modalErro}
                </div>
              )}

              {!isPaciente && (
                <SearchableSelect
                  label="Paciente"
                  value={form.paciente}
                  options={pacientes}
                  placeholder={
                    loadingOptions
                      ? "Carregando pacientes..."
                      : "Buscar paciente pelo nome"
                  }
                  emptyMessage="Nenhum paciente encontrado."
                  disabled={loadingOptions}
                  onChange={(value) => setForm({ ...form, paciente: value })}
                />
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Data
                </label>

                <input
                  type="date"
                  min={hojeISO}
                  value={form.data}
                  onChange={(e) => {
                    const novaData = e.target.value;

                    setForm({
                      ...form,
                      data: novaData,
                      horario: getProximoHorarioValido(novaData),
                    });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Horário
                </label>

                <input
                  type="time"
                  min={form.data === hojeISO ? horaAtualHHMM : "07:00"}
                  value={form.horario}
                  onChange={(e) =>
                    setForm({ ...form, horario: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                />

                {agendamentoNoPassado && (
                  <p className="text-xs text-destructive mt-1">
                    Não é possível agendar para uma data ou horário anterior ao
                    atual.
                  </p>
                )}

                {horarioIndisponivel && (
                  <p className="text-xs text-destructive mt-1">
                    Este horário já está ocupado para o profissional
                    selecionado.
                  </p>
                )}
              </div>

              <SearchableSelect
                label="Profissional"
                value={form.colaborador}
                options={colaboradores}
                placeholder={
                  loadingOptions
                    ? "Carregando profissionais..."
                    : "Buscar profissional pelo nome"
                }
                emptyMessage="Nenhum profissional encontrado."
                disabled={loadingOptions}
                onChange={(value) => setForm({ ...form, colaborador: value })}
              />

              <SearchableSelect
                label="Serviço"
                value={form.servico}
                options={servicos}
                placeholder={
                  loadingOptions ? "Carregando serviços..." : "Buscar serviço"
                }
                emptyMessage="Nenhum serviço encontrado."
                disabled={loadingOptions}
                onChange={(value) => setForm({ ...form, servico: value })}
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowNew(false);
                    setModalErro("");
                  }}
                  className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving || horarioIndisponivel || agendamentoNoPassado
                  }
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Agendando..." : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
