import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";

interface RelatorioData {
  totalRegistros: number;
  diasTrabalhados: number;
  atrasos: number;
  faltas: number;
  registros: any[];
}

export default function Relatorios() {
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    usuarioId: "",
  });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);

  // Buscar lista de usuários para o filtro
  useEffect(() => {
    const fetchUsuarios = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsuarios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsuarios();
  }, []);

  const handleFiltrar = async () => {
    setIsLoading(true);
    try {
      const start = new Date(filtros.dataInicio);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filtros.dataFim);
      end.setHours(23, 59, 59, 999);

      let q = query(
        collection(db, "pontos"),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end)),
        orderBy("timestamp", "desc")
      );

      const snap = await getDocs(q);
      let rows = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataRegistro: doc.data().timestamp?.toDate() || new Date()
      }));

      // Filtro de usuário (feito no cliente para evitar índices compostos excessivos por agora)
      if (filtros.usuarioId) {
        rows = rows.filter(r => r.userId === filtros.usuarioId);
      }

      // Cálculos básicos
      const uniqueDays = new Set(rows.map(r => r.dataRegistro.toDateString()));
      
      setRelatorio({
        totalRegistros: rows.length,
        diasTrabalhados: uniqueDays.size,
        atrasos: 0, // Requer lógica de horário de trabalho
        faltas: 0,  // Requer lógica de dias úteis
        registros: rows
      });

    } catch (error: any) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportar = async (formato: "pdf" | "excel") => {
    toast.info(`Exportando relatório em ${formato.toUpperCase()} (Mock)...`);
    setTimeout(() => {
      toast.success(`Relatório exportado com sucesso!`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório</CardTitle>
          <CardDescription>
            Selecione o período e colaborador para gerar o relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Colaborador (Opcional)
              </label>
              <select
                value={filtros.usuarioId}
                onChange={(e) => setFiltros({ ...filtros, usuarioId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">Todos</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleFiltrar} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {relatorio && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Relatório de Ponto</CardTitle>
              <CardDescription>
                Recuperados {relatorio.registros.length} registros
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleExportar("pdf")} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button onClick={() => handleExportar("excel")} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem label="Total Registros" value={relatorio.totalRegistros} color="blue" />
              <StatItem label="Dias Trabalhados" value={relatorio.diasTrabalhados} color="green" />
              <StatItem label="Atrasos" value={relatorio.atrasos} color="orange" />
              <StatItem label="Faltas" value={relatorio.faltas} color="red" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Colaborador</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.registros.map((reg, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        {reg.dataRegistro.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {reg.userName || "N/A"}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">
                        {reg.tipo.replace("_", " ")}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {reg.dataRegistro.toLocaleTimeString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300",
    green: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300",
    orange: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-300",
    red: "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300",
  };
  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
