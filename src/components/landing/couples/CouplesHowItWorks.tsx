import { useTranslation } from "react-i18next";
import { MessageSquare, Send, Heart, Sparkles } from "lucide-react";

export const CouplesHowItWorks = () => {
  const { t } = useTranslation();

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
    <section className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            {t("landing.couples.howItWorks.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.couples.howItWorks.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.couples.howItWorks.subtitle")}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

          {steps.map((step, index) => (
            <div key={index} className="relative mb-12 last:mb-0">
              <div className={`flex items-start gap-6 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                {/* Icon */}
                <div className="relative z-10 shrink-0">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <step.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 bg-card border border-border rounded-2xl p-6 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
                  <div className="inline-block bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground mb-3">
                    {step.time}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Zero effort badge */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium">
            <Sparkles className="h-5 w-5" />
            {t("landing.couples.howItWorks.zeroEffort")}
          </div>
        </div>
      </div>
    </section>
  );
};
