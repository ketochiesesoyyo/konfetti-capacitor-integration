import { useTranslation } from "react-i18next";
import { Ticket, Shield, Sparkles, Clock } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const WhyKonfetti = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const differentiators = [
    {
      icon: Ticket,
      title: t("landing.whyKonfetti.differentiator1.title"),
      description: t("landing.whyKonfetti.differentiator1.description"),
    },
    {
      icon: Shield,
      title: t("landing.whyKonfetti.differentiator2.title"),
      description: t("landing.whyKonfetti.differentiator2.description"),
    },
    {
      icon: Sparkles,
      title: t("landing.whyKonfetti.differentiator3.title"),
      description: t("landing.whyKonfetti.differentiator3.description"),
    },
    {
      icon: Clock,
      title: t("landing.whyKonfetti.differentiator4.title"),
      description: t("landing.whyKonfetti.differentiator4.description"),
    },
  ];

  return (
    <section
      ref={ref}
      className="scroll-reveal py-24 md:py-32 px-6 bg-muted/20"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="eyebrow mb-3">{t("landing.whyKonfetti.label")}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.whyKonfetti.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.whyKonfetti.subtitle")}
          </p>
        </div>

        {/* 2×2 grid — no card borders */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {differentiators.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="reveal-child space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
