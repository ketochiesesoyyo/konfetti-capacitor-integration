import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast.error(t("settings.deleteAccount.typeDeleteError"));
      return;
    }

    setIsDeleting(true);
    try {
      // Use raw SQL call since the RPC function was just created
      const { error } = await supabase.rpc("delete_user_account" as any);
      
      if (error) throw error;

      // Sign out after successful deletion
      await supabase.auth.signOut();
      
      toast.success(t("settings.deleteAccount.success"));
      onOpenChange(false);
      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(t("settings.deleteAccount.failed"), {
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            {t("settings.deleteAccount.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>{t("settings.deleteAccount.warning")}</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>{t("settings.deleteAccount.dataProfile")}</li>
              <li>{t("settings.deleteAccount.dataPhotos")}</li>
              <li>{t("settings.deleteAccount.dataMatches")}</li>
              <li>{t("settings.deleteAccount.dataMessages")}</li>
              <li>{t("settings.deleteAccount.dataEvents")}</li>
            </ul>
            <p className="font-semibold text-destructive">
              {t("settings.deleteAccount.irreversible")}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2 py-4">
          <Label htmlFor="confirm-delete">
            {t("settings.deleteAccount.typeDelete")}
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={confirmText !== "DELETE" || isDeleting}
          >
            {isDeleting ? t("common.loading") : t("settings.deleteAccount.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
