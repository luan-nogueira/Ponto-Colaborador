import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Login realizado com sucesso!");
      setLocation("/");
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error("Erro ao realizar login: " + (error.message || "Tente novamente"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Ponto Inteligente</h1>
          </div>
          <p className="text-slate-400">Sistema de Controle de Ponto Eletrônico</p>
        </div>

        {/* Card de Login */}
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white text-2xl">Bem-vindo</CardTitle>
            <CardDescription className="text-slate-400">
              Acesse seu painel de controle de ponto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400 text-center">
              Faça login com sua conta para continuar
            </p>
            <Button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-base flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Entrar com Google
            </Button>
            <p className="text-xs text-slate-500 text-center mt-4">
              Seu login é seguro e protegido pelo Firebase
            </p>
            <p className="text-[10px] text-slate-600 text-center mt-2 opacity-30">
              Build: 14:35 | DB: standard-proxy
            </p>
          </CardContent>
        </Card>

        {/* Informações */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">✓</div>
            <p className="text-xs text-slate-400">Seguro</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">⚡</div>
            <p className="text-xs text-slate-400">Rápido</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">📍</div>
            <p className="text-xs text-slate-400">Geolocalizado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
