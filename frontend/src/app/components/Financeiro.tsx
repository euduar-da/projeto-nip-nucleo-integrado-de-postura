import { useState, useEffect, type FormEvent } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

type Relatorio = {
  total_entrada: string;
  total_saida: string;
  lucro_liquido: string;
};

function limparToken(token: string) {
  return token
    .replace(/^Token\s+/i, "")
    .replace(/^Bearer\s+/i, "")
    .replace(/"/g, "")
    .trim();
}

function getToken() {
  const tokenDireto =
    localStorage.getItem("nip_token") ||
    localStorage.getItem("token");

  if (tokenDireto) {
    return limparToken(tokenDireto);
  }

  const usuarioSalvo =
    localStorage.getItem("nip_user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("usuario");

  if (usuarioSalvo) {
    try {
      const usuario = JSON.parse(usuarioSalvo);

      if (usuario?.token) {
        return limparToken(String(usuario.token));
      }
    } catch {
      return "";
    }
  }

  return "";
}


function formatBRL(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (!Number.isFinite(num)) {
    return "R$ 0,00";
  }

  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function Financeiro() {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [tipoTransacao, setTipoTransacao] = useState("entrada");
  const [valor, setValor] = useState("");
  const [dataMovimentacao, setDataMovimentacao] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [servico, setServico] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarRelatorio(mostrarLoading = false) {
    const token = getToken();

    if (!token) {
      setError("Usuário não autenticado. Faça login novamente.");
      setLoading(false);
      return;
    }

    if (mostrarLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch(`${API_URL}/api/relatorio/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (response.status === 403) {
        throw new Error("Acesso negado. Apenas colaboradores podem acessar o relatório financeiro.");
      }

      if (!response.ok) {
        throw new Error("Erro ao buscar relatório financeiro.");
      }

      setRelatorio(data);
      setError("");
    } catch (error) {
      console.error("Erro ao carregar relatório financeiro:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Não foi possível carregar os dados financeiros.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarRelatorio(true);
  }, []);

  async function cadastrarMovimentacao(event: FormEvent) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Usuário não autenticado. Faça login novamente.");
      return;
    }

    if (!valor || Number(valor) <= 0) {
      setError("Informe um valor válido.");
      return;
    }

    setSalvando(true);
    setError("");
    setSucesso("");

    try {
      const payload = {
        tipo_transacao: tipoTransacao,
        valor,
        data_movimentacao: dataMovimentacao,
        servico: servico ? Number(servico) : null,
      };

      const response = await fetch(`${API_URL}/api/movimentacoes/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (response.status === 403) {
        throw new Error("Acesso negado. Apenas colaboradores podem cadastrar movimentações.");
      }

      if (!response.ok) {
        console.error("Erro ao cadastrar movimentação:", data);
        throw new Error("Erro ao cadastrar movimentação financeira.");
      }

      setSucesso("Movimentação cadastrada com sucesso.");
      setTipoTransacao("entrada");
      setValor("");
      setDataMovimentacao(new Date().toISOString().split("T")[0]);
      setServico("");

      await carregarRelatorio();
    } catch (error) {
      console.error("Erro ao cadastrar movimentação:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Não foi possível cadastrar a movimentação.");
      }
    } finally {
      setSalvando(false);
    }
  }

  const totalReceita = relatorio ? parseFloat(relatorio.total_entrada) : 0;
  const totalDespesa = relatorio ? parseFloat(relatorio.total_saida) : 0;
  const lucro = relatorio ? parseFloat(relatorio.lucro_liquido) : 0;

  const mesAtual = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const mesCapitalizado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {mesCapitalizado}
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {sucesso && (
        <div className="bg-green-100 text-green-700 text-sm px-4 py-3 rounded-lg">
          {sucesso}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Receita Total",
            value: loading ? "..." : formatBRL(totalReceita),
            icon: TrendingUp,
            color: "#059669",
            bg: "#d1fae5",
            change: "Total de entradas",
          },
          {
            label: "Despesas Totais",
            value: loading ? "..." : formatBRL(totalDespesa),
            icon: TrendingDown,
            color: "#dc2626",
            bg: "#fee2e2",
            change: "Total de saídas",
          },
          {
            label: "Lucro Líquido",
            value: loading ? "..." : formatBRL(lucro),
            icon: DollarSign,
            color: lucro >= 0 ? "#0e7490" : "#dc2626",
            bg: lucro >= 0 ? "#e0f2f7" : "#fee2e2",
            change: lucro >= 0 ? "Resultado positivo" : "Resultado negativo",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl p-5 border border-border shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p
                  className="text-2xl font-semibold mt-1"
                  style={{ color: stat.color }}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin inline" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </div>

              <div className="rounded-lg p-2" style={{ background: stat.bg }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cadastro de movimentação */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">
            Cadastrar Movimentação
          </h3>
          <p className="text-sm text-muted-foreground">
            Registre uma entrada ou saída financeira.
          </p>
        </div>

        <form
          onSubmit={cadastrarMovimentacao}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <div>
            <label className="text-sm text-muted-foreground">Tipo</label>
            <select
              value={tipoTransacao}
              onChange={(event) => setTipoTransacao(event.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              placeholder="Ex: 150.00"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Data</label>
            <input
              type="date"
              value={dataMovimentacao}
              onChange={(event) => setDataMovimentacao(event.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>


          <div className="flex items-end">
            <button
              type="submit"
              disabled={salvando}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              {salvando ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Cadastrar"
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-4">
          Receita vs Despesa
        </h3>

        {loading ? (
          <div className="flex items-center justify-center h-[220px]">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                {
                  label: "Receita",
                  valor: totalReceita,
                  fill: "#0e7490",
                },
                {
                  label: "Despesa",
                  valor: totalDespesa,
                  fill: "#e0f2f7",
                },
                {
                  label: "Lucro",
                  valor: lucro,
                  fill: lucro >= 0 ? "#059669" : "#dc2626",
                },
              ]}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  `R$${(Number(value) / 1000).toFixed(0)}k`
                }
              />

              <Tooltip
                formatter={(value: number) => [formatBRL(value), ""]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 13,
                }}
              />

              <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={40}>
                {[
                  { fill: "#0e7490" },
                  { fill: "#e0f2f7" },
                  { fill: lucro >= 0 ? "#059669" : "#dc2626" },
                ].map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

        

      {/* Resumo financeiro */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Resumo Financeiro</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">
              Carregando...
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[
              {
                label: "Total de Entradas",
                value: formatBRL(totalReceita),
                color: "#059669",
              },
              {
                label: "Total de Saídas",
                value: formatBRL(totalDespesa),
                color: "#dc2626",
              },
              {
                label: "Lucro Líquido",
                value: formatBRL(lucro),
                color: lucro >= 0 ? "#0e7490" : "#dc2626",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-4"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: item.color }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && totalReceita === 0 && totalDespesa === 0 && (
        <div className="bg-secondary/50 rounded-xl px-5 py-4 text-sm text-muted-foreground text-center">
          Nenhuma movimentação financeira cadastrada ainda. Cadastre uma
          movimentação acima para visualizar os dados.
        </div>
      )}
    </div>
  );
}