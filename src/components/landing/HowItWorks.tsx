import { useTranslation } from "react-i18next";
import { Plus, Link, Heart } from "lucide-react";

export const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Plus,
      title: t("landing.howItWorks.step1.title"),
      description: t("landing.howItWorks.step1.description"),
      visual: t("landing.howItWorks.step1.visual"),
    },
    {
      icon: Link,
      title: t("landing.howItWorks.step2.title"),
      description: t("landing.howItWorks.step2.description"),
      visual: t("landing.howItWorks.step2.visual"),
    },
    {
      icon: Heart,
      title: t("landing.howItWorks.step3.title"),
      description: t("landing.howItWorks.step3.description"),
      visual: t("landing.howItWorks.step3.visual"),
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-6 p-8 rounded-3xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                {/* Step Number */}
                <div className="text-sm font-bold text-primary">
                  {t("landing.howItWorks.step")} {index + 1}
                </div>

                {/* Icon */}
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Visual Hint */}
              <div className="pt-4 text-sm text-muted-foreground font-mono bg-muted/50 px-4 py-2 rounded-xl">
                {step.visual}
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
};
