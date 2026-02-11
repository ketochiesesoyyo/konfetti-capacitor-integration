import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ExternalLink, PartyPopper } from "lucide-react";
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
        <DialogHeader className="pb-2 items-center text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
                <PartyPopper className="w-4 h-4 text-yellow-800" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">¡Evento Creado!</DialogTitle>
          <DialogDescription className="text-base text-center">
            El evento ha sido creado exitosamente y está listo para recibir invitados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invite Code */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-2xl border border-primary/20 space-y-3">
            <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">
              Código de Invitación
            </p>
            <p className="text-3xl font-mono font-bold text-center tracking-[0.3em] text-primary">
              {inviteCode}
            </p>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(inviteCode, "Código")}
                className="gap-2 hover:bg-primary/10"
              >
                <Copy className="w-4 h-4" />
                Copiar Código
              </Button>
            </div>
          </div>

          {/* Invite Link */}
          <div className="bg-muted/50 p-4 rounded-xl space-y-3">
            <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">
              Link de Invitación
            </p>
            <div className="bg-background p-3 rounded-lg border">
              <p className="text-sm text-center break-all font-mono text-muted-foreground">
                {inviteLink}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(inviteLink, "Link")}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
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

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleViewDashboard} className="w-full h-12 text-base font-medium">
            Ver Dashboard del Evento
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
