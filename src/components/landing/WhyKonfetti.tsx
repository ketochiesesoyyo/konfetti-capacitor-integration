import { useTranslation } from "react-i18next";
import { Ticket, Shield, Sparkles, MessageCircle, Clock, Globe } from "lucide-react";

export const WhyKonfetti = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Ticket,
      title: t("landing.whyKonfetti.benefit1.title"),
      description: t("landing.whyKonfetti.benefit1.description"),
    },
    {
      icon: Shield,
      title: t("landing.whyKonfetti.benefit2.title"),
      description: t("landing.whyKonfetti.benefit2.description"),
    },
    {
      icon: Sparkles,
      title: t("landing.whyKonfetti.benefit3.title"),
      description: t("landing.whyKonfetti.benefit3.description"),
    },
    {
      icon: MessageCircle,
      title: t("landing.whyKonfetti.benefit4.title"),
      description: t("landing.whyKonfetti.benefit4.description"),
    },
    {
      icon: Clock,
      title: t("landing.whyKonfetti.benefit5.title"),
      description: t("landing.whyKonfetti.benefit5.description"),
    },
    {
      icon: Globe,
      title: t("landing.whyKonfetti.benefit6.title"),
      description: t("landing.whyKonfetti.benefit6.description"),
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.whyKonfetti.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.whyKonfetti.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="p-8 rounded-3xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 space-y-4"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <benefit.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
