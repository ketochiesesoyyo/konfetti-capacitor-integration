import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut, Palette, Lock, Mail, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";

const THEMES = [
  { id: "sunset", name: "Sunset", gradient: "gradient-sunset" },
  { id: "ocean", name: "Ocean", gradient: "gradient-ocean" },
  { id: "golden", name: "Golden", gradient: "gradient-golden" },
  { id: "emerald", name: "Emerald", gradient: "gradient-emerald" },
  { id: "midnight", name: "Midnight", gradient: "gradient-midnight" },
] as const;

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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
      <div className={`${THEMES.find(t => t.id === theme)?.gradient || 'gradient-sunset'} text-white p-6`}>
        <div className="max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-white/90 text-sm mt-1">Customize your experience</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {/* Theme Selection */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">App Theme</h2>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className="relative group"
              >
                <div className={`${t.gradient} aspect-square rounded-lg transition-transform group-hover:scale-105`} />
                {theme === t.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full p-1">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
                <p className="text-xs mt-1 text-center text-muted-foreground">{t.name}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Change Email */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Change Email</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-email">New Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your.new@email.com"
              />
            </div>
            <Button onClick={handleEmailChange} disabled={loading} className="w-full">
              Update Email
            </Button>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handlePasswordChange} disabled={loading} className="w-full">
              Update Password
            </Button>
          </div>
        </Card>

        {/* Logout */}
        <Card className="p-6">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
