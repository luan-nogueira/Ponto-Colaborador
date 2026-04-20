import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, LogOut, Menu, X, Users, CheckCircle, XCircle, AlertCircle, Clock as ClockIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import GestaoColaboradores from "@/components/GestaoColaboradores";
import JustificativasPendentes from "@/components/JustificativasPendentes";
import RegistrosTempoReal from "@/components/RegistrosTempoReal";
import MapaLocalizacao from "@/components/MapaLocalizacao";
import Relatorios from "@/components/Relatorios";
import ConfiguracaoEmpresa from "@/components/ConfiguracaoEmpresa";

export default function DashboardGestor() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    total: 0,
    presentes: 0,
    ausentes: 0,
    atrasados: 0,
    pendentes: 0
  });

  useEffect(() => {
    // Escutar em tempo real por mudanças nas justificativas pendentes
    const qJust = query(collection(db, "justificativas"), where("status", "==", "pendente"));
    const unsubJust = onSnapshot(qJust, (snap) => {
      setStats(prev => ({ ...prev, pendentes: snap.size }));
    });

    // Buscar total de colaboradores e presença
    const fetchStats = async () => {
      try {
        const userSnap = await getDocs(collection(db, "users"));
        const total = userSnap.size;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const pontoSnap = await getDocs(query(collection(db, "pontos"), where("timestamp", ">=", today)));
        const userIdsPresentes = new Set();
        pontoSnap.docs.forEach(doc => {
          if (doc.data().tipo === "entrada") userIdsPresentes.add(doc.data().userId);
        });

        setStats(prev => ({
          ...prev,
          total,
          presentes: userIdsPresentes.size,
          ausentes: Math.max(0, total - userIdsPresentes.size)
        }));
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    fetchStats();
    return () => unsubJust();
  }, []);

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
      {/* Sidebar */}
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
            <NavItem icon="👥" label="Colaboradores" />
            <NavItem icon="📍" label="Registros Live" />
            <NavItem icon="📋" label="Justificativas" />
            <NavItem icon="📈" label="Relatórios" />
            <NavItem icon="⚙️" label="Configurações" />
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Gestor
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.name || "Administrador"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate uppercase">
                {user?.role}
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
              Painel de Gestão
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="colaboradores">Equipe</TabsTrigger>
              <TabsTrigger value="registros">Registros</TabsTrigger>
              <TabsTrigger value="justificativas">Justificativas</TabsTrigger>
              <TabsTrigger value="configuracoes">Ajustes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Equipe" value={stats.total} icon={<Users className="text-blue-500" />} />
                <StatCard title="Presentes" value={stats.presentes} icon={<CheckCircle className="text-green-500" />} />
                <StatCard title="Ausentes" value={stats.ausentes} icon={<XCircle className="text-red-400" />} />
                <StatCard title="Atrasos" value={stats.atrasados} icon={<ClockIcon className="text-orange-500" />} />
                <StatCard title="Pendentes" value={stats.pendentes} icon={<AlertCircle className="text-purple-500" />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Registros Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RegistrosTempoReal limit={5} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Justificativas para Análise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <JustificativasPendentes limit={5} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="colaboradores" className="mt-6">
              <GestaoColaboradores />
            </TabsContent>
            <TabsContent value="registros" className="mt-6">
              <RegistrosTempoReal />
            </TabsContent>
            <TabsContent value="justificativas" className="mt-6">
              <JustificativasPendentes />
            </TabsContent>
            <TabsContent value="configuracoes" className="mt-6">
              <ConfiguracaoEmpresa />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
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
