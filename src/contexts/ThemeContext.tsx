import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "sunset" | "warmth" | "midnight";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("sunset");

  useEffect(() => {
    const loadTheme = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (profile?.theme_preference) {
          setThemeState(profile.theme_preference as Theme);
        }
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme class to document root
    document.documentElement.classList.remove("theme-sunset", "theme-warmth", "theme-midnight");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from("profiles")
        .update({ theme_preference: newTheme })
        .eq("user_id", session.user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
