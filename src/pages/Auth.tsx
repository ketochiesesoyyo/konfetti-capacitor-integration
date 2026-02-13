import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdminSubdomain } from "@/lib/domain";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { useTranslation } from "react-i18next";
import { CommunityGuidelinesDialog } from "@/components/CommunityGuidelinesDialog";
import { TermsConditionsDialog } from "@/components/TermsConditionsDialog";
import { PrivacyPolicyDialog } from "@/components/PrivacyPolicyDialog";
import { LanguageSwitcherButtons } from "@/components/LanguageSwitcherButtons";

const isDev = import.meta.env.DEV;

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isLogin = activeTab === "login";

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const isOAuthReturn = searchParams.get("oauth") === "true";
        const pendingInvite = searchParams.get("invite");
        
        if (isOAuthReturn) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, age, bio, photos')
            .eq('user_id', session.user.id)
            .single();
          
          const needsProfileCompletion = !profile?.age || !profile?.photos || profile?.photos?.length === 0;
          
          if (needsProfileCompletion) {
            if (pendingInvite) {
              navigate(`/edit-profile?invite=${pendingInvite}`, { state: { isNewUser: true } });
            } else {
              navigate("/edit-profile", { state: { isNewUser: true } });
            }
            return;
          }
        }
        
        if (isAdminSubdomain()) {
          navigate("/admin");
        } else if (pendingInvite) {
          navigate(`/join/${pendingInvite}`);
        } else {
          navigate("/profile");
        }
      }
    };
    checkAuth();
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      toast.error(t('auth.passwordsNoMatch'));
      return;
    }

    if (!isLogin && !agreedToTerms) {
      toast.error(t('auth.confirmAge'));
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(t('auth.invalidCredentials'));
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success(t('auth.welcomeBack'));

        const pendingInvite = searchParams.get("invite");
        if (isAdminSubdomain()) {
          navigate("/admin");
        } else if (pendingInvite) {
          navigate(`/join/${pendingInvite}`);
        } else {
          navigate("/profile");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: email.split('@')[0] },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error(t('auth.emailRegistered'));
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success(t('auth.accountCreated'));
        
        const pendingInvite = searchParams.get("invite");
        if (pendingInvite) {
          navigate(`/edit-profile?invite=${pendingInvite}`, { state: { isNewUser: true } });
        } else {
          navigate("/edit-profile", { state: { isNewUser: true } });
        }
      }
    } catch (error: any) {
      if (isDev) {
        console.error("Auth error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast.error(t('auth.forgotPassword.enterEmail'));
      return;
    }

    setIsSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `https://konfetti.app/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('auth.forgotPassword.emailSent'));
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      toast.error(t('auth.forgotPassword.error'));
    } finally {
      setIsSendingReset(false);
    }
  };

  const emailPasswordFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Language switcher - top right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcherButtons />
      </div>

      <Card className="w-full max-w-md p-8 animate-slide-up">
        <Link 
          to="/landing" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auth.backToHome')}
        </Link>
        <div className="flex flex-col items-center mb-6">
          <KonfettiLogo className="w-48 h-auto mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.appTitle')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="login">{t('auth.signIn')}</TabsTrigger>
            <TabsTrigger value="signup">{t('auth.createAccount')}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="space-y-4">
              {emailPasswordFields}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.forgotPassword.link')}
                </button>
              </div>
              <Button type="submit" variant="default" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.loading') : t('auth.signIn')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSubmit} className="space-y-4">
              {emailPasswordFields}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t('auth.language')}</Label>
                <Select
                  value={selectedLanguage}
                  onValueChange={(value) => {
                    setSelectedLanguage(value);
                    i18n.changeLanguage(value);
                    localStorage.setItem('i18nextLng', value);
                  }}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder={t('auth.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-tight">
                  {t('auth.ageTerms')}
                </Label>
              </div>

              <Button type="submit" variant="default" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.loading') : t('auth.createAccount')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center space-x-3">
          <button type="button" onClick={() => setShowPrivacy(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors underline">
            {t('auth.privacyPolicy')}
          </button>
          <span className="text-xs text-muted-foreground">•</span>
          <button type="button" onClick={() => setShowGuidelines(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors underline">
            {t('auth.communityGuidelines')}
          </button>
          <span className="text-xs text-muted-foreground">•</span>
          <button type="button" onClick={() => setShowTerms(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors underline">
            {t('auth.termsConditions')}
          </button>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-xl font-semibold mb-2">{t('auth.forgotPassword.title')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('auth.forgotPassword.subtitle')}
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">{t('auth.forgotPassword.email')}</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowForgotPassword(false); setForgotPasswordEmail(""); }}
                >
                  {t('auth.forgotPassword.cancel')}
                </Button>
                <Button type="submit" variant="default" className="flex-1" disabled={isSendingReset}>
                  {isSendingReset ? t('auth.loading') : t('auth.forgotPassword.submit')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <CommunityGuidelinesDialog open={showGuidelines} onOpenChange={setShowGuidelines} />
      <TermsConditionsDialog open={showTerms} onOpenChange={setShowTerms} />
      <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
    </div>
  );
};

export default Auth;
