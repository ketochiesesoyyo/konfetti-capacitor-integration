import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CouplesHeroSection = () => {
  const { t } = useTranslation();

  const scrollToContact = () => {
    const element = document.getElementById("contact-form");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
      
      {/* Animated confetti dots */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
          <Heart className="h-4 w-4" />
          {t("landing.couples.hero.badge")}
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-snug">
          {t("landing.couples.hero.headline")}
          <span className="text-primary block mt-3">
            {t("landing.couples.hero.headlineAccent")}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
          {t("landing.couples.hero.subheadline")}
        </p>

        {/* CTA */}
        <Button
          size="lg"
          onClick={scrollToContact}
          className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          {t("landing.couples.hero.cta")}
        </Button>

        {/* Urgency text */}
        <p className="mt-6 text-sm text-muted-foreground">
          {t("landing.couples.hero.urgency")}
        </p>
      </div>
    </section>
  );
};
