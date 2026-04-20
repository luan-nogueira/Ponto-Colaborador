import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import RegistroPonto from "@/components/RegistroPonto";
import HistoricoRegistros from "@/components/HistoricoRegistros";
import ResumoMensal from "@/components/ResumoMensal";
import Justificativas from "@/components/Justificativas";

export default function DashboardColaborador() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout realizado");
      setLocation("/login");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:z-auto`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white">Ponto</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Inteligente</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavItem icon="📊" label="Dashboard" active />
            <NavItem icon="📝" label="Registrar Ponto" />
            <NavItem icon="📋" label="Histórico" />
            <NavItem icon="📈" label="Resumo Mensal" />
            <NavItem icon="✋" label="Justificativas" />
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Usuário
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.cargo}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Meu Painel
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="overview">Geral</TabsTrigger>
              <TabsTrigger value="registro">Registrar</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="justificativas">Justificativas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Status Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Ativo</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Horas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">0.0h</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Localização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-600">✓ Ativa</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Registre seu ponto agora</CardDescription>
                </CardHeader>
                <CardContent>
                   <RegistroPonto />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registro" className="mt-6">
              <RegistroPonto />
            </TabsContent>

            <TabsContent value="historico" className="mt-6">
              <HistoricoRegistros />
            </TabsContent>

            <TabsContent value="resumo" className="mt-6">
              <ResumoMensal />
            </TabsContent>

            <TabsContent value="justificativas" className="mt-6">
              <Justificativas />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}
