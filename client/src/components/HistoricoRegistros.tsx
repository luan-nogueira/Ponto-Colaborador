import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";

export default function HistoricoRegistros() {
  const { user } = useAuth();
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [registros, setRegistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHistorico = async () => {
      setIsLoading(true);
      try {
        let q = query(
          collection(db, "pontos"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );

        if (dataInicio) {
          const start = new Date(dataInicio);
          start.setHours(0, 0, 0, 0);
          q = query(q, where("timestamp", ">=", Timestamp.fromDate(start)));
        }

        if (dataFim) {
          const end = new Date(dataFim);
          end.setHours(23, 59, 59, 999);
          q = query(q, where("timestamp", "<=", Timestamp.fromDate(end)));
        }

        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataRegistro: doc.data().timestamp?.toDate() || new Date()
        }));
        setRegistros(data);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistorico();
  }, [user, dataInicio, dataFim]);

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, { label: string; icon: string; cor: string }> = {
      entrada: { label: "Entrada", icon: "✓", cor: "green" },
      saida: { label: "Saída", icon: "✕", cor: "red" },
      intervalo_inicio: { label: "Início Intervalo", icon: "⏸", cor: "orange" },
      intervalo_fim: { label: "Fim Intervalo", icon: "▶", cor: "blue" },
    };
    return labels[tipo] || { label: tipo, icon: "•", cor: "gray" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Registros</CardTitle>
        <CardDescription>
          Visualize todos os seus registros de ponto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Data Início
            </label>
            <input
              type="date"
              onChange={(e) => setDataInicio(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Data Fim
            </label>
            <input
              type="date"
              onChange={(e) => setDataFim(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : registros && registros.length > 0 ? (
            registros.map((registro) => {
              const tipoInfo = getTipoLabel(registro.tipo);
              const corClasses: Record<string, string> = {
                green: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                red: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
                orange: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
                blue: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                gray: "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600",
              };

              return (
                <div
                  key={registro.id}
                  className={`p-4 border rounded-lg ${corClasses[tipoInfo.cor]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{tipoInfo.icon}</span>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {tipoInfo.label}
                        </h4>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>
                          📅{" "}
                          {format(new Date(registro.dataRegistro), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                        <p>
                          🕐 {format(new Date(registro.dataRegistro), "HH:mm:ss")}
                        </p>
                        {registro.endereco && (
                          <p className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {registro.endereco}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum registro encontrado
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
