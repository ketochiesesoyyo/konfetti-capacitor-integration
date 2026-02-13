import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LandingNav } from "@/components/landing/LandingNav";
import { PlannerHeroSection } from "@/components/landing/planner/PlannerHeroSection";
import { PlannerBenefits } from "@/components/landing/planner/PlannerBenefits";
import { PlannerProcess } from "@/components/landing/planner/PlannerProcess";
import { PlannerTestimonials } from "@/components/landing/planner/PlannerTestimonials";
import { ContactForm } from "@/components/landing/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";

const WeddingPlanners = () => {
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
    <div className="landing-page min-h-screen bg-background">
      <LandingNav />
      <PlannerHeroSection />
      <PlannerBenefits />
      <PlannerProcess />
      <PlannerTestimonials />
      <ContactForm />
      <LandingFooter />
    </div>
  );
};

export default WeddingPlanners;
