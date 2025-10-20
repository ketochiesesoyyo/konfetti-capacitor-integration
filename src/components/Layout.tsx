import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, User, Heart, MessageCircle, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/", icon: Home, label: "Events" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/matchmaking", icon: PartyPopper, label: "Match" },
    { path: "/liked", icon: Heart, label: "Liked" },
    { path: "/chats", icon: MessageCircle, label: "Chats" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Hide bottom nav on auth pages
  const hideNav = location.pathname.includes("/auth");

  return (
    <div className="flex flex-col h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <main className="flex-1 overflow-y-auto pb-24 px-1">{children}</main>
      
      {!hideNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 glass-light border-t border-border/50 shadow-heavy z-50 backdrop-blur-xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl transition-all duration-300",
                    active
                      ? "text-primary bg-primary/10 shadow-soft scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:scale-105"
                  )}
                >
                  <Icon className={cn("w-6 h-6 transition-all", active && "fill-primary")} />
                  <span className={cn("text-xs font-medium", active && "font-semibold")}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
