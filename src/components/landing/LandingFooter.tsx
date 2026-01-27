import { useTranslation } from "react-i18next";
import { Mail, Instagram, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { KonfettiLogo } from "@/components/KonfettiLogo";

export const LandingFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Contact Us */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                {t("landing.footer.contact.title")}
              </h3>
              <div className="space-y-3">
                <a
                  href="mailto:support@konfetti.app"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-sm">support@konfetti.app</span>
                </a>
                <Link
                  to="/support"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="text-sm">{t("landing.footer.contact.support")}</span>
                </Link>
              </div>
            </div>

            {/* Follow Us */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                {t("landing.footer.social.title")}
              </h3>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/konfetti.app?igsh=MTB2cjgzZG12M3Q4ZA%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                {t("landing.footer.legal.title")}
              </h3>
              <div className="space-y-2">
                <Link
                  to="/privacy-policy"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.footer.legal.privacy")}
                </Link>
                <Link
                  to="/community-guidelines"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.footer.legal.guidelines")}
                </Link>
                <Link
                  to="/terms-conditions"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.footer.legal.terms")}
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <KonfettiLogo className="h-6" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <span>{t("landing.footer.copyright")}</span>
              <span className="hidden md:inline">•</span>
              <span>{t("landing.footer.madeIn")}</span>
            </div>
          </div>
        </div>
      </footer>
  );
};
