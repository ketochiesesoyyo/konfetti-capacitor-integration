import { useTranslation } from "react-i18next";
import { Heart, Star, Shield, Zap, Gift, Users } from "lucide-react";

export const PlannerBenefits = () => {
  const { t } = useTranslation();

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
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
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
                className="flex flex-col p-6 rounded-3xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                {/* Icon */}
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <IconComponent className="h-7 w-7 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
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
