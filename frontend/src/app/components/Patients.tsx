import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Mail,
  ChevronRight,
  X,
  User,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const ENDPOINTS = {
  listarPacientes: `${API_BASE}/api/pacientes/listar/`,
  cadastrarPaciente: `${API_BASE}/api/pacientes/cadastrar/`,
};

type Paciente = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string;
};

type CadastroPacienteForm = {
  first_name: string;
  last_name: string;
  email: string;
  senha: string;
  cpf: string;
  data_nascimento: string;
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
    throw new Error(
      `A API não retornou JSON. Verifique se a URL está correta: ${response.url}`
    );
  }
}

function formatarErroCadastro(data: any) {
  const erros = data?.erro || data;

  if (typeof erros === "string") return erros;

  if (erros?.detail) return erros.detail;

  if (erros && typeof erros === "object") {
    return Object.entries(erros)
      .map(([campo, mensagens]) => {
        if (Array.isArray(mensagens)) {
          return `${campo}: ${mensagens.join(", ")}`;
        }

        return `${campo}: ${String(mensagens)}`;
      })
      .join(" | ");
  }

  return "Erro ao cadastrar paciente.";
}

function normalizarPacientes(data: any): Paciente[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function validarCadastro(form: CadastroPacienteForm) {
  if (!form.first_name.trim()) return "Informe o nome do paciente.";
  if (!form.last_name.trim()) return "Informe o sobrenome do paciente.";
  if (!form.email.trim()) return "Informe o e-mail do paciente.";
  if (!form.senha.trim()) return "Informe a senha inicial do paciente.";
  if (form.senha.trim().length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (!form.cpf.trim()) return "Informe o CPF do paciente.";
  if (!form.data_nascimento) return "Informe a data de nascimento do paciente.";

  return "";
}

export function Patients() {
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Paciente | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [cadastroLoading, setCadastroLoading] = useState(false);
  const [cadastroErro, setCadastroErro] = useState("");
  const [cadastroForm, setCadastroForm] = useState<CadastroPacienteForm>({
    first_name: "",
    last_name: "",
    email: "",
    senha: "",
    cpf: "",
    data_nascimento: "",
  });

  useEffect(() => {
    async function carregarPacientes() {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(ENDPOINTS.listarPacientes, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        const data = await lerRespostaApi(response);

        if (response.status === 401) {
          throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
        }

        if (response.status === 403) {
          throw new Error("Você não tem autorização para listar pacientes.");
        }

        if (!response.ok) {
          throw new Error(formatarErroCadastro(data) || "Erro ao buscar pacientes.");
        }

        setPatients(normalizarPacientes(data));
      } catch (error: any) {
        setError(error.message || "Não foi possível carregar os pacientes.");
      } finally {
        setLoading(false);
      }
    }

    carregarPacientes();
  }, []);

  const filtered = patients.filter((p) => {
    const termo = search.toLowerCase();

    return (
      p.nome?.toLowerCase().includes(termo) ||
      p.email?.toLowerCase().includes(termo) ||
      p.cpf?.includes(search)
    );
  });

  const formatDate = (date: string) => {
    if (!date) return "—";

    const [y, m, d] = date.split("-");

    if (!y || !m || !d) return date;

    return `${d}/${m}/${y}`;
  };

  function abrirModalCadastro() {
    setCadastroErro("");
    setShowNew(true);
  }

  function fecharModalCadastro() {
    setShowNew(false);
    setCadastroErro("");
  }

  const handleCadastrar = async () => {
    setCadastroErro("");

    const erroValidacao = validarCadastro(cadastroForm);

    if (erroValidacao) {
      setCadastroErro(erroValidacao);
      return;
    }

    setCadastroLoading(true);

    const token = getAuthToken();

    if (!token) {
      setCadastroErro("Sessão expirada. Faça login novamente.");
      setCadastroLoading(false);
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.cadastrarPaciente, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(cadastroForm),
      });

      const data = await lerRespostaApi(response);

      if (response.status === 401) {
        setCadastroErro("Sessão expirada ou token inválido. Faça login novamente.");
        return;
      }

      if (response.status === 403) {
        setCadastroErro("Você não tem autorização para cadastrar pacientes.");
        return;
      }

      if (!response.ok) {
        setCadastroErro(formatarErroCadastro(data));
        return;
      }

      const pacienteCriado = data?.paciente ?? data;

      setPatients((prev) => [
        ...prev,
        {
          id: pacienteCriado.id,
          nome: pacienteCriado.nome,
          email: pacienteCriado.email,
          cpf: pacienteCriado.cpf,
          data_nascimento: pacienteCriado.data_nascimento,
        },
      ]);

      setShowNew(false);
      setCadastroErro("");
      setCadastroForm({
        first_name: "",
        last_name: "",
        email: "",
        senha: "",
        cpf: "",
        data_nascimento: "",
      });
    } catch (error: any) {
      setCadastroErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setCadastroLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Carregando..." : `${patients.length} pacientes cadastrados`}
          </p>
        </div>

        <button
          onClick={abrirModalCadastro}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Novo Paciente
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">
            Carregando pacientes...
          </span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Paciente", "CPF", "Data de Nascimento", "E-mail", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-muted-foreground px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-primary">
                            {p.nome
                              ?.split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("") || "P"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{p.nome}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.cpf}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(p.data_nascimento)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3">
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card h-full w-full max-w-md shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold">Ficha do Paciente</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {selected.nome
                      ?.split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("") || "P"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selected.nome}</h3>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User, label: "CPF", value: selected.cpf },
                  {
                    icon: Calendar,
                    label: "Nascimento",
                    value: formatDate(selected.data_nascimento),
                  },
                  { icon: Mail, label: "E-mail", value: selected.email },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon size={13} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  <FileText size={15} /> Ver Prontuário
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors">
                  <Calendar size={15} /> Agendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={fecharModalCadastro}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-lg m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Novo Paciente</h2>
              <button
                onClick={fecharModalCadastro}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Nome
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    placeholder="Nome"
                    value={cadastroForm.first_name}
                    onChange={(e) =>
                      setCadastroForm({ ...cadastroForm, first_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Sobrenome
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    placeholder="Sobrenome"
                    value={cadastroForm.last_name}
                    onChange={(e) =>
                      setCadastroForm({ ...cadastroForm, last_name: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    placeholder="email@exemplo.com"
                    value={cadastroForm.email}
                    onChange={(e) =>
                      setCadastroForm({ ...cadastroForm, email: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Senha inicial
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    placeholder="Mínimo 6 caracteres"
                    value={cadastroForm.senha}
                    onChange={(e) =>
                      setCadastroForm({ ...cadastroForm, senha: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    CPF
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    placeholder="000.000.000-00"
                    value={cadastroForm.cpf}
                    onChange={(e) =>
                      setCadastroForm({ ...cadastroForm, cpf: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    value={cadastroForm.data_nascimento}
                    onChange={(e) =>
                      setCadastroForm({
                        ...cadastroForm,
                        data_nascimento: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {cadastroErro && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {cadastroErro}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={fecharModalCadastro}
                  disabled={cadastroLoading}
                  className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors disabled:opacity-70"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleCadastrar}
                  disabled={cadastroLoading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {cadastroLoading ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
