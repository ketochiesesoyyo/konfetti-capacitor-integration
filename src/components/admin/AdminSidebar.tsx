import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  action?: () => void;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onCreateEvent: () => void;
  leadsCount: number;
  clientsCount: number;
  eventsCount: number;
}

export const AdminSidebar = ({
  activeSection,
  onSectionChange,
  onCreateEvent,
  leadsCount,
  clientsCount,
  eventsCount,
}: AdminSidebarProps) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections: NavSection[] = [
    {
      title: "General",
      items: [
        { id: "dashboard", label: "Panel", icon: LayoutDashboard },
      ],
    },
    {
      title: "CRM",
      items: [
        { id: "leads", label: "Leads", icon: Users, badge: leadsCount },
        { id: "clients", label: "Clientes", icon: UserCheck, badge: clientsCount },
      ],
    },
    {
      title: "Eventos",
      items: [
        { id: "events", label: "Todos", icon: CalendarDays, badge: eventsCount },
        { id: "new-event", label: "Crear Nuevo", icon: Plus, action: onCreateEvent },
      ],
    },
  ];

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(
      "flex flex-col h-full bg-card border-r",
      isCollapsed && !isMobile ? "w-[70px]" : "w-[240px]",
      "transition-all duration-300"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b",
        isCollapsed && !isMobile ? "justify-center" : "justify-between"
      )}>
        {(!isCollapsed || isMobile) && (
          <h1 className="text-lg font-bold text-primary">Konfetti Admin</h1>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {(!isCollapsed || isMobile) && (
              <h2 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h2>
            )}
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        onSectionChange(item.id);
                      }
                      if (isMobile) setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isCollapsed && !isMobile && "justify-center px-2"
                    )}
                    title={isCollapsed && !isMobile ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                    {(!isCollapsed || isMobile) && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-2 space-y-1">
        <button
          onClick={() => navigate("/dashboard")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            isCollapsed && !isMobile && "justify-center px-2"
          )}
          title={isCollapsed && !isMobile ? "Volver al Dashboard" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && <span>Volver al Dashboard</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-40 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-primary">Konfetti Admin</h1>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <NavContent isMobile />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40">
        <NavContent />
      </div>

      {/* Spacer for content */}
      <div className={cn(
        "hidden md:block flex-shrink-0 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )} />
    </>
  );
};
