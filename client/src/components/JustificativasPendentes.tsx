import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function JustificativasPendentes() {
  const { data: justificativas, isLoading, refetch } = trpc.justificativas.getPendentes.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");

  const aprovarMutation = trpc.justificativas.aprovar.useMutation();
  const rejeitarMutation = trpc.justificativas.rejeitar.useMutation();

  const handleAprovar = async (id: number) => {
    try {
      await aprovarMutation.mutateAsync({
        id,
        comentario,
      });
      toast.success("Justificativa aprovada!");
      setComentario("");
      setExpandedId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar");
    }
  };

  const handleRejeitar = async (id: number) => {
    try {
      await rejeitarMutation.mutateAsync({
        id,
        comentario,
      });
      toast.success("Justificativa rejeitada!");
      setComentario("");
      setExpandedId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar");
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
                        onClick={() => handleAprovar(just.id)}
                        disabled={aprovarMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {aprovarMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleRejeitar(just.id)}
                        disabled={rejeitarMutation.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        {rejeitarMutation.isPending ? (
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
