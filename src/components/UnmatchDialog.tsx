import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UnmatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchedUserId: string;
  matchedUserName: string;
  matchId: string;
  eventId: string;
  onUnmatchComplete: () => void;
};

const UNMATCH_REASONS = [
  "We didn't click",
  "I'm no longer interested",
  "Conversation stalled",
  "Personal preference",
  "I prefer not to say",
  "Other",
];

export const UnmatchDialog = ({
  open,
  onOpenChange,
  matchedUserId,
  matchedUserName,
  matchId,
  eventId,
  onUnmatchComplete,
}: UnmatchDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleUnmatch = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }

    if (selectedReason === "Other" && !description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      // 1. Create unmatch record
      const { error: unmatchError } = await supabase
        .from("unmatches")
        .insert({
          unmatcher_id: session.user.id,
          unmatched_user_id: matchedUserId,
          event_id: eventId,
          match_id: matchId,
          reason: selectedReason,
          description: selectedReason === "Other" ? description : null,
        });

      if (unmatchError) throw unmatchError;

      // 2. Create audit log
      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert({
          action_type: "unmatch",
          actor_id: session.user.id,
          target_id: matchedUserId,
          event_id: eventId,
          match_id: matchId,
          reason: selectedReason,
          description: selectedReason === "Other" ? description : null,
          metadata: { matched_user_name: matchedUserName },
        });

      if (auditError) console.error("Audit log error:", auditError);

      // 3. Delete the swipe (unlike) so profile can reappear in matchmaking
      const { error: deleteSwipeError } = await supabase
        .from("swipes")
        .delete()
        .eq("user_id", session.user.id)
        .eq("swiped_user_id", matchedUserId)
        .eq("event_id", eventId);

      if (deleteSwipeError) console.error("Delete swipe error:", deleteSwipeError);

      // 4. Delete messages (soft delete by keeping in audit)
      const { error: deleteMessagesError } = await supabase
        .from("messages")
        .delete()
        .eq("match_id", matchId);

      if (deleteMessagesError) console.error("Delete messages error:", deleteMessagesError);

      // 5. Delete match
      const { error: deleteMatchError } = await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (deleteMatchError) throw deleteMatchError;

      toast.success("You've unmatched successfully");
      onOpenChange(false);
      onUnmatchComplete();
    } catch (error) {
      console.error("Error unmatching:", error);
      toast.error("Failed to unmatch. Please try again.");
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
            <DialogTitle>Unmatch {matchedUserName}</DialogTitle>
          </div>
          <DialogDescription>
            This will remove your chat with {matchedUserName}. They won't be notified, but you won't be able to match again in this event.
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

          {selectedReason === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="unmatch-description">Please provide details (optional)</Label>
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
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnmatch}
            disabled={submitting || !selectedReason}
          >
            {submitting ? "Unmatching..." : "Unmatch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
