import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Mail, Instagram } from "lucide-react";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { CommunityGuidelinesDialog } from "@/components/CommunityGuidelinesDialog";
import { TermsConditionsDialog } from "@/components/TermsConditionsDialog";
import { PrivacyPolicyDialog } from "@/components/PrivacyPolicyDialog";

export const LandingFooter = () => {
  const { t } = useTranslation();
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
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
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.footer.legal.privacy")}
                </button>
                <button
                  onClick={() => setShowGuidelines(true)}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.footer.legal.guidelines")}
                </button>
                <button
                  onClick={() => setShowTerms(true)}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.footer.legal.terms")}
                </button>
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
    </>
  );
};
