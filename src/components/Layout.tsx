import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Heart, MessageCircle, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import MatchIconNormal from "@/assets/match-icon-normal.svg";
import MatchIconActive from "@/assets/match-icon-purple.svg";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/", icon: PartyPopper, label: "Events" },
    { path: "/matchmaking", customIcon: true, label: "" },
    { path: "/liked", icon: Heart, label: "Liked" },
    { path: "/chats", icon: MessageCircle, label: "Chats" },
  ] as const;

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Hide bottom nav on auth pages
  const hideNav = location.pathname.includes("/auth");

  return (
    <div className="flex flex-col h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <main className="flex-1 overflow-y-auto pb-28 px-1">{children}</main>
      
      {!hideNav && (
        <nav 
          className="fixed bottom-6 left-0 right-0 z-50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="glass-light border border-border/50 shadow-heavy backdrop-blur-xl rounded-full max-w-lg mx-auto">
            <div className="flex justify-around items-center h-16 px-6">
              {tabs.map((tab) => {
                const active = isActive(tab.path);
                
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-full transition-all duration-300",
                      active
                        ? "text-primary bg-primary/10 shadow-soft"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {"customIcon" in tab && tab.customIcon ? (
                      <img 
                        src={active ? MatchIconActive : MatchIconNormal} 
                        alt="Match"
                        className="w-7 h-7 transition-all"
                      />
                    ) : (
                      "icon" in tab && tab.icon && <tab.icon className={cn("w-7 h-7 transition-all", active && "fill-primary")} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
