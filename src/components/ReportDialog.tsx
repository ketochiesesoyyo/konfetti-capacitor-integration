import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }

    if (selectedReason === "Other" && !customReason.trim()) {
      toast.error("Please provide details");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to report");
        return;
      }

      // Insert report
      const { error } = await supabase.from("reports").insert({
        reporter_id: session.user.id,
        reported_user_id: reportedUserId,
        match_id: matchId,
        event_id: eventId,
        reason: selectedReason,
        custom_reason: selectedReason === "Other" ? customReason : null,
      });

      if (error) throw error;

      toast.success("Report submitted successfully");
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
