import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Konfetti Privacy Policy</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 overflow-auto">
          <div className="legal-content space-y-4 text-sm">
            <PrivacyPolicyContent />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
