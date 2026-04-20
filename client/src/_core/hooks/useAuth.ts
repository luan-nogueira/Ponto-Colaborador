import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
// No getLoginUrl imported
type UserRole = "admin" | "gestor" | "colaborador";

interface UserProfile {
  id: string;
  uid: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  cargo?: string;
  setor?: string;
  numeroMatricula?: string;
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};

  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              id: user.uid,
              uid: user.uid,
              name: data.name || user.displayName,
              email: data.email || user.email,
              role: data.role || "colaborador",
              cargo: data.cargo,
              setor: data.setor,
              numeroMatricula: data.numeroMatricula
            });
          } else {
            console.log("Usuário novo detectado. Criando no Firestore...");
            const newProfile = {
              uid: user.uid,
              name: user.displayName || "Usuário",
              email: user.email || "",
              role: "colaborador" as UserRole,
              createdAt: new Date().toISOString()
            };
            
            try {
               await setDoc(doc(db, "users", user.uid), newProfile);
            } catch (createErr) {
               console.warn("Não foi possível criar documento do usuário, usando apenas Auth", createErr);
            }

            setProfile({
              id: user.uid,
              ...newProfile
            });
          }
        } catch (err: any) {
          console.error("Erro crítico ao buscar perfil do usuário:", err);
          toast.error(`Erro Firestore: ${err.message}`);
          setError(err);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, []);

  const state = useMemo(() => {
    const isAuthenticated = !!fbUser;
    const user = profile ? {
      ...profile,
      openId: profile.uid,
    } : null;

    if (user) {
       localStorage.setItem("ponto-runtime-user-info", JSON.stringify(user));
    }

    return {
      user,
      loading,
      error,
      isAuthenticated,
    };
  }, [fbUser, profile, loading, error]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, state.isAuthenticated]);

  return {
    ...state,
    refresh: () => {}, 
    logout,
  };
}
