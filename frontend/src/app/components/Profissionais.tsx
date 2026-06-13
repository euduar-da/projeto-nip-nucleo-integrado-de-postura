import { useState, useEffect } from "react";
import { Plus, X, Mail, Loader2, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Colaborador = {
  id: number;
  nome: string;
  email: string;
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

export function Profissionais() {
  const { user } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Colaborador | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [cadastroLoading, setCadastroLoading] = useState(false);
  const [cadastroErro, setCadastroErro] = useState("");
  const [cadastroForm, setCadastroForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    senha: "",
    perfil: "fisioterapeuta",
  });

  useEffect(() => {
    const token = localStorage.getItem("nip_token");
    if (!token) return;

    fetch(`${API_URL}/api/colaboradores/listar/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setColaboradores(data))
      .catch(() => setError("Não foi possível carregar os colaboradores."))
      .finally(() => setLoading(false));
  }, []);

  const handleCadastrar = async () => {
    setCadastroErro("");
    setCadastroLoading(true);
    const token = localStorage.getItem("nip_token");

    try {
      const response = await fetch(`${API_URL}/api/colaboradores/cadastrar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(cadastroForm),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setCadastroErro("Apenas administradores podem cadastrar colaboradores.");
          return;
        }
        const erros = data?.erro;
        const mensagem =
          erros?.email?.[0] ??
          erros?.senha?.[0] ??
          erros?.first_name?.[0] ??
          erros?.last_name?.[0] ??
          erros?.perfil?.[0] ??
          "Erro ao cadastrar colaborador.";
        setCadastroErro(mensagem);
        return;
      }

      setColaboradores((prev) => [...prev, {
        id: data.colaborador.id,
        nome: data.colaborador.nome,
        email: data.colaborador.email,
        perfil: data.colaborador.perfil,
      }]);

      setShowNew(false);
      setCadastroForm({
        first_name: "", last_name: "", email: "",
        senha: "", perfil: "fisioterapeuta",
      });
    } catch {
      setCadastroErro("Não foi possível conectar ao servidor.");
    } finally {
      setCadastroLoading(false);
    }
  };

  const getIniciais = (nome: string) =>
    nome.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profissionais</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Carregando..." : `${colaboradores.length} colaboradores cadastrados`}
          </p>
        </div>
        {user?.tipo === "colaborador" && (
          <button
            onClick={() => { setShowNew(true); setCadastroErro(""); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Novo Profissional
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">Carregando colaboradores...</span>
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
              const perfil = perfilColor[c.perfil] ?? { bg: "#f3f4f6", color: "#6b7280" };
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="bg-card rounded-xl border border-border shadow-sm p-5 text-left hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="size-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: cor + "20" }}>
                      <span className="text-lg font-bold" style={{ color: cor }}>
                        {getIniciais(c.nome)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.email}</p>
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

      {/* Modal detalhe */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" onClick={() => setSelected(null)}>
          <div className="bg-card h-full w-full max-w-md shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-semibold">Perfil do Colaborador</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{getIniciais(selected.nome)}</span>
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
                  <p className="text-sm font-medium">{perfilLabel[selected.perfil] ?? selected.perfil}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal novo colaborador */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNew(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Novo Colaborador</h2>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nome</label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    placeholder="Nome"
                    value={cadastroForm.first_name}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Sobrenome</label>
                  <input
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    placeholder="Sobrenome"
                    value={cadastroForm.last_name}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">E-mail</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  placeholder="email@clinica.com"
                  value={cadastroForm.email}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Senha inicial</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  placeholder="Mínimo 6 caracteres"
                  value={cadastroForm.senha}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, senha: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Perfil de acesso</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  value={cadastroForm.perfil}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, perfil: e.target.value })}
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
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
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