import { useState } from "react";
import { Search, Plus, ChevronRight, X, FileText, Activity, Clipboard, Dumbbell } from "lucide-react";

const pacientes = [
  { id: 1, nome: "Ana Luiza Ferreira", terapeuta: "Dr. Carlos Souza", diagnostico: "Lombalgia crônica", ultimaSessao: "10/06/2026", totalSessoes: 12 },
  { id: 2, nome: "Roberto Almeida", terapeuta: "Dra. Patrícia Lima", diagnostico: "Pós-op joelho direito", ultimaSessao: "09/06/2026", totalSessoes: 8 },
  { id: 3, nome: "Marcos Oliveira", terapeuta: "Dra. Juliana Reis", diagnostico: "AVC – sequela motora", ultimaSessao: "08/06/2026", totalSessoes: 20 },
  { id: 4, nome: "Paulo Henrique Barros", terapeuta: "Dr. Carlos Souza", diagnostico: "Hérnia de disco L4-L5", ultimaSessao: "07/06/2026", totalSessoes: 15 },
];

const sessoes = [
  {
    id: 1,
    data: "10/06/2026",
    hora: "08:00",
    numero: 12,
    terapeuta: "Dr. Carlos Souza",
    queixas: "Dor lombar moderada (EVA 4/10) ao final do dia e ao levantar.",
    objetivos: "Redução da dor, fortalecimento do core, orientação postural.",
    tecnicas: ["TENS lombar 20min", "Mobilização articular L4-L5", "Exercícios de estabilização central", "Alongamento cadeia posterior"],
    evolucao: "Paciente relata melhora gradual. EVA reduziu de 6 para 4. Realizou todos os exercícios sem compensação.",
    conduta: "Manter protocolo atual. Incluir treino proprioceptivo na próxima sessão.",
    proxima: "13/06/2026 às 08:00",
  },
  {
    id: 2,
    data: "07/06/2026",
    hora: "08:00",
    numero: 11,
    terapeuta: "Dr. Carlos Souza",
    queixas: "Dor lombar intensa pela manhã (EVA 6/10). Relata dificuldade para calçar sapatos.",
    objetivos: "Controle da dor e mobilidade lombar.",
    tecnicas: ["Termoterapia (bolsa quente) 15min", "TENS 20min", "Mobilização articular suave", "Exercícios respiratórios"],
    evolucao: "Paciente com postura antálgica ao início. Após técnicas, melhora parcial da dor (EVA 6→5).",
    conduta: "Progredir exercícios de fortalecimento na próxima sessão.",
    proxima: "10/06/2026 às 08:00",
  },
];

type TabType = "evolucoes" | "avaliacao" | "exercicios";

export function Prontuario() {
  const [search, setSearch] = useState("");
  const [selectedPaciente, setSelectedPaciente] = useState<(typeof pacientes)[0] | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("evolucoes");
  const [showNew, setShowNew] = useState(false);

  const filtered = pacientes.filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Prontuário Eletrônico</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Registros de evolução e histórico clínico</p>
      </div>

      {!selectedPaciente ? (
        <>
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPaciente(p)}
                className="bg-card rounded-xl border border-border shadow-sm p-5 text-left hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">{p.nome.split(" ").map(w => w[0]).slice(0,2).join("")}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{p.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.diagnostico}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Última sessão</p>
                    <p className="text-sm font-medium">{p.ultimaSessao}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total de sessões</p>
                    <p className="text-sm font-medium">{p.totalSessoes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Terapeuta</p>
                    <p className="text-sm font-medium">{p.terapeuta.replace("Dr. ", "").replace("Dra. ", "")}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedPaciente(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  ← Voltar
                </button>
                <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{selectedPaciente.nome.split(" ").map(w => w[0]).slice(0,2).join("")}</span>
                </div>
                <div>
                  <p className="font-semibold">{selectedPaciente.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedPaciente.diagnostico}</p>
                </div>
              </div>
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={15} /> Nova Evolução
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
            {([
              { key: "evolucoes", label: "Evoluções", icon: Activity },
              { key: "avaliacao", label: "Avaliação Inicial", icon: Clipboard },
              { key: "exercicios", label: "Exercícios", icon: Dumbbell },
            ] as { key: TabType; label: string; icon: typeof Activity }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "evolucoes" && (
            <div className="space-y-4">
              {sessoes.map((s) => (
                <div key={s.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-bold">#{s.numero}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.data} às {s.hora}</p>
                        <p className="text-xs text-muted-foreground">{s.terapeuta}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Próxima: {s.proxima}</span>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">Queixas</p>
                        <p className="text-sm text-foreground">{s.queixas}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">Objetivos</p>
                        <p className="text-sm text-foreground">{s.objetivos}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Técnicas Utilizadas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.tecnicas.map((t) => (
                            <span key={t} className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-md">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">Evolução</p>
                        <p className="text-sm text-foreground">{s.evolucao}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">Conduta</p>
                        <p className="text-sm text-foreground">{s.conduta}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "avaliacao" && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-semibold mb-5">Avaliação Fisioterapêutica Inicial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { titulo: "Diagnóstico Médico", texto: "Lombalgia crônica inespecífica com irradiação para MMII. Exame de RMN evidencia protrusão discal L4-L5." },
                  { titulo: "Diagnóstico Fisioterapêutico", texto: "Disfunção musculoesquelética lombar com déficit de estabilidade central e encurtamento de cadeia posterior." },
                  { titulo: "Queixa Principal", texto: "Dor lombar bilateral de caráter contínuo, EVA 7/10, com piora ao permanecer sentado por tempo prolongado e ao levantar objetos do chão." },
                  { titulo: "História Clínica", texto: "Paciente refere início dos sintomas há 3 anos. Tratamento conservador anterior sem sucesso. Sem cirurgias prévias. Sedentária." },
                  { titulo: "Exame Físico", texto: "Postura: hiperlordose lombar. Mobilidade: flexão 60° dolorosa, extensão 20°. Teste de Lasègue positivo à direita. SLR positivo." },
                  { titulo: "Objetivos do Tratamento", texto: "Redução da dor (EVA ≤ 2), fortalecimento do core, melhora da flexibilidade e orientação para atividades de vida diária." },
                ].map((item) => (
                  <div key={item.titulo}>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">{item.titulo}</p>
                    <p className="text-sm text-foreground">{item.texto}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Plano de Tratamento</p>
                <div className="flex flex-wrap gap-2">
                  {["Eletroterapia (TENS/FES)", "Termoterapia", "Mobilização articular", "Exercícios de estabilização", "Cinesioterapia", "Orientação postural"].map((t) => (
                    <span key={t} className="text-sm px-3 py-1 bg-secondary text-secondary-foreground rounded-lg">{t}</span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">Frequência: 3x/semana · Duração estimada: 20 sessões · Data de início: 10/03/2026</p>
              </div>
            </div>
          )}

          {activeTab === "exercicios" && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-semibold mb-5">Plano de Exercícios Domiciliares</h3>
              <div className="space-y-4">
                {[
                  { nome: "Alongamento de isquiotibiais", descricao: "Deite de costas, leve o joelho ao peito e estenda a perna. Segure 30s. Repita 3x cada lado.", series: "3x 30s", freq: "Diário" },
                  { nome: "Exercício de estabilização (dead bug)", descricao: "Deite de costas com joelhos a 90°. Estenda um braço e a perna oposta simultaneamente. Mantenha lombar no chão.", series: "3x 10 rep", freq: "2x ao dia" },
                  { nome: "Ponte (glute bridge)", descricao: "Deite de costas, pés no chão. Eleve o quadril formando uma linha reta. Segure 5s e desça.", series: "3x 15 rep", freq: "Diário" },
                  { nome: "Cat-cow", descricao: "Em quatro apoios, alterne entre arqueamento e curvatura da coluna suavemente.", series: "3x 10 rep", freq: "2x ao dia" },
                ].map((ex) => (
                  <div key={ex.nome} className="border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{ex.nome}</p>
                        <p className="text-sm text-muted-foreground mt-1">{ex.descricao}</p>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <p className="text-xs font-medium text-primary">{ex.series}</p>
                        <p className="text-xs text-muted-foreground">{ex.freq}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Evolution Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNew(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold">Nova Evolução — {selectedPaciente?.nome}</h2>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Data</label>
                  <input type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background" defaultValue="2026-06-11" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Horário</label>
                  <input type="time" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background" defaultValue="08:00" />
                </div>
              </div>
              {[
                { label: "Queixas do paciente", placeholder: "Descreva as queixas relatadas pelo paciente nesta sessão..." },
                { label: "Objetivos da sessão", placeholder: "Objetivos terapêuticos para esta sessão..." },
                { label: "Técnicas utilizadas", placeholder: "Liste as técnicas e recursos utilizados..." },
                { label: "Evolução / Resposta ao tratamento", placeholder: "Descreva a resposta do paciente às técnicas..." },
                { label: "Conduta para próxima sessão", placeholder: "Plano para a próxima sessão..." },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                  <textarea className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none" rows={3} placeholder={f.placeholder} />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors">Cancelar</button>
                <button onClick={() => setShowNew(false)} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Salvar Evolução</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
