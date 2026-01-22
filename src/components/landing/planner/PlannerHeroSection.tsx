import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sparkles, Users, Heart } from "lucide-react";

export const PlannerHeroSection = () => {
  const { t } = useTranslation();

  const stats = [
    { icon: Users, value: "500+", label: t("landing.planner.hero.statGuests") },
    { icon: Heart, value: "150+", label: t("landing.planner.hero.statMatches") },
    { icon: Sparkles, value: "98%", label: t("landing.planner.hero.statSatisfaction") },
  ];

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Header with Logo and Language Switcher */}
      <header className="w-full py-6 px-6 flex justify-between items-center">
        <KonfettiLogo className="h-8" />
        <LanguageSwitcher />
      </header>

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

          {/* Stats */}
          <div className="flex justify-center gap-8 py-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center space-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

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
