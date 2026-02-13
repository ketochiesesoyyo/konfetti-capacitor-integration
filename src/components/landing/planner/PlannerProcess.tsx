import { useTranslation } from "react-i18next";
import { Mail, UserPlus, Link, Heart, MessageSquare } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const PlannerProcess = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const steps = [
    {
      icon: Mail,
      step: "01",
      title: t("landing.planner.process.step1.title"),
      description: t("landing.planner.process.step1.description"),
    },
    {
      icon: UserPlus,
      step: "02",
      title: t("landing.planner.process.step2.title"),
      description: t("landing.planner.process.step2.description"),
    },
    {
      icon: Link,
      step: "03",
      title: t("landing.planner.process.step3.title"),
      description: t("landing.planner.process.step3.description"),
    },
    {
      icon: Heart,
      step: "04",
      title: t("landing.planner.process.step4.title"),
      description: t("landing.planner.process.step4.description"),
    },
    {
      icon: MessageSquare,
      step: "05",
      title: t("landing.planner.process.step5.title"),
      description: t("landing.planner.process.step5.description"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.planner.process.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.planner.process.subtitle")}
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="reveal-child flex items-start gap-6">
                <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="inline-block bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                    {t("landing.planner.process.step")} {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
