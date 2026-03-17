// src/pages/Settings.tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2, ClipboardList, Building2, Monitor, Sliders,
  Eye, EyeOff, RotateCcw, CheckCircle2, ChevronRight, Lock,
  LayoutDashboard, Search, Filter, Layers, Zap, Bell, ArrowLeft,
  Timer, CalendarDays, Shield, User, Star, Hash, Volume2, VolumeX,
  Clock, CalendarCheck, AlertTriangle, KeyRound, Download, Grid3X3,
  BarChart3, ChevronDown, Globe, PanelLeft, ListFilter, Palette,
  RefreshCw, Sparkles, ToggleLeft, ToggleRight, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/hooks/useSettings";
import type { TaskFieldSettings, SupplierFieldSettings, FieldConfig } from "@/types/settings";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// ─── Seções ───────────────────────────────────────────────────
type Section =
  | "overview"
  | "tasks"
  | "suppliers"
  | "interface"
  | "system"
  | "timer"
  | "calendar"
  | "security"
  | "notifications";

interface SectionMeta {
  id: Section;
  label: string;
  icon: React.ReactNode;
  description: string;
  group: string;
  badge?: string;
}

const SECTIONS: SectionMeta[] = [
  { id: "overview", label: "Visão Geral", icon: <Grid3X3 className="h-4 w-4" />, description: "Resumo de todas as configurações", group: "Geral" },
  { id: "interface", label: "Interface", icon: <Palette className="h-4 w-4" />, description: "Aparência e elementos visuais", group: "Geral" },
  { id: "system", label: "Sistema", icon: <Sliders className="h-4 w-4" />, description: "Preferências gerais da aplicação", group: "Geral" },
  { id: "notifications", label: "Notificações", icon: <Bell className="h-4 w-4" />, description: "Alertas e notificações do sistema", group: "Geral" },
  { id: "tasks", label: "Tarefas", icon: <ClipboardList className="h-4 w-4" />, description: "Campos e comportamento do formulário", group: "Módulos" },
  { id: "suppliers", label: "Fornecedores", icon: <Building2 className="h-4 w-4" />, description: "Campos do cadastro de fornecedores", group: "Módulos" },
  { id: "timer", label: "Cronômetro", icon: <Timer className="h-4 w-4" />, description: "Rastreamento de tempo e sessões", group: "Módulos" },
  { id: "calendar", label: "Calendário", icon: <CalendarDays className="h-4 w-4" />, description: "Visualização de calendário e lembretes", group: "Módulos" },
  { id: "security", label: "Segurança", icon: <Shield className="h-4 w-4" />, description: "Senha, sessão e segurança da conta", group: "Conta" },
];

// ─── Helpers ──────────────────────────────────────────────────
function groupSections(sections: SectionMeta[]) {
  const groups: Record<string, SectionMeta[]> = {};
  sections.forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });
  return groups;
}

// ─── Sub-componentes ──────────────────────────────────────────
function SectionHeader({ icon, title, description, badge }: {
  icon: React.ReactNode; title: string; description: string; badge?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-border/40 mb-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5 ring-1 ring-primary/20">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {badge && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{badge}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SettingRow({ label, description, icon, children, accent }: {
  label: string; description?: string; icon?: React.ReactNode;
  children: React.ReactNode; accent?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 gap-4 hover:border-border/80 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", accent ?? "bg-primary/10")}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 ml-2">{children}</div>
    </div>
  );
}

function SettingToggle({ label, description, icon, checked, onChange, disabled, accent }: {
  label: string; description?: string; icon?: React.ReactNode;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; accent?: string;
}) {
  return (
    <SettingRow label={label} description={description} icon={icon} accent={accent}>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </SettingRow>
  );
}

function FieldRow({ field, onToggleVisible, onToggleRequired }: {
  field: FieldConfig; onToggleVisible: () => void; onToggleRequired: () => void;
}) {
  return (
    <motion.div layout className={cn(
      "flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200",
      field.visible ? "border-border/60 bg-card" : "border-border/30 bg-muted/20 opacity-60"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
          field.locked ? "bg-amber-100 dark:bg-amber-950/40" : field.visible ? "bg-primary/10" : "bg-muted"
        )}>
          {field.locked ? <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            : field.visible ? <Eye className="h-3.5 w-3.5 text-primary" />
              : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{field.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {field.locked ? "Essencial — não pode ser ocultado"
              : field.visible ? "Visível no formulário" : "Oculto do formulário"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6 shrink-0 ml-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Obrig.</span>
          <Switch checked={field.required} onCheckedChange={onToggleRequired} disabled={field.locked || !field.visible} className="scale-75" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Visível</span>
          <Switch checked={field.visible} onCheckedChange={onToggleVisible} disabled={field.locked} className="scale-75" />
        </div>
      </div>
    </motion.div>
  );
}

function InfoBox({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warning" }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3",
      variant === "warning" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
        : "bg-muted/40 border-border/40"
    )}>
      {variant === "warning"
        ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        : <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />}
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Overview: cards de módulos ───────────────────────────────
function ModuleCard({ section, active, enabled, onClick }: {
  section: SectionMeta; active: boolean; enabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={cn(
      "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm",
      active ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/60 bg-card hover:border-border"
    )}>
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {section.icon}
        </div>
        {enabled !== undefined && (
          <div className={cn("h-2 w-2 rounded-full", enabled ? "bg-emerald-500" : "bg-muted-foreground/40")} />
        )}
      </div>
      <div>
        <p className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>{section.label}</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{section.description}</p>
      </div>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═════════════════════════════════════════════════════════════
export default function Settings() {
  const navigate = useNavigate();
  const {
    settings, updateTaskField, updateSupplierField, updateInterface, updateSystem,
    updateTimer, updateCalendar, updateSecurity, updateNotifications,
    resetToDefaults, isSaving,
  } = useSettings();

  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [savedFlash, setSavedFlash] = useState(false);

  const flash = useCallback(() => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }, []);

  const wrap = useCallback(<T extends any[]>(fn: (...args: T) => void) => {
    return (...args: T) => { fn(...args); flash(); };
  }, [flash]);

  const taskFields = Object.values(settings.tasks.fields).sort((a, b) => a.order - b.order);
  const supplierFields = Object.values(settings.suppliers.fields).sort((a, b) => a.order - b.order);
  const groups = groupSections(SECTIONS.filter(s => s.id !== "overview"));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Settings2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Configurações</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Painel de controle do sistema</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <AnimatePresence>
              {savedFlash && (
                <motion.div initial={{ opacity: 0, scale: 0.85, x: 8 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Salvo</span>
                </motion.div>
              )}
            </AnimatePresence>

            {isSaving && <span className="text-[11px] text-muted-foreground animate-pulse">Sincronizando…</span>}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm"
                  className="h-8 rounded-xl gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Restaurar padrões</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurar configurações padrão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todas as personalizações serão perdidas e substituídas pelas configurações originais. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { resetToDefaults(); flash(); }} className="bg-destructive hover:bg-destructive/90">
                    Sim, restaurar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="w-56 shrink-0 hidden md:block">
            <nav className="space-y-0.5 sticky top-24">
              {/* Overview */}
              <button onClick={() => setActiveSection("overview")}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-sm mb-2",
                  activeSection === "overview" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                  activeSection === "overview" ? "bg-primary/15" : "bg-muted")}>
                  <Grid3X3 className="h-3.5 w-3.5" />
                </span>
                Visão Geral
                {activeSection === "overview" && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
              </button>

              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="pb-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 py-1.5">{group}</p>
                  {items.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                      className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all",
                        activeSection === s.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}>
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                        activeSection === s.id ? "bg-primary/15" : "bg-muted")}>
                        {s.icon}
                      </span>
                      <span className="text-sm truncate">{s.label}</span>
                      {activeSection === s.id && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          {/* ── Mobile tabs ──────────────────────────────────── */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                    activeSection === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                  {s.icon}{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Conteúdo ─────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                className="space-y-4">

                {/* ══ OVERVIEW ══════════════════════════════════ */}
                {activeSection === "overview" && (
                  <>
                    <div className="pb-1">
                      <h2 className="text-base font-bold">Visão Geral</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Acesse e configure todos os módulos do sistema.</p>
                    </div>

                    {Object.entries(groups).map(([group, items]) => (
                      <div key={group} className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">{group}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {items.map(s => {
                            const isEnabled =
                              s.id === "timer" ? settings.timer.enabled
                                : s.id === "calendar" ? settings.calendar.enabled
                                  : s.id === "notifications" ? settings.notifications.enabled
                                    : undefined;
                            return (
                              <ModuleCard key={s.id} section={s}
                                active={activeSection === s.id} enabled={isEnabled}
                                onClick={() => setActiveSection(s.id)} />
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-5 mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-bold text-foreground">Personalize tudo</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Ative ou desative módulos, configure campos obrigatórios, ajuste comportamentos e personalize sua experiência sem precisar alterar código.
                      </p>
                    </div>
                  </>
                )}

                {/* ══ TAREFAS ═══════════════════════════════════ */}
                {activeSection === "tasks" && (
                  <>
                    <SectionHeader icon={<ClipboardList className="h-4 w-4 text-primary" />}
                      title="Formulário de Tarefas" description="Controle visibilidade e obrigatoriedade de cada campo." />
                    <div className="space-y-2">
                      {taskFields.map(field => (
                        <FieldRow key={field.key} field={field}
                          onToggleVisible={() => { updateTaskField(field.key as keyof TaskFieldSettings, { visible: !field.visible }); flash(); }}
                          onToggleRequired={() => { updateTaskField(field.key as keyof TaskFieldSettings, { required: !field.required }); flash(); }} />
                      ))}
                    </div>
                    <InfoBox>
                      Campos com <Lock className="h-3 w-3 inline mx-0.5" /> são essenciais e não podem ser ocultados. Dados de campos ocultos são preservados.
                    </InfoBox>
                  </>
                )}

                {/* ══ FORNECEDORES ══════════════════════════════ */}
                {activeSection === "suppliers" && (
                  <>
                    <SectionHeader icon={<Building2 className="h-4 w-4 text-primary" />}
                      title="Formulário de Fornecedores" description="Defina quais campos aparecem no cadastro de fornecedores." />
                    <div className="space-y-2">
                      {supplierFields.map(field => (
                        <FieldRow key={field.key} field={field}
                          onToggleVisible={() => { updateSupplierField(field.key as keyof SupplierFieldSettings, { visible: !field.visible }); flash(); }}
                          onToggleRequired={() => { updateSupplierField(field.key as keyof SupplierFieldSettings, { required: !field.required }); flash(); }} />
                      ))}
                    </div>
                    <InfoBox>O campo <strong>Nome</strong> é sempre obrigatório e não aparece na lista.</InfoBox>
                  </>
                )}

                {/* ══ INTERFACE ═════════════════════════════════ */}
                {activeSection === "interface" && (
                  <>
                    <SectionHeader icon={<Palette className="h-4 w-4 text-primary" />}
                      title="Interface" description="Personalize elementos visuais e a experiência de navegação." />
                    <div className="space-y-2">
                      <SettingToggle label="Painel de resumo (Dashboard)"
                        description="Exibe cards de contagem no topo da página."
                        icon={<LayoutDashboard className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.showDashboard}
                        onChange={v => { updateInterface({ showDashboard: v }); flash(); }} />
                      <SettingToggle label="Barra de busca"
                        description="Campo de pesquisa por título de tarefa."
                        icon={<Search className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.showSearchBar}
                        onChange={v => { updateInterface({ showSearchBar: v }); flash(); }} />
                      <SettingToggle label="Barra de filtros"
                        description="Filtros de status e prioridade acima da lista."
                        icon={<Filter className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.showFilterBar}
                        onChange={v => { updateInterface({ showFilterBar: v }); flash(); }} />
                      <SettingToggle label="Cards compactos"
                        description="Reduz espaçamento dos cards para exibir mais itens."
                        icon={<Layers className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.compactCards}
                        onChange={v => { updateInterface({ compactCards: v }); flash(); }} />
                      <SettingToggle label="Animações"
                        description="Transições e animações nos componentes da interface."
                        icon={<Zap className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.animationsEnabled}
                        onChange={v => { updateInterface({ animationsEnabled: v }); flash(); }} />
                      <SettingToggle label="Contagem nas abas"
                        description="Exibe badges com contagem nas abas de navegação."
                        icon={<Hash className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.showTaskCount}
                        onChange={v => { updateInterface({ showTaskCount: v }); flash(); }} />
                    </div>
                  </>
                )}

                {/* ══ SISTEMA ═══════════════════════════════════ */}
                {activeSection === "system" && (
                  <>
                    <SectionHeader icon={<Sliders className="h-4 w-4 text-primary" />}
                      title="Sistema" description="Preferências gerais que afetam o comportamento da aplicação." />
                    <div className="space-y-2">
                      <SettingToggle label="Confirmar antes de excluir"
                        description="Caixa de confirmação antes de mover para a lixeira."
                        icon={<Bell className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.system.confirmBeforeDelete}
                        onChange={v => { updateSystem({ confirmBeforeDelete: v }); flash(); }} />
                      <SettingToggle label="Fechar popup ao concluir tarefa"
                        description="Fecha o modal de detalhes automaticamente após concluir."
                        icon={<CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.system.autoCloseModalOnComplete}
                        onChange={v => { updateSystem({ autoCloseModalOnComplete: v }); flash(); }} />

                      <SettingRow label="Modo de rastreamento de tempo"
                        description={settings.system.task_time_mode === "session_based"
                          ? "Sessões: cada acionamento cria uma atuação com histórico."
                          : "Simples: cronômetro acumulativo único por tarefa."}
                        icon={<Timer className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.system.task_time_mode}
                          onValueChange={v => { updateSystem({ task_time_mode: v as any }); flash(); }}>
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="session_based">⏱ Por sessões</SelectItem>
                            <SelectItem value="simple">🕐 Simples</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingRow label="Prioridade padrão"
                        description="Pré-selecionada ao abrir o formulário de nova tarefa."
                        icon={<Star className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.system.defaultPriority}
                          onValueChange={v => { updateSystem({ defaultPriority: v as any }); flash(); }}>
                          <SelectTrigger className="w-28 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">🔴 Alta</SelectItem>
                            <SelectItem value="medium">🟡 Média</SelectItem>
                            <SelectItem value="low">🟢 Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingRow label="Aba inicial"
                        description="Qual aba é exibida ao entrar na aplicação."
                        icon={<ClipboardList className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.system.defaultTab}
                          onValueChange={v => { updateSystem({ defaultTab: v as any }); flash(); }}>
                          <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tasks">Tarefas</SelectItem>
                            <SelectItem value="suppliers">Fornecedores</SelectItem>
                            <SelectItem value="trash">Lixeira</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingRow label="Idioma"
                        description="Idioma da interface do sistema."
                        icon={<Globe className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.system.language}
                          onValueChange={v => { updateSystem({ language: v as any }); flash(); }}>
                          <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt-BR">🇧🇷 Português</SelectItem>
                            <SelectItem value="en-US">🇺🇸 English</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingRow label="Formato de data"
                        description="Como as datas são exibidas no sistema."
                        icon={<CalendarDays className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.system.dateFormat}
                          onValueChange={v => { updateSystem({ dateFormat: v as any }); flash(); }}>
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                            <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                            <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingRow label="Formato de hora"
                        description="Relógio de 24h ou 12h (AM/PM)."
                        icon={<Clock className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.system.timeFormat}
                          onValueChange={v => { updateSystem({ timeFormat: v as any }); flash(); }}>
                          <SelectTrigger className="w-28 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24h">24 horas</SelectItem>
                            <SelectItem value="12h">12h AM/PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>
                    </div>
                  </>
                )}

                {/* ══ CRONÔMETRO ════════════════════════════════ */}
                {activeSection === "timer" && (
                  <>
                    <SectionHeader icon={<Timer className="h-4 w-4 text-primary" />}
                      title="Cronômetro" description="Configure o rastreamento de tempo e sessões de trabalho."
                      badge={settings.timer.enabled ? "Ativo" : "Inativo"} />

                    <SettingToggle label="Ativar módulo de cronômetro"
                      description="Habilita o rastreamento de tempo nas tarefas."
                      icon={<Timer className="h-3.5 w-3.5 text-primary" />}
                      checked={settings.timer.enabled}
                      onChange={v => { updateTimer({ enabled: v }); flash(); }} />

                    <div className={cn("space-y-2 transition-opacity", !settings.timer.enabled && "opacity-40 pointer-events-none")}>
                      <SettingToggle label="Exibir no card da tarefa"
                        description="Mostra o cronômetro diretamente nos cards da lista."
                        icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.timer.showInTaskCard}
                        onChange={v => { updateTimer({ showInTaskCard: v }); flash(); }} />
                      <SettingToggle label="Histórico de sessões"
                        description="Exibe o histórico detalhado de cada sessão de trabalho."
                        icon={<ListFilter className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.timer.showSessionHistory}
                        onChange={v => { updateTimer({ showSessionHistory: v }); flash(); }} />
                      <SettingToggle label="Exportar registros"
                        description="Permite exportar o histórico de tempo das tarefas."
                        icon={<Download className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.timer.exportEnabled}
                        onChange={v => { updateTimer({ exportEnabled: v }); flash(); }} />
                      <SettingToggle label="Alerta de sessão longa"
                        description={`Avisa quando uma sessão ultrapassa ${settings.timer.longSessionThresholdMinutes} minutos.`}
                        icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        accent="bg-amber-100 dark:bg-amber-950/40"
                        checked={settings.timer.alertOnLongSession}
                        onChange={v => { updateTimer({ alertOnLongSession: v }); flash(); }} />

                      {settings.timer.alertOnLongSession && (
                        <div className="rounded-xl border border-border/60 bg-card px-4 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Limite de sessão longa</p>
                            <span className="text-sm font-bold text-primary">{settings.timer.longSessionThresholdMinutes} min</span>
                          </div>
                          <Slider
                            min={30} max={480} step={15}
                            value={[settings.timer.longSessionThresholdMinutes]}
                            onValueChange={([v]) => { updateTimer({ longSessionThresholdMinutes: v }); flash(); }}
                            className="w-full" />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>30 min</span><span>2h</span><span>4h</span><span>8h</span>
                          </div>
                        </div>
                      )}

                      <SettingToggle label="Sons do cronômetro"
                        description="Toca um som ao iniciar e parar o cronômetro."
                        icon={settings.timer.soundEnabled
                          ? <Volume2 className="h-3.5 w-3.5 text-primary" />
                          : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
                        checked={settings.timer.soundEnabled}
                        onChange={v => { updateTimer({ soundEnabled: v }); flash(); }} />

                      <SettingRow label="Modo padrão do timer"
                        description="Modo pré-selecionado ao acessar o cronômetro."
                        icon={<Sliders className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.timer.defaultMode}
                          onValueChange={v => { updateTimer({ defaultMode: v as any }); flash(); }}>
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="session_based">⏱ Por sessões</SelectItem>
                            <SelectItem value="simple">🕐 Simples</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>
                    </div>

                    {!settings.timer.enabled && (
                      <InfoBox variant="warning">
                        O módulo de cronômetro está desativado. Os botões de tempo não aparecerão nas tarefas.
                      </InfoBox>
                    )}
                  </>
                )}

                {/* ══ CALENDÁRIO ════════════════════════════════ */}
                {activeSection === "calendar" && (
                  <>
                    <SectionHeader icon={<CalendarDays className="h-4 w-4 text-primary" />}
                      title="Calendário" description="Configure a visualização de calendário e alertas de vencimento."
                      badge={settings.calendar.enabled ? "Ativo" : "Inativo"} />

                    <SettingToggle label="Ativar módulo de calendário"
                      description="Habilita a visualização de tarefas em formato de calendário."
                      icon={<CalendarDays className="h-3.5 w-3.5 text-primary" />}
                      checked={settings.calendar.enabled}
                      onChange={v => { updateCalendar({ enabled: v }); flash(); }} />

                    <div className={cn("space-y-2 transition-opacity", !settings.calendar.enabled && "opacity-40 pointer-events-none")}>
                      <SettingToggle label="Exibir finais de semana"
                        description="Mostra sábado e domingo no calendário."
                        icon={<CalendarCheck className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.calendar.showWeekends}
                        onChange={v => { updateCalendar({ showWeekends: v }); flash(); }} />
                      <SettingToggle label="Destacar tarefas vencidas"
                        description="Realça visualmente as tarefas com prazo expirado."
                        icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        accent="bg-amber-100 dark:bg-amber-950/40"
                        checked={settings.calendar.highlightOverdue}
                        onChange={v => { updateCalendar({ highlightOverdue: v }); flash(); }} />
                      <SettingToggle label="Exibir prioridade no calendário"
                        description="Mostra indicadores visuais de prioridade nos eventos."
                        icon={<Star className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.calendar.showTaskPriority}
                        onChange={v => { updateCalendar({ showTaskPriority: v }); flash(); }} />
                      <SettingToggle label="Mostrar tarefas concluídas"
                        description="Inclui tarefas já concluídas na visualização do calendário."
                        icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                        accent="bg-emerald-100 dark:bg-emerald-950/40"
                        checked={settings.calendar.showCompletedTasks}
                        onChange={v => { updateCalendar({ showCompletedTasks: v }); flash(); }} />

                      <SettingRow label="Início da semana"
                        description="Define o primeiro dia exibido no calendário."
                        icon={<CalendarDays className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.calendar.weekStart}
                          onValueChange={v => { updateCalendar({ weekStart: v as any }); flash(); }}>
                          <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sunday">Domingo</SelectItem>
                            <SelectItem value="monday">Segunda</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingRow label="Visualização padrão"
                        description="Como o calendário abre por padrão."
                        icon={<Grid3X3 className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={settings.calendar.defaultView}
                          onValueChange={v => { updateCalendar({ defaultView: v as any }); flash(); }}>
                          <SelectTrigger className="w-28 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="month">Mês</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="day">Dia</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingToggle label="Lembretes de vencimento"
                        description={`Alerta ${settings.calendar.reminderMinutesBefore} minutos antes do prazo.`}
                        icon={<Bell className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.calendar.reminderEnabled}
                        onChange={v => { updateCalendar({ reminderEnabled: v }); flash(); }} />

                      {settings.calendar.reminderEnabled && (
                        <div className="rounded-xl border border-border/60 bg-card px-4 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Antecedência do lembrete</p>
                            <span className="text-sm font-bold text-primary">{settings.calendar.reminderMinutesBefore} min</span>
                          </div>
                          <Slider min={5} max={1440} step={5}
                            value={[settings.calendar.reminderMinutesBefore]}
                            onValueChange={([v]) => { updateCalendar({ reminderMinutesBefore: v }); flash(); }} />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>5 min</span><span>30 min</span><span>2h</span><span>1 dia</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {!settings.calendar.enabled && (
                      <InfoBox variant="warning">
                        O módulo de calendário está desativado. O ícone de calendário não aparecerá na barra de navegação.
                      </InfoBox>
                    )}
                  </>
                )}

                {/* ══ SEGURANÇA ═════════════════════════════════ */}
                {activeSection === "security" && (
                  <>
                    <SectionHeader icon={<Shield className="h-4 w-4 text-primary" />}
                      title="Segurança" description="Gerencie senha, sessão e configurações de segurança da conta." />

                    <div className="space-y-2">
                      <SettingToggle label="Exibir 'Alterar Senha' no menu"
                        description="Mostra o atalho para alterar senha na barra de navegação."
                        icon={<KeyRound className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.security.showChangePasswordInMenu}
                        onChange={v => { updateSecurity({ showChangePasswordInMenu: v }); flash(); }} />

                      <SettingToggle label="Confirmar senha ao alterar"
                        description="Exige a senha atual para confirmar antes de definir uma nova."
                        icon={<Shield className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.security.requirePasswordConfirmation}
                        onChange={v => { updateSecurity({ requirePasswordConfirmation: v }); flash(); }} />

                      <SettingToggle label="Exigir senha forte"
                        description="Requer letras maiúsculas, números e caracteres especiais."
                        icon={<Lock className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.security.requireStrongPassword}
                        onChange={v => { updateSecurity({ requireStrongPassword: v }); flash(); }} />

                      <div className="rounded-xl border border-border/60 bg-card px-4 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">Tamanho mínimo da senha</p>
                          <span className="text-sm font-bold text-primary">{settings.security.minPasswordLength} caracteres</span>
                        </div>
                        <Slider min={6} max={32} step={1}
                          value={[settings.security.minPasswordLength]}
                          onValueChange={([v]) => { updateSecurity({ minPasswordLength: v }); flash(); }} />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>6</span><span>12</span><span>20</span><span>32</span>
                        </div>
                      </div>

                      <SettingRow label="Timeout de sessão"
                        description="Desconecta automaticamente após inatividade (0 = nunca)."
                        icon={<Clock className="h-3.5 w-3.5 text-primary" />}>
                        <Select value={String(settings.security.sessionTimeoutMinutes)}
                          onValueChange={v => { updateSecurity({ sessionTimeoutMinutes: Number(v) }); flash(); }}>
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Nunca</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="240">4 horas</SelectItem>
                            <SelectItem value="480">8 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>

                      <SettingToggle label="Autenticação de dois fatores"
                        description="Camada extra de segurança no login (em breve)."
                        icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />}
                        checked={settings.security.twoFactorEnabled}
                        onChange={v => { updateSecurity({ twoFactorEnabled: v }); flash(); }}
                        disabled={true} />
                    </div>

                    <div className="pt-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/alterar-senha")}
                        className="gap-2 h-9 rounded-xl border-primary/30 text-primary hover:bg-primary/5">
                        <KeyRound className="h-3.5 w-3.5" />
                        Ir para Alterar Senha
                      </Button>
                    </div>

                    <InfoBox variant="warning">
                      Configurações de segurança afetam todos os usuários com acesso ao sistema. Altere com cautela.
                    </InfoBox>
                  </>
                )}

                {/* ══ NOTIFICAÇÕES ══════════════════════════════ */}
                {activeSection === "notifications" && (
                  <>
                    <SectionHeader icon={<Bell className="h-4 w-4 text-primary" />}
                      title="Notificações" description="Configure alertas, sons e notificações do sistema."
                      badge={settings.notifications.enabled ? "Ativo" : "Inativo"} />

                    <SettingToggle label="Ativar notificações"
                      description="Habilita o sistema de notificações e alertas."
                      icon={<Bell className="h-3.5 w-3.5 text-primary" />}
                      checked={settings.notifications.enabled}
                      onChange={v => { updateNotifications({ enabled: v }); flash(); }} />

                    <div className={cn("space-y-2 transition-opacity", !settings.notifications.enabled && "opacity-40 pointer-events-none")}>
                      <SettingToggle label="Alertas de data de vencimento"
                        description={`Notifica ${settings.notifications.dueDateAlertHoursBefore}h antes do prazo.`}
                        icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        accent="bg-amber-100 dark:bg-amber-950/40"
                        checked={settings.notifications.dueDateAlerts}
                        onChange={v => { updateNotifications({ dueDateAlerts: v }); flash(); }} />

                      {settings.notifications.dueDateAlerts && (
                        <div className="rounded-xl border border-border/60 bg-card px-4 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Antecedência do alerta</p>
                            <span className="text-sm font-bold text-primary">{settings.notifications.dueDateAlertHoursBefore}h antes</span>
                          </div>
                          <Slider min={1} max={72} step={1}
                            value={[settings.notifications.dueDateAlertHoursBefore]}
                            onValueChange={([v]) => { updateNotifications({ dueDateAlertHoursBefore: v }); flash(); }} />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>1h</span><span>12h</span><span>24h</span><span>72h</span>
                          </div>
                        </div>
                      )}

                      <SettingToggle label="Som ao concluir tarefa"
                        description="Reproduz um som ao marcar uma tarefa como concluída."
                        icon={<Volume2 className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.notifications.taskCompletionSound}
                        onChange={v => { updateNotifications({ taskCompletionSound: v }); flash(); }} />
                      <SettingToggle label="Notificações do navegador"
                        description="Envia notificações push pelo navegador (requer permissão)."
                        icon={<Bell className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.notifications.desktopNotifications}
                        onChange={v => { updateNotifications({ desktopNotifications: v }); flash(); }} />
                      <SettingToggle label="Notificações por e-mail"
                        description="Receba alertas de vencimento no seu e-mail cadastrado (em breve)."
                        icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />}
                        checked={settings.notifications.emailNotifications}
                        onChange={v => { updateNotifications({ emailNotifications: v }); flash(); }}
                        disabled={true} />
                    </div>

                    {!settings.notifications.enabled && (
                      <InfoBox variant="warning">Notificações estão desativadas. Nenhum alerta será enviado.</InfoBox>
                    )}
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}