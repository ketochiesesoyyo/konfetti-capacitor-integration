import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KonfettiLogo } from "@/components/KonfettiLogo";

const PortalAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pre-fill email from invite link
  useEffect(() => {
    const inviteEmail = searchParams.get("email");
    if (inviteEmail) {
      setEmail(inviteEmail);
      setIsLogin(false); // Default to register mode when invited
    }
  }, [searchParams]);

  // Check if already authenticated as client
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: hasClientRole } = await supabase
          .rpc('has_role', { _user_id: session.user.id, _role: 'client' });

        if (hasClientRole) {
          navigate("/portal");
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Credenciales invalidas");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Check client role — if not found, try to link existing user to invited contact
        let { data: hasClientRole } = await supabase
          .rpc('has_role', { _user_id: data.user.id, _role: 'client' });

        if (!hasClientRole) {
          // Try to link this existing user to an invited contact
          await supabase.rpc('try_link_portal_account');
          // Re-check role after linking attempt
          const result = await supabase
            .rpc('has_role', { _user_id: data.user.id, _role: 'client' });
          hasClientRole = result.data;
        }

        if (!hasClientRole) {
          await supabase.auth.signOut();
          toast.error("No tienes acceso al portal de clientes. Contacta al administrador.");
          return;
        }

        toast.success("Bienvenido al portal");
        navigate("/portal");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal/login`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email ya esta registrado. Intenta iniciar sesion.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // The auto-link trigger will handle linking contact + assigning role
        // Check if the user was auto-linked
        if (data.user) {
          const { data: hasClientRole } = await supabase
            .rpc('has_role', { _user_id: data.user.id, _role: 'client' });

          if (hasClientRole) {
            toast.success("Cuenta creada. Bienvenido al portal.");
            navigate("/portal");
          } else {
            toast.error("No se encontro una invitacion para este email. Contacta al administrador.");
            await supabase.auth.signOut();
          }
        }
      }
    } catch (error: any) {
      console.error("Portal auth error:", error);
      toast.error("Error de autenticacion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <KonfettiLogo className="w-48 h-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">Portal de Clientes</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Accede a tus eventos y estadisticas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contrasena</Label>
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
          )}

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading
              ? "Cargando..."
              : isLogin
                ? "Iniciar Sesion"
                : "Crear Cuenta"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "No tienes cuenta? Registrate"
              : "Ya tienes cuenta? Inicia sesion"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default PortalAuth;
