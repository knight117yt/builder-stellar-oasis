import "./global.css";
import "./lib/suppressWarnings";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import FyersCallback from "./pages/FyersCallback";
import Dashboard from "./pages/Dashboard";
import OptionChain from "./pages/OptionChain";
import Analysis from "./pages/Analysis";
import AIAnalysis from "./pages/AIAnalysis";
import StraddleChart from "./pages/StraddleChart";
import Screener from "./pages/Screener";
import AlgoCreator from "./pages/AlgoCreator";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper with Layout
function ProtectedRouteWithLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
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
              <Route path="/fyers/callback" element={<FyersCallback />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRouteWithLayout>
                    <Dashboard />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/option-chain"
                element={
                  <ProtectedRouteWithLayout>
                    <OptionChain />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/analysis"
                element={
                  <ProtectedRouteWithLayout>
                    <Analysis />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/ai-analysis"
                element={
                  <ProtectedRouteWithLayout>
                    <AIAnalysis />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/straddle-chart"
                element={
                  <ProtectedRouteWithLayout>
                    <StraddleChart />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/screener"
                element={
                  <ProtectedRouteWithLayout>
                    <Screener />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/algo-creator"
                element={
                  <ProtectedRouteWithLayout>
                    <AlgoCreator />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRouteWithLayout>
                    <Alerts />
                  </ProtectedRouteWithLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRouteWithLayout>
                    <Settings />
                  </ProtectedRouteWithLayout>
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

// Create root only once and handle hot reloads properly
const rootElement = document.getElementById("root")!;

// Check if we're in development mode and handle hot reloads
let root: any;
if (import.meta.hot) {
  // In development, store root in globalThis to persist across hot reloads
  if (!(globalThis as any).__react_root) {
    (globalThis as any).__react_root = createRoot(rootElement);
  }
  root = (globalThis as any).__react_root;
} else {
  // In production, create root normally
  root = createRoot(rootElement);
}

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
