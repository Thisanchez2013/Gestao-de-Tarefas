// src/pages/Login.tsx
import { useState } from "react";
import { supabase, getEmailByUsername } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, CheckSquare, ArrowRight, Eye, EyeOff, Mail, AtSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Login: apenas username agora
  const [loginUsername, setLoginUsername] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ variant: "destructive", title: "Informe um nome de usuário." });
      return;
    }
    if (username.includes(" ")) {
      toast({ variant: "destructive", title: "O nome de usuário não pode ter espaços." });
      return;
    }

    setLoading(true);
    try {
      // Verifica se username já existe
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        toast({ variant: "destructive", title: "Usuário já existe", description: "Escolha outro nome de usuário." });
        return;
      }

      // Cria conta no Supabase Auth
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Salva o perfil com username e email
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
          }]);

        if (profileError) throw profileError;
      }

      toast({
        title: "Conta criada!",
        description: "Verifique seu e-mail para confirmar o acesso.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const input = loginUsername.trim();

      if (!input) {
        toast({ variant: "destructive", title: "Informe o nome de usuário." });
        return;
      }

      // Busca o e-mail pelo username — sem lógica de detecção
      const emailToUse = await getEmailByUsername(input);

      if (!emailToUse) {
        toast({
          variant: "destructive",
          title: "Usuário não encontrado",
          description: "Verifique o nome de usuário e tente novamente.",
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      if (error) throw error;

      toast({ title: "Bem-vindo de volta! 👋" });
      navigate("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Usuário ou senha incorretos." });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setLoginUsername("");
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
          {/* Top accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

          <div className="px-7 pt-7 pb-8">
            <h2 className="text-base font-bold text-foreground mb-1">
              {isRegistering ? "Criar conta" : "Entrar na conta"}
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              {isRegistering
                ? "Preencha os dados para criar sua conta."
                : "Use seu nome de usuário para entrar."}
            </p>

            <AnimatePresence mode="wait">
              {/* FORMULÁRIO DE CADASTRO */}
              {isRegistering ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">
                      Nome de usuário
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="seunome"
                        className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pl-9"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                        required
                        autoComplete="username"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-0.5">
                      Sem espaços. Será usado para entrar no sistema.
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-0.5">
                      Usado apenas para confirmação de conta. Não precisará dele para entrar.
                    </p>
                  </div>

                  {/* Senha */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        Criando conta...
                      </span>
                    ) : (
                      <><UserPlus className="h-4 w-4" />Criar conta</>
                    )}
                  </Button>
                </motion.form>

              ) : (
                /* FORMULÁRIO DE LOGIN — só username + senha */
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">
                      Nome de usuário
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="seunome"
                        className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pl-9"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value.replace(/\s/g, ""))}
                        required
                        autoFocus
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        className="h-10 rounded-xl text-sm bg-background border-border/80 focus-visible:ring-primary/25 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        Entrando...
                      </span>
                    ) : (
                      <><LogIn className="h-4 w-4" />Entrar<ArrowRight className="h-4 w-4 ml-auto" /></>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Toggle cadastro/login */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); resetForm(); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 decoration-muted-foreground/40"
              >
                {isRegistering
                  ? "Já tenho uma conta — entrar"
                  : "Não tenho conta — criar agora"}
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