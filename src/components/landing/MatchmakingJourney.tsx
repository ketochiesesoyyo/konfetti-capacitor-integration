import { useTranslation } from "react-i18next";
import journeyStep1 from "@/assets/journey-step1-match.jpg";
import journeyStep2 from "@/assets/journey-step2-wedding.jpg";
import journeyStep3 from "@/assets/journey-step3-date.jpg";

export const MatchmakingJourney = () => {
  const { t } = useTranslation();

  const steps = [
    {
      image: journeyStep1,
      step: "01",
      title: t("landing.matchmakingJourney.step1.title"),
      description: t("landing.matchmakingJourney.step1.description"),
    },
    {
      image: journeyStep2,
      step: "02",
      title: t("landing.matchmakingJourney.step2.title"),
      description: t("landing.matchmakingJourney.step2.description"),
    },
    {
      image: journeyStep3,
      step: "03",
      title: t("landing.matchmakingJourney.step3.title"),
      description: t("landing.matchmakingJourney.step3.description"),
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
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center group"
            >
              <div className="relative w-full aspect-[3/4] mb-6 rounded-2xl overflow-hidden shadow-card">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-sm">{step.step}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
