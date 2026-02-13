import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import journeyMatch from "@/assets/journey-step1-match1.jpg";
import journeyWedding from "@/assets/journey-step2-wedding1.jpg";
import journeyDate from "@/assets/journey-step3-date1.jpg";

export const HowItWorks = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const steps = [
    {
      number: "01",
      title: t("landing.howItWorks.step1.title"),
      description: t("landing.howItWorks.step1.description"),
      image: journeyMatch,
      alt: "Request your event",
    },
    {
      number: "02",
      title: t("landing.howItWorks.step2.title"),
      description: t("landing.howItWorks.step2.description"),
      image: journeyWedding,
      alt: "Invite guests",
    },
    {
      number: "03",
      title: t("landing.howItWorks.step3.title"),
      description: t("landing.howItWorks.step3.description"),
      image: journeyDate,
      alt: "Match and connect",
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
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

        {/* Alternating rows */}
        <div className="space-y-20 md:space-y-32">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className="grid md:grid-cols-2 gap-10 md:gap-16 items-center"
              >
                {/* Text side */}
                <div
                  className={`space-y-4 ${isEven ? "md:order-1" : "md:order-2"}`}
                >
                  {/* Large decorative step number */}
                  <span className="block font-display text-7xl md:text-8xl font-bold text-primary/10 leading-none select-none">
                    {step.number}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Image side */}
                <div
                  className={`${isEven ? "md:order-2" : "md:order-1"}`}
                >
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                    <img
                      src={step.image}
                      alt={step.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
