import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import DashboardColaborador from "./pages/DashboardColaborador";
import DashboardGestor from "./pages/DashboardGestor";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/404" component={NotFound} />
      
      {/* Rotas protegidas por role */}
      <Route path="/">
        {isAuthenticated && user ? (
          user.role === "colaborador" ? (
            <DashboardColaborador />
          ) : (
            <DashboardGestor />
          )
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/colaborador/*" component={DashboardColaborador} />
      <Route path="/gestor/*" component={DashboardGestor} />
      
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
