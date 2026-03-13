// src/pages/Settings.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  ClipboardList,
  Building2,
  Monitor,
  Sliders,
  Eye,
  EyeOff,
  Star,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Lock,
  LayoutDashboard,
  Search,
  Filter,
  Layers,
  Zap,
  Bell,
  ArrowLeft,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import type { TaskFieldSettings, SupplierFieldSettings, FieldConfig } from "@/types/settings";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Seções laterais ─────────────────────────────────────────
type Section = "tasks" | "suppliers" | "interface" | "system";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "tasks",
    label: "Tarefas",
    icon: <ClipboardList className="h-4 w-4" />,
    description: "Campos e comportamento do formulário de tarefas",
  },
  {
    id: "suppliers",
    label: "Fornecedores",
    icon: <Building2 className="h-4 w-4" />,
    description: "Campos e comportamento do cadastro de fornecedores",
  },
  {
    id: "interface",
    label: "Interface",
    icon: <Monitor className="h-4 w-4" />,
    description: "Aparência e elementos visuais da aplicação",
  },
  {
    id: "system",
    label: "Sistema",
    icon: <Sliders className="h-4 w-4" />,
    description: "Comportamentos e preferências gerais",
  },
];

// ─── Componente de linha de campo ──────────────────────────────
function FieldRow({
  field,
  onToggleVisible,
  onToggleRequired,
}: {
  field: FieldConfig;
  onToggleVisible: () => void;
  onToggleRequired: () => void;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
        field.visible
          ? "border-border/60 bg-card"
          : "border-border/30 bg-muted/20 opacity-60"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          field.visible ? "bg-primary/10" : "bg-muted"
        )}>
          {field.locked ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          ) : field.visible ? (
            <Eye className="h-3.5 w-3.5 text-primary" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{field.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {field.locked
              ? "Campo obrigatório do sistema — não pode ser ocultado"
              : field.visible
              ? "Visível no formulário"
              : "Oculto do formulário"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 ml-4">
        {/* Obrigatório */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Obrigatório
          </span>
          <Switch
            checked={field.required}
            onCheckedChange={onToggleRequired}
            disabled={field.locked || !field.visible}
            className="scale-75"
          />
        </div>

        {/* Visível */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Visível
          </span>
          <Switch
            checked={field.visible}
            onCheckedChange={onToggleVisible}
            disabled={field.locked}
            className="scale-75"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Toggle de configuração simples ───────────────────────────
function SettingToggle({
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0 ml-4" />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const {
    settings,
    updateTaskField,
    updateSupplierField,
    updateInterface,
    updateSystem,
    resetToDefaults,
    isSaving,
  } = useSettings();

  const [activeSection, setActiveSection] = useState<Section>("tasks");
  const [savedFlash, setSavedFlash] = useState(false);

  const handleChange = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const taskFields = Object.values(settings.tasks.fields).sort((a, b) => a.order - b.order);
  const supplierFields = Object.values(settings.suppliers.fields).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Settings2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Configurações</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Centro de controle do sistema
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Flash de salvo */}
            <AnimatePresence>
              {savedFlash && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, x: 8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Salvo
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {isSaving && (
              <span className="text-[11px] text-muted-foreground animate-pulse">
                Sincronizando…
              </span>
            )}

            {/* Reset */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Restaurar padrões</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurar configurações padrão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todas as suas personalizações serão perdidas e substituídas pelas configurações originais do sistema. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { resetToDefaults(); handleChange(); }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Sim, restaurar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* ── Sidebar de seções ────────────────────────── */}
          <aside className="w-52 shrink-0 hidden md:block">
            <nav className="space-y-1 sticky top-24">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                    activeSection === s.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    activeSection === s.id ? "bg-primary/15" : "bg-muted"
                  )}>
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{s.label}</p>
                  </div>
                  {activeSection === s.id && (
                    <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Mobile tabs ──────────────────────────────── */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                    activeSection === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Conteúdo da seção ────────────────────────── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >

                {/* ── TAREFAS ───────────────────────── */}
                {activeSection === "tasks" && (
                  <>
                    <SectionHeader
                      icon={<ClipboardList className="h-4 w-4 text-primary" />}
                      title="Campos do Formulário de Tarefas"
                      description="Controle quais campos aparecem ao criar ou editar uma tarefa, e quais são obrigatórios."
                    />
                    <div className="space-y-2">
                      {taskFields.map((field) => (
                        <FieldRow
                          key={field.key}
                          field={field}
                          onToggleVisible={() => {
                            updateTaskField(field.key as keyof TaskFieldSettings, { visible: !field.visible });
                            handleChange();
                          }}
                          onToggleRequired={() => {
                            updateTaskField(field.key as keyof TaskFieldSettings, { required: !field.required });
                            handleChange();
                          }}
                        />
                      ))}
                    </div>

                    <InfoBox>
                      Campos marcados com <Lock className="h-3 w-3 inline mx-0.5" /> são essenciais para o funcionamento do sistema e não podem ser ocultados.
                      Campos ocultos não aparecem no formulário, mas seus dados existentes são preservados.
                    </InfoBox>
                  </>
                )}

                {/* ── FORNECEDORES ──────────────────── */}
                {activeSection === "suppliers" && (
                  <>
                    <SectionHeader
                      icon={<Building2 className="h-4 w-4 text-primary" />}
                      title="Campos do Formulário de Fornecedores"
                      description="Controle quais campos aparecem ao cadastrar ou editar um fornecedor."
                    />
                    <div className="space-y-2">
                      {supplierFields.map((field) => (
                        <FieldRow
                          key={field.key}
                          field={field}
                          onToggleVisible={() => {
                            updateSupplierField(field.key as keyof SupplierFieldSettings, { visible: !field.visible });
                            handleChange();
                          }}
                          onToggleRequired={() => {
                            updateSupplierField(field.key as keyof SupplierFieldSettings, { required: !field.required });
                            handleChange();
                          }}
                        />
                      ))}
                    </div>

                    <InfoBox>
                      O campo <strong>Nome</strong> é sempre obrigatório e não aparece na lista acima pois nunca pode ser alterado.
                    </InfoBox>
                  </>
                )}

                {/* ── INTERFACE ─────────────────────── */}
                {activeSection === "interface" && (
                  <>
                    <SectionHeader
                      icon={<Monitor className="h-4 w-4 text-primary" />}
                      title="Configurações de Interface"
                      description="Personalize os elementos visuais e a experiência de navegação."
                    />
                    <div className="space-y-2">
                      <SettingToggle
                        label="Painel de resumo (Dashboard)"
                        description="Exibe os cards de contagem de tarefas pendentes e concluídas no topo da página."
                        icon={<LayoutDashboard className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.showDashboard}
                        onChange={(v) => { updateInterface({ showDashboard: v }); handleChange(); }}
                      />
                      <SettingToggle
                        label="Barra de busca"
                        description="Exibe o campo de pesquisa por título de tarefa."
                        icon={<Search className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.showSearchBar}
                        onChange={(v) => { updateInterface({ showSearchBar: v }); handleChange(); }}
                      />
                      <SettingToggle
                        label="Barra de filtros"
                        description="Exibe os filtros de status e prioridade acima da lista de tarefas."
                        icon={<Filter className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.showFilterBar}
                        onChange={(v) => { updateInterface({ showFilterBar: v }); handleChange(); }}
                      />
                      <SettingToggle
                        label="Cards compactos"
                        description="Reduz o espaçamento e tamanho dos cards de tarefa para exibir mais itens na tela."
                        icon={<Layers className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.compactCards}
                        onChange={(v) => { updateInterface({ compactCards: v }); handleChange(); }}
                      />
                      <SettingToggle
                        label="Animações"
                        description="Ativa transições e animações nos componentes da interface."
                        icon={<Zap className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.interface.animationsEnabled}
                        onChange={(v) => { updateInterface({ animationsEnabled: v }); handleChange(); }}
                      />
                    </div>
                  </>
                )}

                {/* ── SISTEMA ───────────────────────── */}
                {activeSection === "system" && (
                  <>
                    <SectionHeader
                      icon={<Sliders className="h-4 w-4 text-primary" />}
                      title="Configurações do Sistema"
                      description="Preferências gerais que afetam o comportamento da aplicação."
                    />
                    <div className="space-y-2">
                      <SettingToggle
                        label="Confirmar antes de excluir"
                        description="Exibe uma caixa de confirmação antes de mover tarefas ou fornecedores para a lixeira."
                        icon={<Bell className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.system.confirmBeforeDelete}
                        onChange={(v) => { updateSystem({ confirmBeforeDelete: v }); handleChange(); }}
                      />
                      <SettingToggle
                        label="Fechar popup ao concluir tarefa"
                        description="Fecha automaticamente o modal de detalhes após concluir uma tarefa."
                        icon={<CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        checked={settings.system.autoCloseModalOnComplete}
                        onChange={(v) => { updateSystem({ autoCloseModalOnComplete: v }); handleChange(); }}
                      />

                      {/* Modo de tempo */}
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Timer className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">Modo de rastreamento de tempo</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {settings.system.task_time_mode === "session_based"
                                ? "Sessões: cada acionamento do timer cria uma atuação registrada com histórico."
                                : "Simples: cronômetro acumulativo único por tarefa, sem histórico de sessões."}
                            </p>
                          </div>
                        </div>
                        <Select
                          value={settings.system.task_time_mode}
                          onValueChange={(v) => {
                            updateSystem({ task_time_mode: v as "simple" | "session_based" });
                            handleChange();
                          }}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg shrink-0 ml-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="session_based">⏱ Por sessões</SelectItem>
                            <SelectItem value="simple">🕐 Simples</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Prioridade padrão */}
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Star className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">Prioridade padrão</p>
                            <p className="text-[11px] text-muted-foreground">
                              Prioridade pré-selecionada ao abrir o formulário de nova tarefa.
                            </p>
                          </div>
                        </div>
                        <Select
                          value={settings.system.defaultPriority}
                          onValueChange={(v) => {
                            updateSystem({ defaultPriority: v as any });
                            handleChange();
                          }}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs rounded-lg shrink-0 ml-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">🔴 Alta</SelectItem>
                            <SelectItem value="medium">🟡 Média</SelectItem>
                            <SelectItem value="low">🟢 Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Aba padrão */}
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <ClipboardList className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">Aba inicial</p>
                            <p className="text-[11px] text-muted-foreground">
                              Qual aba é exibida ao entrar na aplicação.
                            </p>
                          </div>
                        </div>
                        <Select
                          value={settings.system.defaultTab}
                          onValueChange={(v) => {
                            updateSystem({ defaultTab: v as any });
                            handleChange();
                          }}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs rounded-lg shrink-0 ml-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tasks">Tarefas</SelectItem>
                            <SelectItem value="suppliers">Fornecedores</SelectItem>
                            <SelectItem value="trash">Lixeira</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
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

// ─── Componentes auxiliares ───────────────────────────────────
function SectionHeader({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-1 border-b border-border/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 border border-border/40 px-4 py-3">
      <div className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground">ℹ️</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}