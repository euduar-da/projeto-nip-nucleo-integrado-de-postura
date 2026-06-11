import { Users, Calendar, Activity, TrendingUp, Clock, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const statsData = [
  { mes: "Jan", atendimentos: 142, novos: 18 },
  { mes: "Fev", atendimentos: 158, novos: 22 },
  { mes: "Mar", atendimentos: 175, novos: 26 },
  { mes: "Abr", atendimentos: 163, novos: 19 },
  { mes: "Mai", atendimentos: 192, novos: 31 },
  { mes: "Jun", atendimentos: 187, novos: 28 },
];

const appointmentsToday = [
  { hora: "08:00", paciente: "Ana Luiza Ferreira", terapeuta: "Dr. Carlos Souza", tipo: "Coluna lombar", status: "confirmado" },
  { hora: "09:00", paciente: "Roberto Almeida", terapeuta: "Dra. Patrícia Lima", tipo: "Reabilitação pós-op", status: "em_andamento" },
  { hora: "09:30", paciente: "Fernanda Costa", terapeuta: "Dr. Carlos Souza", tipo: "RPG", status: "aguardando" },
  { hora: "10:30", paciente: "Marcos Oliveira", terapeuta: "Dra. Juliana Reis", tipo: "Neurológica", status: "confirmado" },
  { hora: "11:00", paciente: "Camila Santos", terapeuta: "Dra. Patrícia Lima", tipo: "Esportiva", status: "aguardando" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmado: { label: "Confirmado", color: "#0e7490", bg: "#e0f2f7" },
  em_andamento: { label: "Em andamento", color: "#059669", bg: "#d1fae5" },
  aguardando: { label: "Aguardando", color: "#d97706", bg: "#fef3c7" },
};

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Painel Geral</h1>
        <p className="text-muted-foreground mt-0.5">Quinta-feira, 11 de junho de 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pacientes Ativos", value: "284", icon: Users, change: "+12 este mês", color: "#0e7490", bg: "#e0f2f7" },
          { label: "Agendamentos Hoje", value: "18", icon: Calendar, change: "3 pendentes", color: "#059669", bg: "#d1fae5" },
          { label: "Atendimentos / Mês", value: "187", icon: Activity, change: "+8% vs mês ant.", color: "#7c3aed", bg: "#ede9fe" },
          { label: "Taxa de Retorno", value: "76%", icon: TrendingUp, change: "+3% vs mês ant.", color: "#d97706", bg: "#fef3c7" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Evolução de Atendimentos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={statsData}>
              <defs>
                <linearGradient id="colorAtend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0e7490" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0e7490" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
              <Area type="monotone" dataKey="atendimentos" stroke="#0e7490" strokeWidth={2} fill="url(#colorAtend)" name="Atendimentos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Novos pacientes */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Novos Pacientes / Mês</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statsData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
              <Bar dataKey="novos" fill="#0e7490" radius={[4, 4, 0, 0]} name="Novos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Agenda de Hoje</h3>
          <button className="text-sm text-primary flex items-center gap-1 hover:underline">
            Ver completa <ChevronRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-border">
          {appointmentsToday.map((apt, i) => {
            const s = statusConfig[apt.status];
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors">
                <div className="w-14 shrink-0">
                  <span className="text-sm font-medium text-foreground">{apt.hora}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{apt.paciente}</p>
                  <p className="text-xs text-muted-foreground">{apt.tipo} · {apt.terapeuta}</p>
                </div>
                <span
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ color: s.color, background: s.bg }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Próximos Vencimentos
          </h3>
          {[
            { nome: "João Pedro Nunes", data: "Hoje", plano: "Convenio Saúde Plus" },
            { nome: "Mariana Vieira", data: "Amanhã", plano: "Particular" },
            { nome: "Lucas Rodrigues", data: "13/06", plano: "Unimed" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.nome}</p>
                <p className="text-xs text-muted-foreground">{item.plano}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.data === "Hoje" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{item.data}</span>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" /> Últimas Altas
          </h3>
          {[
            { nome: "Sandra Meireles", data: "10/06", sessoes: 24 },
            { nome: "Felipe Gonçalves", data: "09/06", sessoes: 16 },
            { nome: "Beatriz Cunha", data: "08/06", sessoes: 30 },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.nome}</p>
                <p className="text-xs text-muted-foreground">{item.sessoes} sessões realizadas</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.data}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
