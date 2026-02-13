import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const CouplesHeroSection = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const scrollToContact = () => {
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="scroll-reveal relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-primary/3 to-background"
    >
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center space-y-8">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
          <Heart className="h-4 w-4" />
          <span className="eyebrow">{t("landing.couples.hero.badge")}</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
          {t("landing.couples.hero.headline")}
          <span className="text-primary block mt-3">
            {t("landing.couples.hero.headlineAccent")}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {t("landing.couples.hero.subheadline")}
        </p>

        {/* CTA */}
        <div className="pt-4">
          <Button
            size="lg"
            variant="gradient"
            onClick={scrollToContact}
            className="min-w-[280px] text-base"
          >
            {t("landing.couples.hero.cta")}
          </Button>
        </div>

        {/* Urgency text */}
        <p className="text-sm text-muted-foreground">
          {t("landing.couples.hero.urgency")}
        </p>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
};
