import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type UnmatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchedUserId: string;
  matchedUserName: string;
  matchId: string;
  eventId: string;
  onUnmatchComplete: () => void;
};

export const UnmatchDialog = ({
  open,
  onOpenChange,
  matchedUserId,
  matchedUserName,
  matchId,
  eventId,
  onUnmatchComplete,
}: UnmatchDialogProps) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const UNMATCH_REASONS = [
    t('unmatchDialog.reasonNoInterest'),
    t('unmatchDialog.reasonFoundSomeone'),
    t('unmatchDialog.reasonInappropriate'),
    t('unmatchDialog.reasonNoChemistry'),
    t('unmatchDialog.reasonOther'),
  ];

  const handleUnmatch = async () => {
    if (!selectedReason) {
      toast.error(t('unmatchDialog.selectReason'));
      return;
    }

    if (selectedReason === t('unmatchDialog.reasonOther') && !description.trim()) {
      toast.error(t('unmatchDialog.provideDescription'));
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('unmatchDialog.mustBeLoggedIn'));
        return;
      }

      // Use transactional function to ensure atomic operations
      const { error } = await supabase.rpc("unmatch_user_transaction", {
        _unmatcher_id: session.user.id,
        _unmatched_user_id: matchedUserId,
        _event_id: eventId,
        _match_id: matchId,
        _reason: selectedReason,
        _description: selectedReason === t('unmatchDialog.reasonOther') ? description : null,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Unauthorized")) {
          toast.error(t('unmatchDialog.noPermission'));
        } else if (error.code === "23505") {
          // Duplicate key violation - already unmatched
          toast.info(t('unmatchDialog.alreadyUnmatched'));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t('unmatchDialog.unmatchSuccess'));
      onOpenChange(false);
      onUnmatchComplete();
    } catch (error) {
      console.error("Error unmatching:", error);
      toast.error(t('unmatchDialog.unmatchFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-5 h-5" />
            <DialogTitle>{t('unmatchDialog.title', { name: matchedUserName })}</DialogTitle>
          </div>
          <DialogDescription>
            {t('unmatchDialog.whyUnmatch')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {UNMATCH_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={`unmatch-${reason}`} />
                <Label htmlFor={`unmatch-${reason}`} className="cursor-pointer font-normal">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === t('unmatchDialog.reasonOther') && (
            <div className="space-y-2">
              <Label htmlFor="unmatch-description">{t('unmatchDialog.provideDetails')}</Label>
              <Textarea
                id="unmatch-description"
                placeholder="Tell us more..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/300 characters
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
            {t('unmatchDialog.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnmatch}
            disabled={submitting || !selectedReason}
          >
            {submitting ? "Unmatching..." : t('unmatchDialog.unmatch')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
