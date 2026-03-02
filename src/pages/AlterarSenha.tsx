// src/pages/AlterarSenha.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "A nova senha precisa ter no mínimo 6 caracteres." });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "As senhas não coincidem." });
      return;
    }

    setLoading(true);

    try {
      // Reautentica com a senha atual para confirmar identidade
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Usuário não encontrado.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({ variant: "destructive", title: "Senha atual incorreta." });
        return;
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
              Confirme sua senha atual e defina uma nova.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Senha atual */}
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

              {/* Nova senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Nova senha</label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
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