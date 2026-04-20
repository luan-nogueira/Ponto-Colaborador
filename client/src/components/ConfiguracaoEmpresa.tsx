import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ConfiguracaoEmpresa() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    horaEntrada: "08:00",
    horaSaida: "17:00",
    toleranciaAtraso: 15,
    intervaloMinutos: 60,
    raioGeofencing: 100,
    totalColaboradores: 0,
    updatedAt: null as any
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, "configuracoes", "empresa"));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setFormData({
            horaEntrada: data.horaEntrada || "08:00",
            horaSaida: data.horaSaida || "17:00",
            toleranciaAtraso: data.toleranciaAtraso || 15,
            intervaloMinutos: data.intervaloMinutos || 60,
            raioGeofencing: data.raioGeofencing || 100,
            totalColaboradores: data.totalColaboradores || 0,
            updatedAt: data.updatedAt?.toDate() || null
          });
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSalvar = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "configuracoes", "empresa"), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Horários de Trabalho */}
      <Card>
        <CardHeader>
          <CardTitle>Horários de Trabalho</CardTitle>
          <CardDescription>
            Configure os horários padrão da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hora de Entrada
              </label>
              <input
                type="time"
                value={formData.horaEntrada}
                onChange={(e) => handleChange("horaEntrada", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hora de Saída
              </label>
              <input
                type="time"
                value={formData.horaSaida}
                onChange={(e) => handleChange("horaSaida", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tolerâncias */}
      <Card>
        <CardHeader>
          <CardTitle>Tolerâncias</CardTitle>
          <CardDescription>
            Configure as tolerâncias de atraso e intervalo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tolerância de Atraso (minutos)
              </label>
              <input
                type="number"
                value={formData.toleranciaAtraso}
                onChange={(e) =>
                  handleChange("toleranciaAtraso", parseInt(e.target.value))
                }
                min="0"
                max="60"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tempo permitido de atraso sem penalidade
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Duração do Intervalo (minutos)
              </label>
              <input
                type="number"
                value={formData.intervaloMinutos}
                onChange={(e) =>
                  handleChange("intervaloMinutos", parseInt(e.target.value))
                }
                min="15"
                max="180"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Duração padrão do intervalo de almoço
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geofencing */}
      <Card>
        <CardHeader>
          <CardTitle>Geofencing</CardTitle>
          <CardDescription>
            Configure a área permitida para registros de ponto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Raio Permitido (metros)
            </label>
            <input
              type="number"
              value={formData.raioGeofencing}
              onChange={(e) =>
                handleChange("raioGeofencing", parseInt(e.target.value))
              }
              min="10"
              max="1000"
              step="10"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Distância máxima do local de trabalho para registrar ponto
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSalvar}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Total de Colaboradores
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {formData.totalColaboradores || 0}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Última Atualização
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {formData.updatedAt
                  ? new Date(formData.updatedAt).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
