import { useState, useEffect } from "react";
import { Search, Plus, ChevronRight, X, Activity, Clipboard } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  const stored = localStorage.getItem("nip_user");
  return stored ? JSON.parse(stored).token : null;
}

type Anotacao = {
  id: number;
  conteudo: string;
  data: string;
  hora: string;
  colaborador_nome: string;
};

type FichaClinica = {
  id: number;
  data_criacao: string;
  paciente: number;
  paciente_nome: string;
  anotacoes: Anotacao[];
};

type Paciente = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string;
};

type TabType = "evolucoes" | "avaliacao";

export function Prontuario() {
  const [search, setSearch] = useState("");
  const [fichas, setFichas] = useState<FichaClinica[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<FichaClinica | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("evolucoes");

  // Modal nova anotação
  const [showNovaAnotacao, setShowNovaAnotacao] = useState(false);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [salvandoAnotacao, setSalvandoAnotacao] = useState(false);

  // Modal nova ficha
  const [showNovaFicha, setShowNovaFicha] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<number | null>(null);
  const [searchPaciente, setSearchPaciente] = useState("");
  const [salvandoFicha, setSalvandoFicha] = useState(false);
  const [erroFicha, setErroFicha] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoModal, setCarregandoModal] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    setCarregando(true);
    fetch(`${API_URL}/api/fichas/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data: FichaClinica[]) => setFichas(data))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

async function abrirModalNovaFicha() {
  const token = getToken();
  console.log("TOKEN:", token);
  if (!token) return;

  setPacienteSelecionado(null);
  setSearchPaciente("");
  setErroFicha(null);
  setPacientes([]);
  setCarregandoModal(true);
  setShowNovaFicha(true);

 const [resPacientes, resFichas] = await Promise.all([
  fetch(`${API_URL}/api/pacientes/listar/`, { headers: { Authorization: `Token ${token}` } }),
  fetch(`${API_URL}/api/fichas/`, { headers: { Authorization: `Token ${token}` } }),
]);

  console.log("STATUS pacientes:", resPacientes.status);
  console.log("STATUS fichas:", resFichas.status);

  const [todosPacientes, todasFichas]: [Paciente[], FichaClinica[]] = await Promise.all([
    resPacientes.json(),
    resFichas.json(),
  ]);

  console.log("PACIENTES:", todosPacientes);
  console.log("FICHAS:", todasFichas);

  const comFicha = new Set(todasFichas.map((f) => Number(f.paciente)));
  setPacientes(todosPacientes.filter((p) => !comFicha.has(Number(p.id))));
  setCarregandoModal(false);
}

  async function criarFicha() {
    if (!pacienteSelecionado) return;
    const token = getToken();
    if (!token) return;

    setSalvandoFicha(true);
    setErroFicha(null);

    try {
      const res = await fetch(`${API_URL}/api/fichas/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paciente: pacienteSelecionado }),
      });

      const data = await res.json();

      if (res.ok) {
        const novaFicha: FichaClinica = data.ficha;
        setFichas((prev) => [novaFicha, ...prev]);
        setShowNovaFicha(false);
        setSelectedFicha(novaFicha);
        setActiveTab("evolucoes");
      } else {
        const mensagemErro =
          data?.erro?.paciente?.[0] ||
          data?.erro?.non_field_errors?.[0] ||
          "Erro ao criar ficha clínica.";
        setErroFicha(mensagemErro);
      }
    } catch {
      setErroFicha("Erro de conexão. Tente novamente.");
    }

    setSalvandoFicha(false);
  }

  async function salvarAnotacao() {
    if (!novaAnotacao.trim() || !selectedFicha) return;
    const token = getToken();
    if (!token) return;

    setSalvandoAnotacao(true);
    try {
      const res = await fetch(`${API_URL}/api/fichas/${selectedFicha.id}/anotacoes/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conteudo: novaAnotacao }),
      });

      if (res.ok) {
        const resData = await res.json();
        const anotacaoNova: Anotacao = resData.anotacao;
        const fichaAtualizada: FichaClinica = {
          ...selectedFicha,
          anotacoes: [anotacaoNova, ...selectedFicha.anotacoes],
        };
        setSelectedFicha(fichaAtualizada);
        setFichas((prev) =>
          prev.map((f) => (f.id === fichaAtualizada.id ? fichaAtualizada : f))
        );
        setNovaAnotacao("");
        setShowNovaAnotacao(false);
      }
    } catch {}
    setSalvandoAnotacao(false);
  }

    function formatarData(data: string) {
      if (!data) return "";
      const apenasData = data.split("T")[0];
      const [ano, mes, dia] = apenasData.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    function formatarHora(hora: string) {
      if (!hora) return "";
      if (hora.includes("T")) {
        return hora.split("T")[1].slice(0, 5);
      }
      return hora.slice(0, 5);
    }

  const fichasFiltradas = fichas.filter((f) =>
    f.paciente_nome.toLowerCase().includes(search.toLowerCase())
  );

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchPaciente.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Fichas Clínicas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Fichas clínicas e anotações de evolução</p>
      </div>

      {!selectedFicha ? (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Buscar paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={abrirModalNovaFicha}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus size={15} /> Nova Ficha
            </button>
          </div>

          {carregando ? (
            <p className="text-sm text-muted-foreground text-center py-10">Carregando fichas...</p>
          ) : fichasFiltradas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhuma ficha clínica encontrada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fichasFiltradas.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedFicha(f); setActiveTab("evolucoes"); }}
                  className="bg-card rounded-xl border border-border shadow-sm p-5 text-left hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {f.paciente_nome.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{f.paciente_nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ficha aberta em {formatarData(f.data_criacao)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </div>
                  <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Anotações</p>
                      <p className="text-sm font-medium">{f.anotacoes.length}</p>
                    </div>
                    {f.anotacoes.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Última evolução</p>
                        <p className="text-sm font-medium">{formatarData(f.anotacoes[0].data)}</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedFicha(null)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  ← Voltar
                </button>
                <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {selectedFicha.paciente_nome.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{selectedFicha.paciente_nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Ficha aberta em {formatarData(selectedFicha.data_criacao)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNovaAnotacao(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={15} /> Nova Anotação
              </button>
            </div>
          </div>

          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
            {([
              { key: "evolucoes", label: "Anotações", icon: Activity },
              { key: "avaliacao", label: "Dados da Ficha", icon: Clipboard },
            ] as { key: TabType; label: string; icon: typeof Activity }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "evolucoes" && (
            <div className="space-y-4">
              {selectedFicha.anotacoes.length === 0 ? (
                <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center">
                  <p className="text-muted-foreground text-sm">Nenhuma anotação registrada ainda.</p>
                  <button
                    onClick={() => setShowNovaAnotacao(true)}
                    className="mt-3 text-sm text-primary font-medium hover:underline"
                  >
                    Adicionar primeira anotação
                  </button>
                </div>
              ) : (
                selectedFicha.anotacoes.map((a, i) => (
                  <div key={a.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-bold">
                            #{selectedFicha.anotacoes.length - i}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {formatarData(a.data)} às {formatarHora(a.hora)}
                          </p>
                          <p className="text-xs text-muted-foreground">{a.colaborador_nome}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Evolução</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{a.conteudo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "avaliacao" && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
              <h3 className="font-semibold">Dados da Ficha Clínica</h3>
              <div className="divide-y divide-border">
                {[
                  { label: "Paciente", value: selectedFicha.paciente_nome },
                  { label: "ID da Ficha", value: `#${selectedFicha.id}` },
                  { label: "Data de abertura", value: formatarData(selectedFicha.data_criacao) },
                  { label: "Total de anotações", value: String(selectedFicha.anotacoes.length) },
                  {
                    label: "Última anotação",
                    value:
                      selectedFicha.anotacoes.length > 0
                        ? `${formatarData(selectedFicha.anotacoes[0].data)} às ${formatarHora(selectedFicha.anotacoes[0].hora)}`
                        : "Nenhuma ainda",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-3">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal nova ficha */}
      {showNovaFicha && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowNovaFicha(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md m-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Nova Ficha Clínica</h2>
              <button onClick={() => setShowNovaFicha(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 flex-1 overflow-y-auto">
              <p className="text-sm text-muted-foreground">Selecione o paciente para abrir a ficha:</p>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Buscar paciente..."
                  value={searchPaciente}
                  onChange={(e) => setSearchPaciente(e.target.value)}
                />
              </div>

              {erroFicha && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{erroFicha}</p>
              )}

              <div className="space-y-2">
                {pacientesFiltrados.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {carregandoModal
                      ? "Carregando pacientes..."
                      : pacientes.length === 0
                      ? "Todos os pacientes já possuem ficha clínica."
                      : "Nenhum paciente encontrado."}
                  </p>
                ) : (
                  pacientesFiltrados.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPacienteSelecionado(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        pacienteSelecionado === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 bg-card"
                      }`}
                    >
                      <div className="size-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {p.nome.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.cpf}</p>
                      </div>
                      {pacienteSelecionado === p.id && (
                        <div className="size-4 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 p-5 border-t border-border">
              <button
                onClick={() => setShowNovaFicha(false)}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={criarFicha}
                disabled={!pacienteSelecionado || salvandoFicha}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvandoFicha ? "Criando..." : "Criar Ficha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova anotação */}
      {showNovaAnotacao && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowNovaAnotacao(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold">Nova Anotação — {selectedFicha?.paciente_nome}</h2>
              <button onClick={() => setShowNovaAnotacao(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Conteúdo da anotação
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none"
                  rows={8}
                  placeholder="Descreva a evolução do paciente, técnicas utilizadas, queixas, conduta..."
                  value={novaAnotacao}
                  onChange={(e) => setNovaAnotacao(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowNovaAnotacao(false)}
                  className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarAnotacao}
                  disabled={salvandoAnotacao || !novaAnotacao.trim()}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvandoAnotacao ? "Salvando..." : "Salvar Anotação"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}