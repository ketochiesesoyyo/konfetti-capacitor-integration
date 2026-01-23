import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { LanguageSwitcherButtons } from "@/components/LanguageSwitcherButtons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LandingNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/para-novios", label: t("landing.nav.couples") },
    { href: "/wedding-planners", label: t("landing.nav.planners") },
    { href: "/contact", label: t("landing.nav.contact") },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="w-full py-4 px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/">
          <KonfettiLogo className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(link.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button asChild variant="default" size="sm">
            <Link to="/auth">{t("landing.nav.login")}</Link>
          </Button>
          <LanguageSwitcherButtons />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
          <LanguageSwitcherButtons />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-9 w-9"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg">
          <div className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground text-center"
            >
              {t("landing.nav.login")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};
