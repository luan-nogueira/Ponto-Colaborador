import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit as firestoreLimit, onSnapshot, doc, getDoc } from "firebase/firestore";

export default function RegistrosTempoReal({ limit = 10 }: { limit?: number }) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "pontos"),
      orderBy("timestamp", "desc"),
      firestoreLimit(limit)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setIsLoading(true);
      try {
        const docs = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const userSnap = await getDoc(doc(db, "users", data.userId));
          return {
            id: docSnapshot.id,
            ...data,
            usuario: userSnap.exists() ? userSnap.data() : { name: "Desconhecido" }
          };
        }));
        setRegistros(docs);
      } catch (error) {
        console.error("Erro ao carregar registros em tempo real:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [limit]);

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
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
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
