import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LandingNav } from "@/components/landing/LandingNav";
import { CouplesHeroSection } from "@/components/landing/couples/CouplesHeroSection";
import { CouplesSocialProof } from "@/components/landing/couples/CouplesSocialProof";
import { CouplesProblemSolution } from "@/components/landing/couples/CouplesProblemSolution";
import { CouplesHowItWorks } from "@/components/landing/couples/CouplesHowItWorks";
import { CouplesGuestBenefits } from "@/components/landing/couples/CouplesGuestBenefits";
import { CouplesTestimonials } from "@/components/landing/couples/CouplesTestimonials";
import { CouplesUrgency } from "@/components/landing/couples/CouplesUrgency";
import { ContactForm } from "@/components/landing/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";

const ForCouples = () => {
  const navigate = useNavigate();

  useEffect(() => {
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
      <LandingNav />
      <CouplesHeroSection />
      <CouplesSocialProof />
      <CouplesProblemSolution />
      <CouplesHowItWorks />
      <CouplesGuestBenefits />
      <CouplesTestimonials />
      <CouplesUrgency />
      <ContactForm />
      <LandingFooter />
    </div>
  );
};

export default ForCouples;
