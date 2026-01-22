import { useTranslation } from "react-i18next";
import { Star, MapPin } from "lucide-react";

export const CouplesSocialProof = () => {
  const { t } = useTranslation();

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
    "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Bilbao"
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.couples.socialProof.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.couples.socialProof.subtitle")}
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stories.map((story, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-4 italic">"{story.quote}"</p>

              {/* Names & Location */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{story.names}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {story.location}
                </span>
              </div>

              {/* Matches badge */}
              <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                {t("landing.couples.socialProof.matchesBadge", { count: story.matches })}
              </div>
            </div>
          ))}
        </div>

        {/* Cities where it works */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t("landing.couples.socialProof.citiesLabel")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <span
                key={city}
                className="bg-background border border-border px-4 py-2 rounded-full text-sm text-foreground"
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
