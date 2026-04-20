import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegistrosTempoReal() {
  const { data: registros, isLoading, refetch } = trpc.ponto.getRegistrosRecentes.useQuery();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const getTipoInfo = (tipo: string) => {
    const info: Record<string, { icon: string; cor: string; label: string }> = {
      entrada: { icon: "✓", cor: "green", label: "Entrada" },
      saida: { icon: "✕", cor: "red", label: "Saída" },
      intervalo_inicio: { icon: "⏸", cor: "orange", label: "Intervalo" },
      intervalo_fim: { icon: "▶", cor: "blue", label: "Retorno" },
    };
    return info[tipo] || { icon: "•", cor: "gray", label: tipo };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Registros em Tempo Real</CardTitle>
          <CardDescription>
            Últimos registros de ponto dos colaboradores
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            size="sm"
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
          >
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading && registros === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : registros && registros.length > 0 ? (
            registros.map((registro) => {
              const tipoInfo = getTipoInfo(registro.tipo);
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
                  className={`p-3 border rounded-lg flex items-center justify-between ${corClasses[tipoInfo.cor]}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tipoInfo.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {registro.usuario?.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {tipoInfo.label} • {new Date(registro.dataRegistro).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {registro.endereco && (
                    <div className="text-right text-xs text-slate-600 dark:text-slate-400">
                      <p>📍 {registro.endereco}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum registro recente
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
