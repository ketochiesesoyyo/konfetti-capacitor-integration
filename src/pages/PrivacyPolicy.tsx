import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <main className="flex-1 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Link 
            to="/landing" 
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToHome')}
          </Link>
          
          <div className="legal-hero">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Legal</span>
            </div>
            <h1>Privacy Policy</h1>
            <p>How we collect, use, and protect your personal information</p>
          </div>
          
          <div className="legal-content space-y-4">
            <PrivacyPolicyContent />
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default PrivacyPolicy;
