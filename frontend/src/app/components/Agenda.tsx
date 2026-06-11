import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Clock } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const HOURS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

type Appt = {
  id: number;
  hora: string;
  minutos: number;
  duracao: number;
  paciente: string;
  tipo: string;
  terapeuta: string;
  sala: string;
  status: "confirmado" | "aguardando" | "cancelado";
  cor: string;
};

const appointments: Record<number, Appt[]> = {
  11: [
    { id: 1, hora: "08:00", minutos: 0, duracao: 60, paciente: "Ana Luiza Ferreira", tipo: "Coluna lombar", terapeuta: "Dr. Carlos Souza", sala: "Sala 1", status: "confirmado", cor: "#0e7490" },
    { id: 2, hora: "09:00", minutos: 0, duracao: 60, paciente: "Roberto Almeida", tipo: "Reabilitação pós-op", terapeuta: "Dra. Patrícia Lima", sala: "Sala 2", status: "confirmado", cor: "#7c3aed" },
    { id: 3, hora: "09:00", minutos: 30, duracao: 60, paciente: "Fernanda Costa", tipo: "RPG", terapeuta: "Dr. Carlos Souza", sala: "Sala 3", status: "aguardando", cor: "#059669" },
    { id: 4, hora: "10:30", minutos: 30, duracao: 60, paciente: "Marcos Oliveira", tipo: "Neurológica", terapeuta: "Dra. Juliana Reis", sala: "Sala 1", status: "confirmado", cor: "#d97706" },
    { id: 5, hora: "14:00", minutos: 0, duracao: 60, paciente: "Camila Santos", tipo: "Esportiva", terapeuta: "Dra. Patrícia Lima", sala: "Sala 2", status: "aguardando", cor: "#7c3aed" },
    { id: 6, hora: "15:00", minutos: 0, duracao: 60, paciente: "Paulo Henrique Barros", tipo: "Hérnia de disco", terapeuta: "Dr. Carlos Souza", sala: "Sala 1", status: "confirmado", cor: "#0e7490" },
  ],
  12: [
    { id: 7, hora: "08:00", minutos: 0, duracao: 60, paciente: "Lúcia Pereira", tipo: "Osteoartrite", terapeuta: "Dra. Juliana Reis", sala: "Sala 1", status: "confirmado", cor: "#d97706" },
    { id: 8, hora: "10:00", minutos: 0, duracao: 60, paciente: "Diego Mendes", tipo: "Cervicalgia", terapeuta: "Dr. Carlos Souza", sala: "Sala 3", status: "aguardando", cor: "#059669" },
  ],
  13: [
    { id: 9, hora: "09:00", minutos: 0, duracao: 60, paciente: "Ana Luiza Ferreira", tipo: "Coluna lombar", terapeuta: "Dr. Carlos Souza", sala: "Sala 1", status: "confirmado", cor: "#0e7490" },
    { id: 10, hora: "11:00", minutos: 0, duracao: 60, paciente: "Marcos Oliveira", tipo: "Neurológica", terapeuta: "Dra. Juliana Reis", sala: "Sala 2", status: "confirmado", cor: "#d97706" },
  ],
};

const terapeutas = ["Todos", "Dr. Carlos Souza", "Dra. Patrícia Lima", "Dra. Juliana Reis"];

export function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 11));
  const [selectedDay, setSelectedDay] = useState(11);
  const [selectedAppt, setSelectedAppt] = useState<Appt | null>(null);
  const [terapeutaFilter, setTerapeutaFilter] = useState("Todos");
  const [showNew, setShowNew] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays: (number | null)[] = [...Array(firstDayOfMonth).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const dayAppts = (appointments[selectedDay] || []).filter(
    (a) => terapeutaFilter === "Todos" || a.terapeuta === terapeutaFilter
  );

  const statusColors = { confirmado: "#059669", aguardando: "#d97706", cancelado: "#dc2626" };

  const hourToY = (hora: string, mins: number) => {
    const [h] = hora.split(":").map(Number);
    return ((h - 7) * 60 + mins) * (56 / 60);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{MONTHS[month]} {year}</p>
        </div>
        <div className="flex gap-3">
          <select
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none"
            value={terapeutaFilter}
            onChange={(e) => setTerapeutaFilter(e.target.value)}
          >
            {terapeutas.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Agendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Mini calendar */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium">{MONTHS[month]} {year}</span>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((day, i) => (
              <button
                key={i}
                disabled={!day}
                onClick={() => day && setSelectedDay(day)}
                className={`aspect-square text-xs rounded-lg flex items-center justify-center transition-colors
                  ${!day ? "invisible" : ""}
                  ${day === selectedDay ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-foreground"}
                  ${appointments[day!] && day !== selectedDay ? "font-semibold" : ""}
                `}
              >
                {day}
                {appointments[day!] && day !== selectedDay && (
                  <span className="absolute mt-4 size-1 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 border-t border-border pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Terapeutas</p>
            {[
              { nome: "Dr. Carlos Souza", cor: "#0e7490" },
              { nome: "Dra. Patrícia Lima", cor: "#7c3aed" },
              { nome: "Dra. Juliana Reis", cor: "#d97706" },
            ].map((t) => (
              <div key={t.nome} className="flex items-center gap-2">
                <div className="size-2.5 rounded-full" style={{ background: t.cor }} />
                <span className="text-xs">{t.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day view */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">
              {selectedDay} de {MONTHS[month]}
            </h3>
            <span className="text-sm text-muted-foreground">{dayAppts.length} agendamentos</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
            <div className="relative" style={{ minHeight: `${HOURS.length * 56}px` }}>
              {HOURS.map((h, i) => (
                <div key={h} className="flex" style={{ height: 56 }}>
                  <div className="w-16 shrink-0 flex items-start pt-2 px-3">
                    <span className="text-xs text-muted-foreground">{h}</span>
                  </div>
                  <div className={`flex-1 border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`} />
                </div>
              ))}
              {/* Appointments overlay */}
              {dayAppts.map((appt) => {
                const top = hourToY(appt.hora, appt.minutos) + 8;
                const height = (appt.duracao / 60) * 56 - 4;
                return (
                  <button
                    key={appt.id}
                    onClick={() => setSelectedAppt(appt)}
                    className="absolute left-16 right-4 rounded-lg px-3 py-2 text-left hover:opacity-90 transition-opacity shadow-sm"
                    style={{ top, height, background: appt.cor + "22", borderLeft: `3px solid ${appt.cor}` }}
                  >
                    <p className="text-xs font-semibold truncate" style={{ color: appt.cor }}>{appt.paciente}</p>
                    <p className="text-xs opacity-80" style={{ color: appt.cor }}>{appt.tipo} · {appt.hora}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment detail */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedAppt(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Detalhes do Agendamento</h3>
              <button onClick={() => setSelectedAppt(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl" style={{ background: selectedAppt.cor + "15", borderLeft: `4px solid ${selectedAppt.cor}` }}>
                <p className="font-semibold text-foreground">{selectedAppt.paciente}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedAppt.tipo}</p>
              </div>
              {[
                { label: "Horário", value: `${selectedAppt.hora} · ${selectedAppt.duracao} min` },
                { label: "Terapeuta", value: selectedAppt.terapeuta },
                { label: "Sala", value: selectedAppt.sala },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ color: statusColors[selectedAppt.status], background: statusColors[selectedAppt.status] + "20" }}>
                  {selectedAppt.status.charAt(0).toUpperCase() + selectedAppt.status.slice(1)}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 border border-destructive text-destructive py-2 rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors">Cancelar</button>
                <button className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowNew(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Novo Agendamento</h2>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Paciente", placeholder: "Selecione ou busque o paciente", type: "text" },
                { label: "Data", placeholder: "DD/MM/AAAA", type: "text" },
                { label: "Horário", placeholder: "HH:MM", type: "time" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                  <input type={f.type} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background" placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Terapeuta</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background">
                  {terapeutas.slice(1).map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de atendimento</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background">
                  {["Avaliação", "Tratamento", "Reavaliação", "Alta"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Observações</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none" rows={2} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors">Cancelar</button>
                <button onClick={() => setShowNew(false)} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Agendar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
