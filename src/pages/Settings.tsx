import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, LogOut, Lock, Mail, Languages, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { CommunityGuidelinesDialog } from "@/components/CommunityGuidelinesDialog";
import { TermsConditionsDialog } from "@/components/TermsConditionsDialog";

const Settings = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [emailMatchNotifications, setEmailMatchNotifications] = useState(true);
  const [emailLikeNotifications, setEmailLikeNotifications] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentEmail(user.email);
      }
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_match_notifications, email_like_notifications')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setEmailMatchNotifications(profile.email_match_notifications ?? true);
          setEmailLikeNotifications(profile.email_like_notifications ?? true);
        }
      }
    };
    fetchUserData();
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(lng === 'en' ? 'Language changed to English' : 'Idioma cambiado a Español');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t('settings.loggedOut'));
    navigate("/auth");
  };

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast.error(t('settings.enterNewEmail'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('settings.emailUpdateSent'));
      setNewEmail("");
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error(t('settings.enterNewPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordsNoMatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('settings.passwordMinLength'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('settings.passwordUpdated'));
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleNotificationToggle = async (type: 'match' | 'like', value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updateField = type === 'match' 
      ? 'email_match_notifications' 
      : 'email_like_notifications';

    const { error } = await supabase
      .from('profiles')
      .update({ [updateField]: value })
      .eq('user_id', user.id);

    if (error) {
      toast.error(t('settings.notificationUpdateError'));
    } else {
      if (type === 'match') {
        setEmailMatchNotifications(value);
      } else {
        setEmailLikeNotifications(value);
      }
      toast.success(t('settings.notificationUpdated'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background p-6 border-b">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--title))]">{t('settings.title')}</h1>
            <p className="text-sm mt-1 text-subtitle">{t('settings.subtitle')}</p>
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
            <h2 className="text-xl font-semibold">{t('settings.changeEmail')}</h2>
          </div>
          <div className="space-y-4">
            {currentEmail && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Email: <span className="font-medium text-foreground">{currentEmail}</span></p>
              </div>
            )}
            <div>
              <Label htmlFor="new-email" className="text-sm font-medium mb-2 block">{t('settings.newEmail')}</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('settings.emailPlaceholder')}
              />
            </div>
            <Button onClick={handleEmailChange} disabled={loading} className="w-full" size="lg">
              {t('settings.updateEmail')}
            </Button>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-8 shadow-card hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{t('settings.changePassword')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="text-sm font-medium mb-2 block">{t('settings.newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-sm font-medium mb-2 block">{t('settings.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handlePasswordChange} disabled={loading} className="w-full" size="lg">
              {t('settings.updatePassword')}
            </Button>
          </div>
        </Card>

        {/* Email Notifications */}
        <Card className="p-8 shadow-card hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{t('settings.emailNotifications')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="space-y-1 flex-1">
                <Label htmlFor="match-notifications" className="text-sm font-medium">
                  {t('settings.matchNotifications')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('settings.matchNotificationsDesc')}
                </p>
              </div>
              <Switch
                id="match-notifications"
                checked={emailMatchNotifications}
                onCheckedChange={(checked) => handleNotificationToggle('match', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="space-y-1 flex-1">
                <Label htmlFor="like-notifications" className="text-sm font-medium">
                  {t('settings.likeNotifications')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('settings.likeNotificationsDesc')}
                </p>
              </div>
              <Switch
                id="like-notifications"
                checked={emailLikeNotifications}
                onCheckedChange={(checked) => handleNotificationToggle('like', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Language Selection */}
        <Card className="p-8 shadow-card hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Languages className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Language / Idioma</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => changeLanguage('en')}
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              size="lg"
              className="w-full"
            >
              English
            </Button>
            <Button
              onClick={() => changeLanguage('es')}
              variant={i18n.language === 'es' ? 'default' : 'outline'}
              size="lg"
              className="w-full"
            >
              Español
            </Button>
          </div>
        </Card>

        {/* Logout */}
        <Card className="p-6 shadow-card hover-lift">
          <Button
            onClick={handleLogout}
            className="w-full bg-[#000000] hover:bg-[#404040] text-white"
            size="lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t('settings.logout')}
          </Button>
        </Card>

        {/* Community Guidelines & Terms Link */}
        <div className="text-center py-6 pb-8 space-x-3">
          <button
            onClick={() => setShowGuidelines(true)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
          >
            {t('settings.communityGuidelines')}
          </button>
          <span className="text-sm text-muted-foreground">•</span>
          <button
            onClick={() => setShowTerms(true)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
          >
            {t('settings.termsConditions')}
          </button>
        </div>
      </div>

      <CommunityGuidelinesDialog 
        open={showGuidelines} 
        onOpenChange={setShowGuidelines}
      />
      <TermsConditionsDialog 
        open={showTerms} 
        onOpenChange={setShowTerms}
      />
    </div>
  );
};

export default Settings;
