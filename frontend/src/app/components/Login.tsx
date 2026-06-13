import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield } from "lucide-react";
import { motion } from "motion/react";

type LoginProps = {
  onLogin: () => void;
};

const features = [
  "Prontuário eletrônico completo",
  "Agenda inteligente com notificações",
  "Relatórios financeiros em tempo real",
  "Acesso seguro por perfil de usuário",
];

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0c6478 0%, #0e7490 45%, #0891b2 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full opacity-10" style={{ background: "#ffffff" }} />
        <div className="absolute -top-20 -right-20 size-72 rounded-full opacity-10" style={{ background: "#ffffff" }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl overflow-hidden bg-white/20 shrink-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">NIP</span>
            </div>
            <div>
              <p className="font-bold text-white tracking-wide">NIP</p>
              <p className="text-xs text-white/60">Sistema de Gestão</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-4">Bem-vindo ao NIP</p>
              <h1 className="text-4xl font-bold text-white leading-tight mb-5">Núcleo Integrado<br />de Postura.</h1>
              <p className="text-white/70 text-base leading-relaxed max-w-sm">
                Organize pacientes, prontuários, agendamentos e finanças em um único lugar — com segurança e praticidade.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mt-10 space-y-3"
            >
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="size-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <div className="size-2 rounded-full bg-white" />
                  </div>
                  <span className="text-white/80 text-sm">{feature}</span>
                </div>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
              className="mt-10 flex justify-end"
            >
              <div className="size-36 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">NIP</span>
              </div>
            </motion.div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-3 w-fit">
            <Shield size={14} className="text-white/70" />
            <span className="text-xs text-white/70">Dados protegidos conforme LGPD</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="size-9 rounded-xl overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">NIP</span>
            </div>
            <div>
              <p className="font-bold text-foreground tracking-wide">NIP</p>
              <p className="text-xs text-muted-foreground">Núcleo Integrado de Postura</p>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Acessar sistema</h2>
            <p className="text-muted-foreground text-sm mt-1">Entre com suas credenciais para continuar</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <button type="button" className="text-xs text-primary hover:underline font-medium">
                  Esqueci a senha
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="size-4 rounded border-border accent-primary cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                Manter conectado
              </label>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
          <div className="mt-6 bg-secondary/60 rounded-xl px-4 py-3 border border-secondary">
            <p className="text-xs font-medium text-secondary-foreground mb-1">Acesso demonstração</p>
            <p className="text-xs text-muted-foreground">
              E-mail: <span className="font-mono font-medium text-foreground">admin@nip.com</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Senha: <span className="font-mono font-medium text-foreground">nip2026</span>
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Problemas de acesso?{' '}
            <button className="text-primary font-medium hover:underline">Contate o suporte</button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
