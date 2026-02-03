import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type BlockUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedUserId: string;
  blockedUserName: string;
  matchId?: string | null;
  eventId: string;
  onBlockComplete?: () => void;
};

const BLOCK_REASONS = [
  "inappropriate_behavior",
  "harassment",
  "made_uncomfortable",
  "spam_fake",
  "other",
];

export const BlockUserDialog = ({
  open,
  onOpenChange,
  blockedUserId,
  blockedUserName,
  matchId,
  eventId,
  onBlockComplete,
}: BlockUserDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error(t('blockDialog.selectReason'));
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('blockDialog.mustBeLoggedIn'));
        return;
      }

      const reasonText = selectedReason === "other" 
        ? customReason || t('blockDialog.reasons.other')
        : t(`blockDialog.reasons.${selectedReason}`);

      // Call the block_user_transaction function
      const { error } = await supabase.rpc("block_user_transaction", {
        _blocker_id: session.user.id,
        _blocked_id: blockedUserId,
        _event_id: eventId,
        _match_id: matchId || null,
        _reason: reasonText,
      });

      if (error) {
        console.error("Block error:", error);
        if (error.message.includes("Unauthorized")) {
          toast.error(t('blockDialog.unauthorized'));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t('blockDialog.success', { name: blockedUserName }));
      onOpenChange(false);
      
      if (onBlockComplete) {
        onBlockComplete();
      } else {
        // Default: navigate back to chats
        navigate("/chats");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(t('blockDialog.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <ShieldOff className="w-5 h-5" />
            <DialogTitle>{t('blockDialog.title', { name: blockedUserName })}</DialogTitle>
          </div>
          <DialogDescription>
            {t('blockDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p className="font-medium mb-1">{t('blockDialog.whatHappens')}</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t('blockDialog.effect1')}</li>
              <li>{t('blockDialog.effect2')}</li>
              <li>{t('blockDialog.effect3')}</li>
              <li>{t('blockDialog.effect4')}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label>{t('blockDialog.reasonLabel')}</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {BLOCK_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={`block-${reason}`} />
                  <Label htmlFor={`block-${reason}`} className="cursor-pointer font-normal">
                    {t(`blockDialog.reasons.${reason}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-block-reason">{t('blockDialog.detailsLabel')}</Label>
              <Textarea
                id="custom-block-reason"
                placeholder={t('blockDialog.detailsPlaceholder')}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {customReason.length}/500
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !selectedReason}
          >
            {submitting ? t('blockDialog.blocking') : t('blockDialog.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
