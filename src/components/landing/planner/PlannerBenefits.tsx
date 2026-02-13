import { useTranslation } from "react-i18next";
import { Heart, Star, Shield, Zap, Gift, Users } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const PlannerBenefits = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const benefits = [
    {
      icon: Gift,
      title: t("landing.planner.benefits.benefit1.title"),
      description: t("landing.planner.benefits.benefit1.description"),
    },
    {
      icon: Star,
      title: t("landing.planner.benefits.benefit2.title"),
      description: t("landing.planner.benefits.benefit2.description"),
    },
    {
      icon: Heart,
      title: t("landing.planner.benefits.benefit3.title"),
      description: t("landing.planner.benefits.benefit3.description"),
    },
    {
      icon: Users,
      title: t("landing.planner.benefits.benefit4.title"),
      description: t("landing.planner.benefits.benefit4.description"),
    },
    {
      icon: Shield,
      title: t("landing.planner.benefits.benefit5.title"),
      description: t("landing.planner.benefits.benefit5.description"),
    },
    {
      icon: Zap,
      title: t("landing.planner.benefits.benefit6.title"),
      description: t("landing.planner.benefits.benefit6.description"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 bg-muted/20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.planner.benefits.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.planner.benefits.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="reveal-child text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
