import { useTranslation } from "react-i18next";
import { Users, MessageCircle, Heart, PartyPopper } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const CouplesGuestBenefits = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const benefits = [
    {
      icon: Users,
      title: t("landing.couples.guestBenefits.benefit1Title"),
      description: t("landing.couples.guestBenefits.benefit1Description"),
    },
    {
      icon: MessageCircle,
      title: t("landing.couples.guestBenefits.benefit2Title"),
      description: t("landing.couples.guestBenefits.benefit2Description"),
    },
    {
      icon: Heart,
      title: t("landing.couples.guestBenefits.benefit3Title"),
      description: t("landing.couples.guestBenefits.benefit3Description"),
    },
    {
      icon: PartyPopper,
      title: t("landing.couples.guestBenefits.benefit4Title"),
      description: t("landing.couples.guestBenefits.benefit4Description"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.couples.guestBenefits.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.couples.guestBenefits.subtitle")}
          </p>
        </div>

        {/* Benefits Grid — no card borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="reveal-child text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="text-center mt-16">
          <p className="text-xl font-medium text-foreground">
            {t("landing.couples.guestBenefits.tagline")}
          </p>
        </div>
      </div>
    </section>
  );
};
