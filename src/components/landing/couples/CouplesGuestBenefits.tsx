import { useTranslation } from "react-i18next";
import { Users, MessageCircle, Heart, PartyPopper } from "lucide-react";

export const CouplesGuestBenefits = () => {
  const { t } = useTranslation();

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
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.couples.guestBenefits.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.couples.guestBenefits.subtitle")}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-2xl p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="text-center mt-12">
          <p className="text-xl font-medium text-foreground">
            {t("landing.couples.guestBenefits.tagline")}
          </p>
        </div>
      </div>
    </section>
  );
};
