import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyKonfetti } from "@/components/landing/WhyKonfetti";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { ContactForm } from "@/components/landing/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
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
    <div className="landing-page min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <HowItWorks />
      <WhyKonfetti />
      <Testimonials />
      <ContactForm />
      <FAQ />
      <LandingFooter />
    </div>
  );
};

export default Landing;
