import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";

export default function JustificativasPendentes({ limit }: { limit?: number }) {
  const [justificativas, setJustificativas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "justificativas"),
      where("status", "==", "pendente")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setIsLoading(true);
      try {
        const docs = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          // Buscar dados do usuário associado
          const userSnap = await getDoc(doc(db, "users", data.userId));
          return {
            id: docSnapshot.id,
            ...data,
            usuario: userSnap.exists() ? userSnap.data() : { name: "Desconhecido" }
          };
        }));
        
        let result = docs;
        if (limit) result = docs.slice(0, limit);
        setJustificativas(result);
      } catch (error) {
        console.error("Erro ao processar justificativas:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [limit]);

  const handleAnalise = async (id: string, novoStatus: "aprovado" | "rejeitado") => {
    try {
      setIsProcessing(true);
      await updateDoc(doc(db, "justificativas", id), {
        status: novoStatus,
        comentarioGestor: comentario,
        analisadoEm: new Date(),
      });
      toast.success(`Justificativa ${novoStatus === 'aprovado' ? 'aprovada' : 'rejeitada'}!`);
      setComentario("");
      setExpandedId(null);
    } catch (error: any) {
      toast.error("Erro ao processar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      esquecimento_ponto: "Esquecimento de Ponto",
      atraso: "Atraso",
      saida_antecipada: "Saída Antecipada",
      outro: "Outro",
    };
    return labels[tipo] || tipo;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Justificativas Pendentes</CardTitle>
        <CardDescription>
          Aprove ou rejeite solicitações de ajuste de ponto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : justificativas && justificativas.length > 0 ? (
          <div className="space-y-3">
            {justificativas.map((just) => (
              <div
                key={just.id}
                className="p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {just.usuario?.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {getTipoLabel(just.tipo)}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded">
                    Pendente
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                  {just.descricao}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                  📅 {new Date(just.dataEvento).toLocaleDateString("pt-BR")}
                </p>

                {expandedId === just.id ? (
                  <div className="space-y-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Adicione um comentário (opcional)..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAnalise(just.id, "aprovado")}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleAnalise(just.id, "rejeitado")}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Rejeitar
                      </Button>
                      <Button
                        onClick={() => {
                          setExpandedId(null);
                          setComentario("");
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setExpandedId(just.id)}
                    variant="outline"
                    className="w-full"
                  >
                    Analisar
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">
              Nenhuma justificativa pendente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
