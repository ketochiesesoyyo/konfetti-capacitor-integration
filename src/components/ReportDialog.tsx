import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { reportSchema } from "@/lib/validation";

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
  matchId: string;
  eventId: string;
  onReportSubmit: () => void;
};

const REPORT_REASONS = [
  "Inappropriate behavior",
  "Harassment",
  "Fake profile",
  "Spam",
  "Offensive content",
  "Safety concerns",
  "Other",
];

export const ReportDialog = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  matchId,
  eventId,
  onReportSubmit,
}: ReportDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate input
    const validationResult = reportSchema.safeParse({
      reason: selectedReason,
      custom_reason: selectedReason === "Other" ? customReason : undefined,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to report");
        return;
      }

      const validated = validationResult.data;

      // 1. Insert report
      const { error: reportError } = await supabase.from("reports").insert({
        reporter_id: session.user.id,
        reported_user_id: reportedUserId,
        match_id: matchId,
        event_id: eventId,
        reason: validated.reason,
        custom_reason: selectedReason === "Other" ? validated.custom_reason : null,
      });

      if (reportError) throw reportError;

      // 2. Create unmatch record
      const { error: unmatchError } = await supabase
        .from("unmatches")
        .insert({
          unmatcher_id: session.user.id,
          unmatched_user_id: reportedUserId,
          event_id: eventId,
          match_id: matchId,
          reason: `Report: ${validated.reason}`,
          description: selectedReason === "Other" ? validated.custom_reason : null,
        });

      if (unmatchError) console.error("Unmatch error:", unmatchError);

      // 3. Create audit log
      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert({
          action_type: "report",
          actor_id: session.user.id,
          target_id: reportedUserId,
          event_id: eventId,
          match_id: matchId,
          reason: validated.reason,
          description: selectedReason === "Other" ? validated.custom_reason : null,
          metadata: { reported_user_name: reportedUserName },
        });

      if (auditError) console.error("Audit log error:", auditError);

      // 4. Get event host info
      const { data: eventData } = await supabase
        .from("events")
        .select("created_by, name")
        .eq("id", eventId)
        .single();

      if (eventData?.created_by && eventData.created_by !== session.user.id) {
        // 5. Send message to host notifying them of the report
        const reportMessage = `🚨 Report Alert\n\nUser ${reportedUserName} has been reported for: ${validated.reason}${
          selectedReason === "Other" && validated.custom_reason ? `\n\nDetails: ${validated.custom_reason}` : ""
        }\n\nEvent: ${eventData.name}\nReported by: ${session.user.email}`;

        const { error: messageError } = await supabase
          .from("messages")
          .insert({
            sender_id: session.user.id,
            recipient_id: eventData.created_by,
            event_id: eventId,
            content: reportMessage,
          });

        if (messageError) console.error("Message to host error:", messageError);
      }

      // 6. Delete the swipe (unlike) so profile can reappear in matchmaking
      const { error: deleteSwipeError } = await supabase
        .from("swipes")
        .delete()
        .eq("user_id", session.user.id)
        .eq("swiped_user_id", reportedUserId)
        .eq("event_id", eventId);

      if (deleteSwipeError) console.error("Delete swipe error:", deleteSwipeError);

      // 7. Delete messages (soft delete by keeping in audit)
      const { error: deleteMessagesError } = await supabase
        .from("messages")
        .delete()
        .eq("match_id", matchId);

      if (deleteMessagesError) console.error("Delete messages error:", deleteMessagesError);

      // 8. Delete match
      const { error: deleteMatchError } = await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (deleteMatchError) console.error("Delete match error:", deleteMatchError);

      toast.success("Report submitted and user unmatched");
      onOpenChange(false);
      onReportSubmit();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle>Report {reportedUserName}</DialogTitle>
          </div>
          <DialogDescription>
            This will unmatch you from {reportedUserName} and notify the event host. Please select a reason:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {REPORT_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="cursor-pointer font-normal">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please provide details</Label>
              <Textarea
                id="custom-reason"
                placeholder="Describe the issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {customReason.length}/500 characters
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
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Report & Unmatch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
