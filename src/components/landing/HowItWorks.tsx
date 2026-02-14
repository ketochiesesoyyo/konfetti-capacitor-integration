import { useTranslation } from "react-i18next";
import { Mail, Settings, Link, Sparkles, Heart } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const HowItWorks = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const steps = [
    {
      icon: Mail,
      title: t("landing.howItWorks.step1.title"),
      description: t("landing.howItWorks.step1.description"),
    },
    {
      icon: Settings,
      title: t("landing.howItWorks.step2.title"),
      description: t("landing.howItWorks.step2.description"),
    },
    {
      icon: Link,
      title: t("landing.howItWorks.step3.title"),
      description: t("landing.howItWorks.step3.description"),
    },
    {
      icon: Sparkles,
      title: t("landing.howItWorks.step4.title"),
      description: t("landing.howItWorks.step4.description"),
    },
    {
      icon: Heart,
      title: t("landing.howItWorks.step5.title"),
      description: t("landing.howItWorks.step5.description"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="eyebrow mb-3">{t("landing.howItWorks.label")}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.howItWorks.subtitle")}
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div
                  key={index}
                  className={`reveal-child relative flex flex-col md:flex-row items-center ${
                    isLeft ? "" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Card */}
                  <div className={`flex-1 ${isLeft ? "md:pr-16" : "md:pl-16"}`}>
                    <div
                      className={`bg-muted/50 rounded-2xl p-6 space-y-3 ${
                        isLeft ? "md:ml-auto" : "md:mr-auto"
                      } md:max-w-md`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <step.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {t("landing.howItWorks.step")} {index + 1}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Timeline dot */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-sm" />

                  {/* Spacer */}
                  <div className="hidden md:block flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
