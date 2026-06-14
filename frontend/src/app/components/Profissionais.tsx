import { useState, useEffect } from "react";
import { Plus, X, Mail, Loader2, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const ENDPOINTS = {
  listarColaboradores: `${API_BASE}/api/colaboradores/listar/`,
  cadastrarColaborador: `${API_BASE}/api/colaboradores/cadastrar/`,
};

type Colaborador = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
};

type CadastroColaborador = {
  first_name: string;
  last_name: string;
  email: string;
  senha: string;
  perfil: string;
};

const cores = ["#0e7490", "#7c3aed", "#d97706", "#059669", "#dc2626", "#0891b2"];

const perfilLabel: Record<string, string> = {
  admin: "Administrador",
  fisioterapeuta: "Fisioterapeuta",
  recepcionista: "Recepcionista",
};

const perfilColor: Record<string, { bg: string; color: string }> = {
  admin: { bg: "#fee2e2", color: "#dc2626" },
  fisioterapeuta: { bg: "#e0f2f7", color: "#0e7490" },
  recepcionista: { bg: "#ede9fe", color: "#7c3aed" },
};

function limparToken(token: string) {
  return token
    .replace(/^Token\s+/i, "")
    .replace(/^Bearer\s+/i, "")
    .split('"')
    .join("")
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

function normalizarLista(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.colaboradores)) return data.colaboradores;

  return [];
}

function montarNome(item: any) {
  const usuario = item.usuario || item.user;

  const nomeCompleto = [
    item.first_name || usuario?.first_name,
    item.last_name || usuario?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    item.nome ||
    item.nome_completo ||
    item.colaborador_nome ||
    item.usuario_nome ||
    nomeCompleto ||
    usuario?.nome ||
    usuario?.email ||
    item.email ||
    `Colaborador #${item.id}`
  );
}

function mapearColaboradores(data: any): Colaborador[] {
  return normalizarLista(data).map((item) => {
    const usuario = item.usuario || item.user;

    return {
      id: item.id,
      nome: montarNome(item),
      email: item.email || usuario?.email || "E-mail não informado",
      perfil: item.perfil || usuario?.perfil || "fisioterapeuta",
    };
  });
}

function formatarErroCadastro(data: any) {
  const erros = data?.erro || data;

  if (!erros) return "Erro ao cadastrar colaborador.";

  if (typeof erros === "string") return erros;

  if (erros?.detail) return erros.detail;

  if (typeof erros === "object") {
    return Object.entries(erros)
      .map(([campo, mensagens]) => {
        if (Array.isArray(mensagens)) {
          return `${campo}: ${mensagens.join(", ")}`;
        }

        return `${campo}: ${String(mensagens)}`;
      })
      .join(" | ");
  }

  return "Erro ao cadastrar colaborador.";
}

function validarCadastro(form: CadastroColaborador) {
  if (!form.first_name.trim()) return "Informe o nome do colaborador.";
  if (!form.last_name.trim()) return "Informe o sobrenome do colaborador.";
  if (!form.email.trim()) return "Informe o e-mail do colaborador.";
  if (!form.senha.trim()) return "Informe a senha inicial do colaborador.";
  if (form.senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (!form.perfil) return "Selecione o perfil de acesso.";

  return "";
}

export function Profissionais() {
  const { user } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Colaborador | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [cadastroLoading, setCadastroLoading] = useState(false);
  const [cadastroErro, setCadastroErro] = useState("");
  const [cadastroForm, setCadastroForm] = useState<CadastroColaborador>({
    first_name: "",
    last_name: "",
    email: "",
    senha: "",
    perfil: "fisioterapeuta",
  });

  async function carregarColaboradores() {
    setLoading(true);
    setError("");

    const token = getAuthToken();

    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.listarColaboradores, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await lerRespostaApi(response);

      if (response.status === 401) {
        throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
      }

      if (response.status === 403) {
        throw new Error("Você não tem autorização para listar colaboradores.");
      }

      if (response.status === 404) {
        throw new Error(`Endpoint de colaboradores não encontrado: ${response.url}`);
      }

      if (!response.ok) {
        throw new Error(formatarErroCadastro(data) || "Erro ao buscar colaboradores.");
      }

      setColaboradores(mapearColaboradores(data));
    } catch (error: any) {
      setError(error.message || "Não foi possível carregar os colaboradores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarColaboradores();
  }, []);

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
      const response = await fetch(ENDPOINTS.cadastrarColaborador, {
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
        setCadastroErro("Apenas administradores podem cadastrar colaboradores.");
        return;
      }

      if (!response.ok) {
        setCadastroErro(formatarErroCadastro(data));
        return;
      }

      const novoColaborador = data?.colaborador || data;

      setColaboradores((prev) => [
        ...prev,
        ...mapearColaboradores([novoColaborador]),
      ]);

      setShowNew(false);
      setCadastroForm({
        first_name: "",
        last_name: "",
        email: "",
        senha: "",
        perfil: "fisioterapeuta",
      });

      await carregarColaboradores();
    } catch (error: any) {
      setCadastroErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setCadastroLoading(false);
    }
  };

  const getIniciais = (nome: string) =>
    nome
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profissionais</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading
              ? "Carregando..."
              : `${colaboradores.length} colaboradores cadastrados`}
          </p>
        </div>

        {user?.tipo === "colaborador" && (
          <button
            onClick={() => {
              setShowNew(true);
              setCadastroErro("");
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Novo Profissional
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">
            Carregando colaboradores...
          </span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {colaboradores.length === 0 ? (
            <p className="text-muted-foreground text-sm col-span-3 text-center py-8">
              Nenhum colaborador encontrado.
            </p>
          ) : (
            colaboradores.map((c, i) => {
              const cor = cores[i % cores.length];
              const perfil = perfilColor[c.perfil] ?? {
                bg: "#f3f4f6",
                color: "#6b7280",
              };

              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="bg-card rounded-xl border border-border shadow-sm p-5 text-left hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: cor + "20" }}
                    >
                      <span className="text-lg font-bold" style={{ color: cor }}>
                        {getIniciais(c.nome)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.email}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                        style={{ background: perfil.bg, color: perfil.color }}
                      >
                        {perfilLabel[c.perfil] ?? c.perfil}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-semibold">Perfil do Colaborador</h2>
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
                  <span className="text-xl font-bold text-primary">
                    {getIniciais(selected.nome)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selected.nome}</h3>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                    style={{
                      background: perfilColor[selected.perfil]?.bg ?? "#f3f4f6",
                      color: perfilColor[selected.perfil]?.color ?? "#6b7280",
                    }}
                  >
                    {perfilLabel[selected.perfil] ?? selected.perfil}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Mail size={11} /> E-mail
                  </p>
                  <p className="text-sm font-medium">{selected.email}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Shield size={11} /> Perfil de acesso
                  </p>
                  <p className="text-sm font-medium">
                    {perfilLabel[selected.perfil] ?? selected.perfil}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowNew(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Novo Colaborador</h2>
              <button
                onClick={() => setShowNew(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
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
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  placeholder="email@clinica.com"
                  value={cadastroForm.email}
                  onChange={(e) =>
                    setCadastroForm({ ...cadastroForm, email: e.target.value })
                  }
                />
              </div>
              <div>
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
                  Perfil de acesso
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  value={cadastroForm.perfil}
                  onChange={(e) =>
                    setCadastroForm({ ...cadastroForm, perfil: e.target.value })
                  }
                >
                  <option value="fisioterapeuta">Fisioterapeuta</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {cadastroErro && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {cadastroErro}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowNew(false)}
                  className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors"
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
