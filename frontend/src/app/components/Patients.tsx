import { useState } from "react";
import { Search, Plus, Filter, Phone, Mail, ChevronRight, X, User, Calendar, FileText } from "lucide-react";

const patients = [
  { id: 1, nome: "Ana Luiza Ferreira", cpf: "082.453.221-09", nascimento: "14/03/1985", telefone: "(11) 98765-4321", email: "ana.ferreira@email.com", convenio: "Unimed", diagnostico: "Lombalgia crônica", terapeuta: "Dr. Carlos Souza", sessoes: 12, total: 20, status: "ativo", inicio: "10/03/2026" },
  { id: 2, nome: "Roberto Almeida", cpf: "134.561.890-55", nascimento: "22/07/1970", telefone: "(11) 97654-3210", email: "roberto.almeida@email.com", convenio: "Amil", diagnostico: "Pós-op joelho direito", terapeuta: "Dra. Patrícia Lima", sessoes: 8, total: 30, status: "ativo", inicio: "02/05/2026" },
  { id: 3, nome: "Fernanda Costa", cpf: "219.876.543-12", nascimento: "05/11/1992", telefone: "(11) 96543-2109", email: "fernanda.costa@email.com", convenio: "Particular", diagnostico: "RPG – postura", terapeuta: "Dr. Carlos Souza", sessoes: 6, total: 10, status: "ativo", inicio: "01/04/2026" },
  { id: 4, nome: "Marcos Oliveira", cpf: "304.987.654-33", nascimento: "30/01/1960", telefone: "(11) 95432-1098", email: "marcos.oliveira@email.com", convenio: "SulAmérica", diagnostico: "AVC – sequela motora", terapeuta: "Dra. Juliana Reis", sessoes: 20, total: 40, status: "ativo", inicio: "15/01/2026" },
  { id: 5, nome: "Camila Santos", cpf: "387.654.321-77", nascimento: "18/09/1998", telefone: "(11) 94321-0987", email: "camila.santos@email.com", convenio: "Bradesco Saúde", diagnostico: "Lesão ligamentar tornozelo", terapeuta: "Dra. Patrícia Lima", sessoes: 4, total: 12, status: "ativo", inicio: "20/05/2026" },
  { id: 6, nome: "Diego Mendes", cpf: "451.234.567-88", nascimento: "12/04/1978", telefone: "(11) 93210-9876", email: "diego.mendes@email.com", convenio: "Unimed", diagnostico: "Cervicalgia", terapeuta: "Dr. Carlos Souza", sessoes: 10, total: 10, status: "alta", inicio: "10/02/2026" },
  { id: 7, nome: "Lúcia Pereira", cpf: "532.109.876-44", nascimento: "25/06/1955", telefone: "(11) 92109-8765", email: "lucia.pereira@email.com", convenio: "Particular", diagnostico: "Osteoartrite quadril", terapeuta: "Dra. Juliana Reis", sessoes: 2, total: 24, status: "ativo", inicio: "05/06/2026" },
  { id: 8, nome: "Paulo Henrique Barros", cpf: "678.543.210-11", nascimento: "07/12/1988", telefone: "(11) 91098-7654", email: "paulo.barros@email.com", convenio: "Amil", diagnostico: "Hérnia de disco L4-L5", terapeuta: "Dr. Carlos Souza", sessoes: 15, total: 20, status: "ativo", inicio: "12/03/2026" },
];

const convenios = ["Todos", "Unimed", "Amil", "Particular", "SulAmérica", "Bradesco Saúde"];

export function Patients() {
  const [search, setSearch] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selected, setSelected] = useState<(typeof patients)[0] | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = patients.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search);
    const matchConvenio = selectedConvenio === "Todos" || p.convenio === selectedConvenio;
    const matchStatus = selectedStatus === "Todos" || p.status === selectedStatus.toLowerCase();
    return matchSearch && matchConvenio && matchStatus;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{patients.length} pacientes cadastrados</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Novo Paciente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={selectedConvenio}
          onChange={(e) => setSelectedConvenio(e.target.value)}
        >
          {convenios.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {["Todos", "Ativo", "Alta"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Paciente", "CPF", "Convênio", "Diagnóstico", "Terapeuta", "Sessões", "Status", ""].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(p)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">{p.nome.split(" ").map(w => w[0]).slice(0,2).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.nascimento}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{p.cpf}</td>
                <td className="px-4 py-3 text-sm">{p.convenio}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-36 truncate">{p.diagnostico}</td>
                <td className="px-4 py-3 text-sm">{p.terapeuta}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(p.sessoes / p.total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{p.sessoes}/{p.total}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.status === "ativo" ? "Ativo" : "Alta"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight size={16} className="text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Patient Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" onClick={() => setSelected(null)}>
          <div className="bg-card h-full w-full max-w-md shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold">Ficha do Paciente</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">{selected.nome.split(" ").map(w => w[0]).slice(0,2).join("")}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selected.nome}</h3>
                  <p className="text-sm text-muted-foreground">{selected.diagnostico}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${selected.status === "ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {selected.status === "ativo" ? "Ativo" : "Alta"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User, label: "CPF", value: selected.cpf },
                  { icon: Calendar, label: "Nascimento", value: selected.nascimento },
                  { icon: Phone, label: "Telefone", value: selected.telefone },
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

              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Convênio</p>
                <p className="text-sm font-medium">{selected.convenio}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Progresso do Tratamento</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(selected.sessoes / selected.total) * 100}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">{selected.sessoes}/{selected.total} sessões</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Início: {selected.inicio}</span>
                  <span className="text-xs text-primary font-medium">{Math.round((selected.sessoes / selected.total) * 100)}% concluído</span>
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Fisioterapeuta Responsável</p>
                <p className="text-sm font-medium">{selected.terapeuta}</p>
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

      {/* New Patient Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNew(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Novo Paciente</h2>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Nome completo", placeholder: "Nome do paciente", span: 2 },
                  { label: "CPF", placeholder: "000.000.000-00" },
                  { label: "Data de nascimento", placeholder: "DD/MM/AAAA" },
                  { label: "Telefone", placeholder: "(00) 00000-0000" },
                  { label: "E-mail", placeholder: "email@exemplo.com" },
                ].map((field) => (
                  <div key={field.label} className={field.span === 2 ? "col-span-2" : ""}>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                    <input className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background" placeholder={field.placeholder} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Convênio</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background">
                  {convenios.slice(1).map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Diagnóstico / Queixa principal</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none" rows={3} placeholder="Descreva o diagnóstico ou queixa principal..." />
              </div>
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
