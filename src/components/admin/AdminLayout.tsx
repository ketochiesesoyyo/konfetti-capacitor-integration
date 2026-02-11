import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isAdminDomainAllowed } from "@/lib/domain";
import { AdminSidebar } from "./AdminSidebar";

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Counts for sidebar badges
  const [leadsCount, setLeadsCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  useEffect(() => {
    checkAdminAndLoadCounts();
  }, []);

  const checkAdminAndLoadCounts = async () => {
    // Check domain first
    if (!isAdminDomainAllowed()) {
      navigate("/dashboard");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    const { data: hasAdminRole } = await supabase
      .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });

    if (!hasAdminRole) {
      toast.error("Acceso denegado. Solo administradores.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await loadCounts(session.user.id);
    setIsLoading(false);
  };

  const loadCounts = async (adminUserId: string) => {
    // Load leads count
    const { data: requestsData } = await supabase
      .from('event_requests')
      .select('status');

    if (requestsData) {
      const leads = requestsData.filter(r => r.status === 'pending' || r.status === 'contacted');
      setLeadsCount(leads.length);
    }

    // Load clients count
    const { data: clientsData } = await supabase
      .from('contacts')
      .select('status');

    if (clientsData) {
      const activeClients = clientsData.filter(c => c.status === 'active');
      setClientsCount(activeClients.length);
    }

    // Load events count
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', adminUserId);

    setEventsCount(count || 0);
  };

  // Determine active section from URL
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/admin/event/')) return 'events';
    if (path.includes('/admin/client/')) return 'clients';
    if (path === '/admin/leads') return 'leads';
    if (path === '/admin/clients') return 'clients';
    if (path === '/admin/events') return 'events';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/finance') return 'finance';
    if (path === '/admin/revenue') return 'revenue';
    return 'dashboard';
  };

  const handleSectionChange = (section: string) => {
    switch (section) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'leads':
        navigate('/admin/leads');
        break;
      case 'clients':
        navigate('/admin/clients');
        break;
      case 'events':
        navigate('/admin/events');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'finance':
        navigate('/admin/finance');
        break;
      case 'revenue':
        navigate('/admin/revenue');
        break;
    }
  };

  const handleCreateEvent = () => {
    navigate('/admin?action=create-event');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-panel min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={getActiveSection()}
        onSectionChange={handleSectionChange}
        onCreateEvent={handleCreateEvent}
        leadsCount={leadsCount}
        clientsCount={clientsCount}
        eventsCount={eventsCount}
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-0">
        {/* Mobile spacer for fixed header */}
        <div className="h-14 md:hidden" />

        {/* Outlet renders the child route */}
        <Outlet context={{ userId, refreshCounts: () => userId && loadCounts(userId) }} />
      </div>
    </div>
  );
};

// Hook to use admin context in child components
import { useOutletContext } from "react-router-dom";

interface AdminContextType {
  userId: string | null;
  refreshCounts: () => void;
}

export const useAdminContext = () => {
  return useOutletContext<AdminContextType>();
};
