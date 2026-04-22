import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

export default function ResumoMensal() {
  const { user } = useAuth();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [resumo, setResumo] = useState<any>(null);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    if (!user) return;

    const fetchResumo = async () => {
      setIsLoading(true);
      try {
        const start = new Date(ano, mes - 1, 1);
        const end = new Date(ano, mes, 0, 23, 59, 59, 999);

        const q = query(
          collection(db, "pontos"),
          where("userId", "==", user.uid),
          where("timestamp", ">=", Timestamp.fromDate(start)),
          where("timestamp", "<=", Timestamp.fromDate(end))
        );

        const snap = await getDocs(q);
        const rows = snap.docs.map(doc => ({
          ...doc.data(),
          date: (doc.data() as any).timestamp.toDate()
        } as any));

        // Cálculo básico de resumo
        const uniqueDays = new Set(rows.map(r => r.date.toDateString()));
        const saidasAntecipadas = rows.filter(r => r.tipo === "saida" && r.date.getHours() < 17).length; // Mock-ish logic

        setResumo({
          diasTrabalhados: uniqueDays.size,
          atrasos: 0,
          faltas: 0,
          saidasAntecipadas,
          horasTrabalhadas: uniqueDays.size * 8, // Mock: 8h por dia
          horasExtras: 0
        });

      } catch (error) {
        console.error("Erro ao carregar resumo mensal:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumo();
  }, [user, mes, ano]);

  const handleMesAnterior = () => {
    if (mes === 1) {
      setMes(12);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  };

  const handleProximoMes = () => {
    if (mes === 12) {
      setMes(1);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Mensal</CardTitle>
        <CardDescription>Estatísticas do mês selecionado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={handleMesAnterior} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
            ← Anterior
          </button>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {meses[mes - 1]} de {ano}
          </h3>
          <button onClick={handleProximoMes} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
            Próximo →
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : resumo ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatsBox label="Dias Trabalhados" value={resumo.diasTrabalhados} color="blue" />
            <StatsBox label="Atrasos" value={resumo.atrasos} color="red" />
            <StatsBox label="Faltas" value={resumo.faltas} color="orange" />
            <StatsBox label="Saídas Antecipadas" value={resumo.saidasAntecipadas} color="purple" />
            <StatsBox label="Horas Trabalhadas" value={`${Number(resumo.horasTrabalhadas).toFixed(1)}h`} color="green" />
            <StatsBox label="Horas Extras" value={`${Number(resumo.horasExtras).toFixed(1)}h`} color="indigo" />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">Nenhum resumo disponível para este mês</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatsBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
    red: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
    orange: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100",
    purple: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100",
    green: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
    indigo: "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100",
  };
  const labelColors: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
    purple: "text-purple-600 dark:text-purple-400",
    green: "text-green-600 dark:text-green-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };

  return (
    <div className={`p-4 border rounded-lg ${colors[color]}`}>
      <p className={`text-sm font-medium mb-1 ${labelColors[color]}`}>{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
