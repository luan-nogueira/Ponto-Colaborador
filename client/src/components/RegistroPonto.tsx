import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapPin, Clock, CheckCircle2, Loader2 } from "lucide-react";

export default function RegistroPonto() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_FRONTEND_FORGE_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
              setAddress(data.results[0].formatted_address);
            }
          } catch (error) {
            console.error("Erro ao obter endereço:", error);
          }
        },
        (error) => {
          console.error("Erro de geolocalização:", error);
          toast.error("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        }
      );
    }
  }, []);

  const handleRegistro = async (tipo: string) => {
    if (!user) return;
    setLoading(true);

    try {
      // Validação de sequência (ex: não permitir duas entradas seguidas)
      const q = query(
        collection(db, "pontos"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const lastSession = await getDocs(q);
      const lastType = lastSession.docs[0]?.data()?.tipo;

      if (lastType === tipo && (tipo === "entrada" || tipo === "saida")) {
        // Permitir registrar se for intervalo, mas avisar se for duplicado
        toast.warning(`Seu último registro já foi uma ${tipo}.`);
      }

      await addDoc(collection(db, "pontos"), {
        userId: user.uid,
        userName: user.name || user.email,
        tipo,
        timestamp: serverTimestamp(),
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        endereco: address || "Localização não disponível",
        device: navigator.userAgent
      });

      toast.success(`Registro de ${tipo} realizado com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao registrar ponto:", error);
      toast.error("Erro ao registrar ponto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {currentTime.toLocaleTimeString("pt-BR")}
        </CardTitle>
        <CardDescription className="text-lg font-medium text-slate-500 dark:text-slate-400">
          {currentTime.toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8 p-8">
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Localização Atual</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {address || "Obtendo localização..."}
            </p>
          </div>
          {location && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <PontoButton 
            onClick={() => handleRegistro("entrada")} 
            disabled={loading} 
            variant="success" 
            label="Entrada" 
            sub="Início da jornada"
          />
          <PontoButton 
            onClick={() => handleRegistro("intervalo_inicio")} 
            disabled={loading} 
            variant="warning" 
            label="Intervalo" 
            sub="Pausa para almoço"
          />
          <PontoButton 
            onClick={() => handleRegistro("intervalo_fim")} 
            disabled={loading} 
            variant="info" 
            label="Retorno" 
            sub="Fim do intervalo"
          />
          <PontoButton 
            onClick={() => handleRegistro("saida")} 
            disabled={loading} 
            variant="danger" 
            label="Saída" 
            sub="Fim da jornada"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PontoButton({ onClick, disabled, variant, label, sub }: any) {
  const styles = {
    success: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none",
    info: "bg-sky-500 hover:bg-sky-600 shadow-sky-200 dark:shadow-none",
    danger: "bg-rose-500 hover:bg-rose-600 shadow-rose-200 dark:shadow-none",
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`h-24 flex flex-col gap-1 transition-all hover:scale-[1.02] active:scale-100 shadow-lg ${styles[variant as keyof typeof styles]}`}
    >
      <span className="text-lg font-bold">{label}</span>
      <span className="text-[10px] opacity-80 font-normal uppercase tracking-wider">{sub}</span>
    </Button>
  );
}
