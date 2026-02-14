import { useTranslation } from "react-i18next";
import { Star, MapPin } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const CouplesSocialProof = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const stories = [
    {
      quote: t("landing.couples.socialProof.story1Quote"),
      names: t("landing.couples.socialProof.story1Names"),
      location: t("landing.couples.socialProof.story1Location"),
      matches: 12,
    },
    {
      quote: t("landing.couples.socialProof.story2Quote"),
      names: t("landing.couples.socialProof.story2Names"),
      location: t("landing.couples.socialProof.story2Location"),
      matches: 8,
    },
    {
      quote: t("landing.couples.socialProof.story3Quote"),
      names: t("landing.couples.socialProof.story3Names"),
      location: t("landing.couples.socialProof.story3Location"),
      matches: 15,
    },
  ];

  const cities = [
    "Mexico City", "Los Cabos", "Playa del Carmen", "Cancun", "Cuernavaca", "San Miguel de Allende"
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.couples.socialProof.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.couples.socialProof.subtitle")}
          </p>
        </div>

        {/* Stories Grid — no card borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-16">
          {stories.map((story, index) => (
            <div key={index} className="reveal-child space-y-4 bg-background rounded-2xl p-6 shadow-sm">
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground italic leading-relaxed">"{story.quote}"</p>

              {/* Names & Location */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{story.names}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {story.location}
                </span>
              </div>

              {/* Matches badge */}
              <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-3 py-1 rounded-full text-xs font-medium">
                {t("landing.couples.socialProof.matchesBadge", { count: story.matches })}
              </div>
            </div>
          ))}
        </div>

        {/* Cities */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t("landing.couples.socialProof.citiesLabel")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <span
                key={city}
                className="bg-background px-4 py-2 rounded-full text-sm text-foreground shadow-sm"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
