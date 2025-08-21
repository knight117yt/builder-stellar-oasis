import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Settings,
  Menu,
  X,
  LogOut,
  Brain,
  PieChart,
  LineChart,
  User,
  AlertTriangle,
  Search,
  Bot,
  Target,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Option Chain", href: "/option-chain", icon: PieChart },
  { name: "Analysis", href: "/analysis", icon: LineChart },
  { name: "AI Analysis", href: "/ai-analysis", icon: Brain },
  { name: "Straddle Chart", href: "/straddle-chart", icon: Target },
  { name: "Screener", href: "/screener", icon: Search },
  { name: "Algo Creator", href: "/algo-creator", icon: Bot },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const authMode = localStorage.getItem("auth_mode") || "mock";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem("fyers_token");
      localStorage.removeItem("auth_mode");
      navigate("/login");
    }
  };

  return (
    <div className="bg-background" style={{ minHeight: "1100px" }}>
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border">
          <SidebarContent onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-sidebar border-r border-sidebar-border">
          <SidebarContent onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-full lg:px-8">
          <div className="flex h-16 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
            <Button
              variant="ghost"
              className="-m-2.5 p-2.5 text-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Separator */}
            <div className="h-6 w-px bg-border lg:hidden" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1 items-center gap-3">
                <h1 className="text-lg font-semibold text-foreground">
                  Indian Market Predictors
                </h1>
                {authMode === "mock" && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full border border-yellow-200">
                    DEMO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="flex items-center gap-x-2">
                  <div className="text-sm text-muted-foreground">
                    NIFTY:{" "}
                    <span className="text-trading-bull font-medium">
                      19,850.50
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    BANKNIFTY:{" "}
                    <span className="text-trading-bear font-medium">
                      44,250.75
                    </span>
                  </div>
                </div>
                <ThemeToggle />
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout?: () => void }) {
  const location = useLocation();

  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">
              Market Predictors
            </div>
            <div className="text-xs text-sidebar-foreground/60">
              Trading Platform
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col p-6">
        <ul className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </nav>
    </>
  );
}
