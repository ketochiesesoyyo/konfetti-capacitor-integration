import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HeroSection } from "@/components/landing/HeroSection";
import { IntroSection } from "@/components/landing/IntroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProfileCreation } from "@/components/landing/ProfileCreation";
import { WhyKonfetti } from "@/components/landing/WhyKonfetti";
import { FeaturesHighlight } from "@/components/landing/FeaturesHighlight";
import { Testimonials } from "@/components/landing/Testimonials";
import { SafetyPrivacy } from "@/components/landing/SafetyPrivacy";
import { FAQ } from "@/components/landing/FAQ";
import { ContactForm } from "@/components/landing/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and redirect to dashboard
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <IntroSection />
      <HowItWorks />
      <ProfileCreation />
      <WhyKonfetti />
      <FeaturesHighlight />
      <Testimonials />
      <SafetyPrivacy />
      <FAQ />
      <ContactForm />
      <LandingFooter />
    </div>
  );
};

export default Landing;
