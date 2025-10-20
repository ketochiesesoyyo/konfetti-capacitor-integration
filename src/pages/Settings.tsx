import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast.error("Please enter a new email");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email update sent! Check your inbox to confirm.");
      setNewEmail("");
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background p-6 border-b">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--title))]">Settings</h1>
            <p className="text-sm mt-1 text-subtitle">Customize your experience</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {/* Change Email */}
        <Card className="p-8 shadow-card hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Change Email</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-email" className="text-sm font-medium mb-2 block">New Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your.new@email.com"
              />
            </div>
            <Button onClick={handleEmailChange} disabled={loading} className="w-full" size="lg">
              Update Email
            </Button>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-8 shadow-card hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-sm font-medium mb-2 block">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-sm font-medium mb-2 block">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handlePasswordChange} disabled={loading} className="w-full" size="lg">
              Update Password
            </Button>
          </div>
        </Card>

        {/* Logout */}
        <Card className="p-6 shadow-card hover-lift">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
            size="lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
