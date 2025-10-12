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
    <div className="flex flex-col h-screen" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      
      {!hideNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", active && "fill-primary")} />
                  <span className="text-xs font-medium">{tab.label}</span>
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
