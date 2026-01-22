import { useTranslation } from "react-i18next";
import { Smartphone, Heart, Calendar } from "lucide-react";

export const MatchmakingJourney = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Smartphone,
      step: "01",
      title: t("landing.matchmakingJourney.step1.title"),
      description: t("landing.matchmakingJourney.step1.description"),
      gradient: "from-primary/20 to-primary/5",
    },
    {
      icon: Heart,
      step: "02",
      title: t("landing.matchmakingJourney.step2.title"),
      description: t("landing.matchmakingJourney.step2.description"),
      gradient: "from-pink-500/20 to-pink-500/5",
    },
    {
      icon: Calendar,
      step: "03",
      title: t("landing.matchmakingJourney.step3.title"),
      description: t("landing.matchmakingJourney.step3.description"),
      gradient: "from-amber-500/20 to-amber-500/5",
    },
  ];

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.matchmakingJourney.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.matchmakingJourney.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center group"
              >
                <div className={`relative w-full aspect-[3/4] mb-6 rounded-2xl overflow-hidden shadow-card bg-gradient-to-b ${step.gradient} flex items-center justify-center`}>
                  <IconComponent className="h-24 w-24 text-foreground/30" />
                  <div className="absolute top-4 left-4 h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
