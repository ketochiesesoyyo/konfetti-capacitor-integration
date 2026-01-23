import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { useTranslation } from "react-i18next";
import { CommunityGuidelinesDialog } from "@/components/CommunityGuidelinesDialog";
import { TermsConditionsDialog } from "@/components/TermsConditionsDialog";
import { PrivacyPolicyDialog } from "@/components/PrivacyPolicyDialog";

const isDev = import.meta.env.DEV;

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
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

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const isOAuthReturn = searchParams.get("oauth") === "true";
        const pendingInvite = searchParams.get("invite");
        
        // If returning from OAuth, check if profile needs completion
        if (isOAuthReturn) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, age, bio, photos')
            .eq('user_id', session.user.id)
            .single();
          
          // New user or incomplete profile - redirect to profile creation
          const needsProfileCompletion = !profile?.age || !profile?.photos || profile?.photos?.length === 0;
          
          if (needsProfileCompletion) {
            if (pendingInvite) {
              navigate(`/edit-profile?invite=${pendingInvite}`, { 
                state: { isNewUser: true }
              });
            } else {
              navigate("/edit-profile", { 
                state: { isNewUser: true }
              });
            }
            return;
          }
        }
        
        // Existing user with complete profile
        if (pendingInvite) {
          navigate(`/join/${pendingInvite}`);
        } else {
          navigate("/");
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
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(t('auth.invalidCredentials'));
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success(t('auth.welcomeBack'));
        
        // Check if there's a pending invite in URL params
        const pendingInvite = searchParams.get("invite");
        if (pendingInvite) {
          navigate(`/join/${pendingInvite}`);
        } else {
          navigate("/");
        }
      } else {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: email.split('@')[0],
            },
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
        
        // Redirect to profile creation with pending invite in URL
        const pendingInvite = searchParams.get("invite");
        if (pendingInvite) {
          navigate(`/edit-profile?invite=${pendingInvite}`, { 
            state: { isNewUser: true }
          });
        } else {
          navigate("/edit-profile", { 
            state: { isNewUser: true }
          });
        }
      }
    } catch (error: any) {
      // Error already shown via specific error handling above
      if (isDev) {
        console.error("Auth error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setIsLoading(true);
      
      // Build redirect URL with pending invite if present
      const pendingInvite = searchParams.get("invite");
      const redirectTo = pendingInvite 
        ? `${window.location.origin}/auth?invite=${pendingInvite}&oauth=true`
        : `${window.location.origin}/auth?oauth=true`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        toast.error(t('auth.failedSignIn', { provider }));
        if (isDev) {
          console.error(error);
        }
      }
    } catch (error) {
      toast.error(t('auth.socialLoginError'));
      if (isDev) {
        console.error("Social login error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <KonfettiLogo className="w-48 h-auto mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.appTitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {!isLogin && (
            <>
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
            </>
          )}

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('auth.loading') : isLogin ? t('auth.signIn') : t('auth.createAccount')}
          </Button>
        </form>

        {/* Google login hidden until OAuth is configured
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-full max-w-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </div>
        */}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? t('auth.noAccount')
              : t('auth.hasAccount')}
          </button>
        </div>

        <div className="mt-4 text-center space-x-3">
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
          >
            {t('auth.privacyPolicy')}
          </button>
          <span className="text-xs text-muted-foreground">•</span>
          <button
            type="button"
            onClick={() => setShowGuidelines(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
          >
            {t('auth.communityGuidelines')}
          </button>
          <span className="text-xs text-muted-foreground">•</span>
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
          >
            {t('auth.termsConditions')}
          </button>
        </div>
      </Card>

      <CommunityGuidelinesDialog 
        open={showGuidelines} 
        onOpenChange={setShowGuidelines}
      />
      <TermsConditionsDialog 
        open={showTerms} 
        onOpenChange={setShowTerms}
      />
      <PrivacyPolicyDialog 
        open={showPrivacy} 
        onOpenChange={setShowPrivacy}
      />
    </div>
  );
};

export default Auth;
