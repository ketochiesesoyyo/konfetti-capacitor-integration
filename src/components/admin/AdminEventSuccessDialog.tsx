import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AdminEventSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  inviteCode: string;
}

export const AdminEventSuccessDialog = ({
  open,
  onOpenChange,
  eventId,
  inviteCode,
}: AdminEventSuccessDialogProps) => {
  const navigate = useNavigate();
  
  // Use the published domain for the invite link
  const inviteLink = `https://konfetti-capacitor-integration.lovable.app/join/${inviteCode}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleViewDashboard = () => {
    onOpenChange(false);
    navigate(`/event-dashboard/${eventId}?from=admin`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-xl">¡Evento Creado!</DialogTitle>
          <DialogDescription>
            El evento ha sido creado exitosamente y está listo para recibir invitados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invite Code */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground text-center">Código de Invitación</p>
            <p className="text-2xl font-mono font-bold text-center tracking-wider">
              {inviteCode}
            </p>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(inviteCode, "Código")}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Código
              </Button>
            </div>
          </div>

          {/* Invite Link */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground text-center">Link de Invitación</p>
            <p className="text-sm text-center break-all font-mono">
              {inviteLink}
            </p>
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(inviteLink, "Link")}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(inviteLink, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleViewDashboard} className="w-full">
            Ver Dashboard del Evento
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
