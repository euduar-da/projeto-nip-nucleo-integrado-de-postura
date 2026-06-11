import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const receitaMensal = [
  { mes: "Jan", receita: 28400, despesa: 12100 },
  { mes: "Fev", receita: 31200, despesa: 11800 },
  { mes: "Mar", receita: 34800, despesa: 13200 },
  { mes: "Abr", receita: 32100, despesa: 12600 },
  { mes: "Mai", receita: 38500, despesa: 14100 },
  { mes: "Jun", receita: 36200, despesa: 13400 },
];

const convenioData = [
  { name: "Unimed", value: 38, color: "#0e7490" },
  { name: "Amil", value: 22, color: "#0891b2" },
  { name: "Particular", value: 20, color: "#7c3aed" },
  { name: "Bradesco", value: 12, color: "#d97706" },
  { name: "SulAmérica", value: 8, color: "#059669" },
];

const recebimentos = [
  { paciente: "Ana Luiza Ferreira", valor: "R$ 280,00", data: "10/06/2026", convenio: "Unimed", status: "pago" },
  { paciente: "Roberto Almeida", valor: "R$ 320,00", data: "09/06/2026", convenio: "Amil", status: "pago" },
  { paciente: "Fernanda Costa", valor: "R$ 240,00", data: "08/06/2026", convenio: "Particular", status: "pendente" },
  { paciente: "Marcos Oliveira", valor: "R$ 280,00", data: "08/06/2026", convenio: "SulAmérica", status: "pago" },
  { paciente: "Camila Santos", valor: "R$ 300,00", data: "07/06/2026", convenio: "Bradesco", status: "atrasado" },
  { paciente: "Paulo Henrique Barros", valor: "R$ 240,00", data: "07/06/2026", convenio: "Amil", status: "pago" },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pago: { label: "Pago", color: "#059669", bg: "#d1fae5" },
  pendente: { label: "Pendente", color: "#d97706", bg: "#fef3c7" },
  atrasado: { label: "Atrasado", color: "#dc2626", bg: "#fee2e2" },
};

export function Financeiro() {
  const totalReceita = receitaMensal[receitaMensal.length - 1].receita;
  const totalDespesa = receitaMensal[receitaMensal.length - 1].despesa;
  const lucro = totalReceita - totalDespesa;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Junho de 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita do Mês", value: `R$ ${totalReceita.toLocaleString("pt-BR")}`, icon: TrendingUp, color: "#059669", bg: "#d1fae5", change: "+8% vs mai" },
          { label: "Despesas do Mês", value: `R$ ${totalDespesa.toLocaleString("pt-BR")}`, icon: TrendingDown, color: "#dc2626", bg: "#fee2e2", change: "-5% vs mai" },
          { label: "Lucro Líquido", value: `R$ ${lucro.toLocaleString("pt-BR")}`, icon: DollarSign, color: "#0e7490", bg: "#e0f2f7", change: "+14% vs mai" },
          { label: "A Receber", value: "R$ 2.840,00", icon: AlertCircle, color: "#d97706", bg: "#fef3c7", change: "8 faturas" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: stat.bg }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-4">Receita vs Despesa</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={receitaMensal} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
              />
              <Bar dataKey="receita" fill="#0e7490" radius={[4, 4, 0, 0]} name="Receita" barSize={20} />
              <Bar dataKey="despesa" fill="#e0f2f7" radius={[4, 4, 0, 0]} name="Despesa" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - Convênios */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-4">Por Convênio</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={convenioData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {convenioData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {convenioData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs">{item.name}</span>
                </div>
                <span className="text-xs font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Últimos Recebimentos</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Paciente", "Valor", "Data", "Convênio", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recebimentos.map((r, i) => {
              const s = statusMap[r.status];
              return (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{r.paciente}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{r.valor}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.data}</td>
                  <td className="px-4 py-3 text-sm">{r.convenio}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
