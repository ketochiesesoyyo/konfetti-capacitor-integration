import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const PlannerHeroSection = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  return (
    <section
      ref={ref}
      className="scroll-reveal relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-background via-primary/3 to-background"
    >
      <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
        {/* Eyebrow */}
        <p className="eyebrow">{t("landing.planner.hero.badge")}</p>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
          {t("landing.planner.hero.headline")}
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("landing.planner.hero.subheadline")}
        </p>

        {/* CTA */}
        <div className="pt-4">
          <Button
            size="lg"
            variant="gradient"
            onClick={() => {
              document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="min-w-[250px] text-base"
          >
            {t("landing.planner.hero.cta")}
          </Button>
        </div>

        {/* Trust text */}
        <p className="text-sm text-muted-foreground">
          {t("landing.planner.hero.trust")}
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
