import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AlertProvider } from "@/contexts/AlertContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OptionChain from "./pages/OptionChain";
import Analysis from "./pages/Analysis";
import AIAnalysis from "./pages/AIAnalysis";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("fyers_token");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AlertProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/option-chain"
                element={
                  <ProtectedRoute>
                    <OptionChain />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis"
                element={
                  <ProtectedRoute>
                    <Analysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-analysis"
                element={
                  <ProtectedRoute>
                    <AIAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <Alerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AlertProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// Only create root if it doesn't exist
const rootElement = document.getElementById("root")!;
if (!rootElement._reactRootContainer) {
  const root = createRoot(rootElement);
  rootElement._reactRootContainer = root;
  root.render(<App />);
} else {
  // If root already exists, just re-render
  rootElement._reactRootContainer.render(<App />);
}
