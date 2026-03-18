// src/pages/AlterarSenha.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckSquare, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";

export default function AlterarSenha() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();

  const minLen = settings.security.minPasswordLength;
  const requireStrong = settings.security.requireStrongPassword;
  const requireCurrentPassword = settings.security.requirePasswordConfirmation;

  // Valida força da senha se requireStrongPassword estiver ativo
  function isStrongPassword(pwd: string): boolean {
    return /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
  }

  // Calcula força visualmente
  function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= minLen) score++;
    if (pwd.length >= minLen + 4) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: "Muito fraca", color: "bg-rose-500" };
    if (score === 2) return { score, label: "Fraca", color: "bg-orange-400" };
    if (score === 3) return { score, label: "Moderada", color: "bg-amber-400" };
    if (score === 4) return { score, label: "Forte", color: "bg-emerald-400" };
    return { score, label: "Muito forte", color: "bg-emerald-500" };
  }

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < minLen) {
      toast({ variant: "destructive", title: `A senha precisa ter no mínimo ${minLen} caracteres.` });
      return;
    }

    if (requireStrong && !isStrongPassword(newPassword)) {
      toast({
        variant: "destructive",
        title: "Senha fraca",
        description: "A senha precisa ter letras maiúsculas, números e caracteres especiais.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "As senhas não coincidem." });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Usuário não encontrado.");

      // Só reautentica se requirePasswordConfirmation estiver ativo
      if (requireCurrentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          toast({ variant: "destructive", title: "Senha atual incorreta." });
          setLoading(false);
          return;
        }
      }

      // Atualiza para a nova senha
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Senha alterada com sucesso! 🔒" });
      navigate("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/50)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/50)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_30%,transparent_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[400px] px-5"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-5"
          >
            <CheckSquare className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Task<span className="text-primary">Flow</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gestão de tarefas simplificada
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="rounded-2xl border bg-card shadow-xl shadow-foreground/5 overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

          <div className="px-7 pt-7 pb-8">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Alterar senha</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              {requireCurrentPassword
                ? "Confirme sua senha atual e defina uma nova."
                : "Defina uma nova senha para sua conta."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Senha atual — só exibe se requirePasswordConfirmation=true */}
              {requireCurrentPassword && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Senha atual</label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Sua senha atual"
                      className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pr-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Nova senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Nova senha</label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder={`Mínimo ${minLen} caracteres`}
                    className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Barra de força da senha */}
                {newPassword.length > 0 && (
                  <div className="space-y-1 mt-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                    )}
                  </div>
                )}

                {/* Requisitos de senha forte */}
                {requireStrong && newPassword.length > 0 && (
                  <div className="flex flex-col gap-1 mt-2">
                    {[
                      { ok: /[A-Z]/.test(newPassword), label: "Letra maiúscula" },
                      { ok: /[0-9]/.test(newPassword), label: "Número" },
                      { ok: /[^A-Za-z0-9]/.test(newPassword), label: "Caractere especial" },
                    ].map(({ ok, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                        <span className={`text-[11px] ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmar nova senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Confirmar nova senha</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-500">As senhas não coincidem</p>
                )}
              </div>

              <Button
                className="w-full h-10 rounded-xl mt-2 gap-2 shadow-sm shadow-primary/20 font-semibold"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <><KeyRound className="h-4 w-4" />Alterar senha</>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 decoration-muted-foreground/40 flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o sistema
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8 uppercase tracking-widest">
          © {new Date().getFullYear()} TaskFlow
        </p>
      </motion.div>
    </div>
  );
}