import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Trophy, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false);
    try {
      const { error } = isRegistering 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      if (isRegistering) {
        toast({ title: "Excelência em cada detalhe", description: "Verifique seu e-mail para confirmar seu acesso." });
      } else {
        toast({ title: "Bem-vindo de volta" });
        navigate("/");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Nota de interrupção", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] transition-colors duration-500">
      {/* Elemento de sofisticação: Linhas de grid sutis ou gradiente suave */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full max-w-[420px] p-6">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 animate-bounce-slow">
            <Trophy className="h-7 w-7 text-zinc-800 dark:text-zinc-200" />
          </div>
          <h1 className="text-4xl font-extralight tracking-tighter text-zinc-900 dark:text-white">
            Task<span className="font-semibold text-primary">Elite</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-light tracking-wide uppercase">
            Gestão de Alta Performance
          </p>
        </div>

        <Card className="border-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <CardHeader className="pt-8 text-center">
            <CardTitle className="text-xl font-medium text-zinc-800 dark:text-zinc-100">
              {isRegistering ? "Solicitar Acesso" : "Identificação"}
            </CardTitle>
            <CardDescription className="font-light">
              {isRegistering ? "Crie sua conta exclusiva." : "Insira suas credenciais para prosseguir."}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4 px-8 pb-8">
              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="E-mail profissional"
                  className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-0 focus:border-zinc-400 h-12 rounded-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Senha"
                  className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-0 focus:border-zinc-400 h-12 rounded-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-6 px-8 pb-10">
              <Button 
                className="w-full h-12 rounded-none bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all group font-normal tracking-wide" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">Processando...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isRegistering ? "Confirmar Cadastro" : "Entrar no Sistema"}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-800"
              >
                {isRegistering 
                  ? "Já possuo acesso exclusivo" 
                  : "Não possuo uma conta ainda"}
              </button>
            </CardFooter>
          </form>
        </Card>

        <footer className="mt-12 text-center">
          <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
            © 2026 Sistema de Gestão Privada
          </p>
        </footer>
      </div>
    </div>
  );
}