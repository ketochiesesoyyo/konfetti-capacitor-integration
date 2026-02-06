import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { LayoutDashboard, PlusCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PortalHeaderProps {
  contactName: string;
}

export const PortalHeader = ({ contactName }: PortalHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesion cerrada");
    navigate("/portal/login");
  };

  const navItems = [
    { path: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { path: "/portal/request", label: "Solicitar Evento", icon: PlusCircle },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
        {/* Logo + Nav */}
        <div className="flex items-center gap-6">
          <KonfettiLogo className="w-28 h-auto" />
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={cn(
                  "gap-2",
                  location.pathname === item.path && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* User info + Logout */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {contactName}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t flex">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-colors",
              location.pathname === item.path
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
