import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePortalContext } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const PortalNewRequest = () => {
  const navigate = useNavigate();
  const { contactId, contactName } = usePortalContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [contactInfo, setContactInfo] = useState<{
    email: string;
    phone: string;
    company_name: string;
  }>({ email: "", phone: "", company_name: "" });

  const [formData, setFormData] = useState({
    partner1Name: "",
    partner2Name: "",
    weddingDate: "",
    expectedGuests: "",
    message: "",
  });

  // Pre-fill contact info
  useEffect(() => {
    const loadContactInfo = async () => {
      const { data } = await supabase
        .from('contacts')
        .select('email, phone, companies(name)')
        .eq('id', contactId)
        .single();

      if (data) {
        setContactInfo({
          email: data.email || "",
          phone: data.phone || "",
          company_name: (data.companies as any)?.name || "",
        });
      }
    };
    loadContactInfo();
  }, [contactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.partner1Name.trim() || !formData.partner2Name.trim()) {
      toast.error("Los nombres de los novios son requeridos");
      return;
    }

    if (!formData.weddingDate) {
      toast.error("La fecha del evento es requerida");
      return;
    }

    if (!formData.expectedGuests || parseInt(formData.expectedGuests) <= 0) {
      toast.error("El número de invitados esperados es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('event_requests')
        .insert({
          contact_name: contactName,
          email: contactInfo.email,
          phone: contactInfo.phone || "",
          company_name: contactInfo.company_name || null,
          partner1_name: formData.partner1Name.trim(),
          partner2_name: formData.partner2Name.trim(),
          wedding_date: formData.weddingDate,
          expected_guests: parseInt(formData.expectedGuests),
          message: formData.message.trim() || null,
          submitter_type: "client_portal",
          status: "pending",
        });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Solicitud enviada exitosamente");
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Error al enviar solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
        <h2 className="text-2xl font-bold">Solicitud Enviada</h2>
        <p className="text-muted-foreground">
          Tu solicitud ha sido recibida. Nos pondremos en contacto contigo pronto para confirmar los detalles.
        </p>
        <Button onClick={() => navigate("/portal")}>
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Solicitar Nuevo Evento</h1>
        <p className="text-muted-foreground">Completa el formulario para solicitar un nuevo evento Konfetti</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Detalles del Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pre-filled contact info (read-only) */}
            <div className="p-4 bg-muted/30 rounded-xl space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Información de Contacto</p>
              <p className="text-sm">{contactName}</p>
              {contactInfo.email && <p className="text-sm text-muted-foreground">{contactInfo.email}</p>}
              {contactInfo.phone && <p className="text-sm text-muted-foreground">{contactInfo.phone}</p>}
              {contactInfo.company_name && <p className="text-sm text-muted-foreground">{contactInfo.company_name}</p>}
            </div>

            {/* Partner Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner1">Nombre Novio/a 1 *</Label>
                <Input
                  id="partner1"
                  value={formData.partner1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner1Name: e.target.value }))}
                  placeholder="ej., María"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner2">Nombre Novio/a 2 *</Label>
                <Input
                  id="partner2"
                  value={formData.partner2Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner2Name: e.target.value }))}
                  placeholder="ej., Carlos"
                  className="h-11"
                  required
                />
              </div>
            </div>

            {/* Wedding Date */}
            <div className="space-y-2">
              <Label htmlFor="weddingDate">Fecha del Evento *</Label>
              <Input
                id="weddingDate"
                type="date"
                value={formData.weddingDate}
                onChange={(e) => setFormData(prev => ({ ...prev, weddingDate: e.target.value }))}
                className="h-11"
                required
              />
            </div>

            {/* Expected Guests */}
            <div className="space-y-2">
              <Label htmlFor="expectedGuests">Invitados Esperados *</Label>
              <Input
                id="expectedGuests"
                type="number"
                min="1"
                value={formData.expectedGuests}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedGuests: e.target.value }))}
                placeholder="ej., 150"
                className="h-11"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje (opcional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Cualquier detalle adicional sobre el evento..."
                rows={4}
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalNewRequest;
