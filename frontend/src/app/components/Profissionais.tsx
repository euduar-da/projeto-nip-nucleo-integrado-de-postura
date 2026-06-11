import { useState } from "react";
import { Plus, X, Phone, Mail, Award, Users } from "lucide-react";

const profissionais = [
  {
    id: 1,
    nome: "Dr. Carlos Souza",
    crefito: "CREFITO-3 / 45.678-F",
    especialidade: "Ortopedia e Traumatologia",
    email: "carlos.souza@clinica.com",
    telefone: "(11) 98001-1111",
    pacientes: 12,
    sessoesMes: 68,
    foto: null,
    horarios: ["Seg 08:00–17:00", "Ter 08:00–17:00", "Qua 08:00–12:00", "Qui 08:00–17:00", "Sex 08:00–16:00"],
    especialidades: ["Coluna", "Joelho", "Ombro", "RPG"],
    bio: "Fisioterapeuta com 12 anos de experiência em reabilitação ortopédica e esportiva. Especialista em disfunções da coluna vertebral e RPG.",
  },
  {
    id: 2,
    nome: "Dra. Patrícia Lima",
    crefito: "CREFITO-3 / 52.341-F",
    especialidade: "Fisioterapia Esportiva",
    email: "patricia.lima@clinica.com",
    telefone: "(11) 98002-2222",
    pacientes: 9,
    sessoesMes: 51,
    foto: null,
    horarios: ["Seg 09:00–18:00", "Ter 09:00–18:00", "Qui 09:00–18:00", "Sex 09:00–17:00"],
    especialidades: ["Esportiva", "Joelho", "Tornozelo", "Prevenção de lesões"],
    bio: "Especialista em fisioterapia esportiva com formação em biomecânica. Atende atletas amadores e profissionais.",
  },
  {
    id: 3,
    nome: "Dra. Juliana Reis",
    crefito: "CREFITO-3 / 61.890-F",
    especialidade: "Neurologia",
    email: "juliana.reis@clinica.com",
    telefone: "(11) 98003-3333",
    pacientes: 7,
    sessoesMes: 42,
    foto: null,
    horarios: ["Seg 07:00–14:00", "Qua 07:00–14:00", "Qui 07:00–14:00", "Sex 07:00–13:00"],
    especialidades: ["AVC", "Parkinson", "Esclerose Múltipla", "Equilíbrio"],
    bio: "Neurológia com foco em reabilitação de pacientes pós-AVC e doenças neurológicas degenerativas. Formação internacional em neuromodulação.",
  },
];

export function Profissionais() {
  const [selected, setSelected] = useState<(typeof profissionais)[0] | null>(null);
  const [showNew, setShowNew] = useState(false);

  const cores = ["#0e7490", "#7c3aed", "#d97706"];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profissionais</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{profissionais.length} fisioterapeutas ativos</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Novo Profissional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {profissionais.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="bg-card rounded-xl border border-border shadow-sm p-5 text-left hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="size-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: cores[i] + "20" }}>
                <span className="text-lg font-bold" style={{ color: cores[i] }}>
                  {p.nome.replace("Dr. ", "").replace("Dra. ", "").split(" ").map(w => w[0]).slice(0,2).join("")}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{p.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.especialidade}</p>
                <p className="text-xs text-muted-foreground">{p.crefito}</p>
              </div>
            </div>

            <div className="flex gap-4 py-4 border-t border-border">
              <div className="flex-1 text-center">
                <p className="text-xl font-semibold" style={{ color: cores[i] }}>{p.pacientes}</p>
                <p className="text-xs text-muted-foreground">Pacientes</p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1 text-center">
                <p className="text-xl font-semibold" style={{ color: cores[i] }}>{p.sessoesMes}</p>
                <p className="text-xs text-muted-foreground">Sessões/mês</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {p.especialidades.slice(0,3).map((e) => (
                <span key={e} className="text-xs px-2 py-0.5 rounded-md" style={{ background: cores[i] + "15", color: cores[i] }}>{e}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total de Atendimentos / Mês", value: "161" },
          { label: "Média por Profissional", value: "53,7" },
          { label: "Pacientes em Tratamento", value: "28" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border shadow-sm p-4 text-center">
            <p className="text-2xl font-semibold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" onClick={() => setSelected(null)}>
          <div className="bg-card h-full w-full max-w-md shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-semibold">Perfil do Profissional</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {selected.nome.replace("Dr. ", "").replace("Dra. ", "").split(" ").map(w => w[0]).slice(0,2).join("")}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selected.nome}</h3>
                  <p className="text-sm text-muted-foreground">{selected.especialidade}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Award size={12} /> {selected.crefito}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{selected.bio}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Phone size={11} /> Telefone</p>
                  <p className="text-sm font-medium">{selected.telefone}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail size={11} /> E-mail</p>
                  <p className="text-sm font-medium truncate">{selected.email}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Users size={14} /> Dados do Mês</p>
                <div className="flex gap-4">
                  <div className="flex-1 bg-secondary rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-primary">{selected.pacientes}</p>
                    <p className="text-xs text-muted-foreground">Pacientes</p>
                  </div>
                  <div className="flex-1 bg-secondary rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-primary">{selected.sessoesMes}</p>
                    <p className="text-xs text-muted-foreground">Sessões</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.especialidades.map((e) => (
                    <span key={e} className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-md">{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Horários de Atendimento</p>
                <div className="space-y-1.5">
                  {selected.horarios.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-sm">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New professional modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNew(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Novo Profissional</h2>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Nome completo", placeholder: "Nome do profissional" },
                { label: "CREFITO", placeholder: "CREFITO-3 / 00.000-F" },
                { label: "Especialidade", placeholder: "Área de especialização" },
                { label: "E-mail profissional", placeholder: "email@clinica.com" },
                { label: "Telefone", placeholder: "(00) 00000-0000" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                  <input className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background" placeholder={f.placeholder} />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors">Cancelar</button>
                <button onClick={() => setShowNew(false)} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Cadastrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
