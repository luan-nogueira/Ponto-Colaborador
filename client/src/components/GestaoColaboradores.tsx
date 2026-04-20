import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Search, Filter } from "lucide-react";

export default function GestaoColaboradores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroSetor, setFiltroSetor] = useState<string>("");

  const { data: colaboradores, isLoading } = trpc.usuarios.getColaboradores.useQuery();

  const filtrados = colaboradores?.filter((col) => {
    const matchSearch =
      col.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSetor = !filtroSetor || col.setor === filtroSetor;
    return matchSearch && matchSetor;
  }) || [];

  const setores = [...new Set(colaboradores?.map((c) => c.setor).filter(Boolean))];

  const getStatusBadge = (ativo: boolean) => {
    if (ativo) {
      return {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-700 dark:text-green-300",
        label: "Ativo",
      };
    }
    return {
      bg: "bg-red-100 dark:bg-red-900",
      text: "text-red-700 dark:text-red-300",
      label: "Inativo",
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Colaboradores</CardTitle>
        <CardDescription>
          Visualize e gerencie todos os colaboradores da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <select
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Todos os setores</option>
              {setores.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Colaboradores */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : filtrados.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Cargo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Setor
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((colaborador) => {
                  const statusBadge = getStatusBadge(colaborador.ativo);
                  return (
                    <tr
                      key={colaborador.id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                        {colaborador.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {colaborador.email}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {colaborador.cargo}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {colaborador.setor}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Ver Registros
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum colaborador encontrado
              </p>
            </div>
          )}
        </div>

        {/* Resumo */}
        {filtrados.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Exibindo <span className="font-semibold">{filtrados.length}</span> de{" "}
              <span className="font-semibold">{colaboradores?.length}</span> colaboradores
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
