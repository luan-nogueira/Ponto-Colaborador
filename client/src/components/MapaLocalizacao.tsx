import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import MapView from "@/components/Map";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function MapaLocalizacao() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistro, setSelectedRegistro] = useState<any>(null);

  useEffect(() => {
    // Buscar registros que tenham latitude e longitude
    // Nota: Para evitar erro de índice no Firestore por agora, faremos o filtro de coordenadas no cliente 
    // se o índice composto (timestamp + latitude) não estiver configurado.
    // Mas o ideal é: where("latitude", "!=", null)
    const q = query(
      collection(db, "pontos"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataRegistro: (doc.data() as any).timestamp?.toDate() || new Date()
        } as any))
        .filter(r => r.latitude && r.longitude);
      
      setRegistros(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao carregar mapa:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMapReady = (map: google.maps.Map) => {
    if (!registros || registros.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    registros.forEach((registro) => {
      const position = {
        lat: parseFloat(registro.latitude),
        lng: parseFloat(registro.longitude),
      };

      // Usando Marker clássico para compatibilidade com o código original
      new google.maps.Marker({
        position,
        map,
        title: `${registro.userName || 'Colaborador'} - ${getTipoLabel(registro.tipo)}`,
        icon: getTipoIcon(registro.tipo),
      });

      bounds.extend(position);
    });

    if (registros.length > 0) {
      map.fitBounds(bounds);
    }
  };

  const getTipoIcon = (tipo: string) => {
    const colors: Record<string, string> = {
      entrada: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
      saida: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      intervalo_inicio: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
      intervalo_fim: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    };
    return colors[tipo] || "http://maps.google.com/mapfiles/ms/icons/gray-dot.png";
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      entrada: "Entrada",
      saida: "Saída",
      intervalo_inicio: "Intervalo",
      intervalo_fim: "Retorno",
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Localização</CardTitle>
            <CardDescription>
              Visualize os registros de ponto no mapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : registros && registros.length > 0 ? (
              <div className="w-full h-96 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <MapView onMapReady={handleMapReady} />
              </div>
            ) : (
              <div className="flex items-center justify-center py-32 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">
                  Nenhum registro com localização encontrado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <LegendItem color="bg-green-500" label="Entrada" />
            <LegendItem color="bg-red-500" label="Saída" />
            <LegendItem color="bg-orange-500" label="Intervalo" />
            <LegendItem color="bg-blue-500" label="Retorno" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registros com GPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {registros.length > 0 ? (
                registros.slice(0, 10).map((registro) => (
                  <button
                    key={registro.id}
                    onClick={() => setSelectedRegistro(registro)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      selectedRegistro?.id === registro.id
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {registro.userName || "Colaborador"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {getTipoLabel(registro.tipo)} • {registro.dataRegistro.toLocaleTimeString("pt-BR")}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum registro</p>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedRegistro && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailItem label="Colaborador" value={selectedRegistro.userName} />
              <DetailItem label="Tipo" value={getTipoLabel(selectedRegistro.tipo)} />
              <DetailItem label="Horário" value={selectedRegistro.dataRegistro.toLocaleString("pt-BR")} />
              {selectedRegistro.endereco && <DetailItem label="Local" value={selectedRegistro.endereco} />}
              <DetailItem label="Coordenadas" value={`${selectedRegistro.latitude}, ${selectedRegistro.longitude}`} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      <p className="text-slate-600 dark:text-slate-400">{value}</p>
    </div>
  );
}
