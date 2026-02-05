import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
          
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Konfetti Privacy Policy
          </h1>
          
          <div className="prose prose-sm max-w-none">
            <PrivacyPolicyContent />
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default PrivacyPolicy;
