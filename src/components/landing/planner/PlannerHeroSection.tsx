import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const PlannerHeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 flex flex-col">

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            {t("landing.planner.hero.badge")}
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            {t("landing.planner.hero.headline")}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing.planner.hero.subheadline")}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              variant="gradient"
              onClick={() => {
                document.getElementById("contact-form")?.scrollIntoView({ 
                  behavior: "smooth" 
                });
              }}
              className="w-full sm:w-auto min-w-[250px]"
            >
              {t("landing.planner.hero.cta")}
            </Button>
          </div>

          {/* Trust text */}
          <p className="text-sm text-muted-foreground pt-4">
            {t("landing.planner.hero.trust")}
          </p>
        </div>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
};
