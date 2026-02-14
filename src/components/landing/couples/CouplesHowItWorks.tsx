import { useTranslation } from "react-i18next";
import { MessageSquare, Send, Heart, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const CouplesHowItWorks = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const steps = [
    {
      icon: MessageSquare,
      title: t("landing.couples.howItWorks.step1Title"),
      description: t("landing.couples.howItWorks.step1Description"),
      time: t("landing.couples.howItWorks.step1Time"),
    },
    {
      icon: Send,
      title: t("landing.couples.howItWorks.step2Title"),
      description: t("landing.couples.howItWorks.step2Description"),
      time: t("landing.couples.howItWorks.step2Time"),
    },
    {
      icon: Heart,
      title: t("landing.couples.howItWorks.step3Title"),
      description: t("landing.couples.howItWorks.step3Description"),
      time: t("landing.couples.howItWorks.step3Time"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 bg-muted/40 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="eyebrow mb-3">{t("landing.couples.howItWorks.badge")}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.couples.howItWorks.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.couples.howItWorks.subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={index} className="reveal-child flex items-start gap-6">
              {/* Icon */}
              <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="h-6 w-6 text-primary" />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="inline-block bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                  {step.time}
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Zero effort badge */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium">
            <Sparkles className="h-5 w-5" />
            {t("landing.couples.howItWorks.zeroEffort")}
          </div>
        </div>
      </div>
    </section>
  );
};
