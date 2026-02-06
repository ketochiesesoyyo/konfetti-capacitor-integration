import { useEffect, useState } from "react";
import { useNavigate, Outlet, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PortalHeader } from "./PortalHeader";

interface PortalContextType {
  contactId: string;
  contactName: string;
  userId: string;
}

export const PortalLayout = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [portalContext, setPortalContext] = useState<PortalContextType | null>(null);

  useEffect(() => {
    checkClientAccess();
  }, []);

  const checkClientAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/portal/login");
      return;
    }

    // Verify client role
    const { data: hasClientRole } = await supabase
      .rpc('has_role', { _user_id: session.user.id, _role: 'client' });

    if (!hasClientRole) {
      navigate("/portal/login");
      return;
    }

    // Load the linked contact record
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('id, contact_name')
      .eq('user_id', session.user.id)
      .single();

    if (error || !contact) {
      navigate("/portal/login");
      return;
    }

    setPortalContext({
      contactId: contact.id,
      contactName: contact.contact_name,
      userId: session.user.id,
    });
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!portalContext) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader contactName={portalContext.contactName} />
      <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <Outlet context={portalContext} />
      </main>
    </div>
  );
};

export const usePortalContext = () => {
  return useOutletContext<PortalContextType>();
};
