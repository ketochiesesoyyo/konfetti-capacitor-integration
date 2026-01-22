import { useTranslation } from "react-i18next";
import { Heart, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CouplesUrgency = () => {
  const { t } = useTranslation();

  const scrollToContact = () => {
    const element = document.getElementById("contact-form");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8">
          <Heart className="h-8 w-8 text-primary" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          {t("landing.couples.urgency.headline")}
        </h2>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("landing.couples.urgency.subheadline")}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>{t("landing.couples.urgency.stat1")}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>{t("landing.couples.urgency.stat2")}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>{t("landing.couples.urgency.stat3")}</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={scrollToContact}
          className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          {t("landing.couples.urgency.cta")}
        </Button>

        {/* Urgency note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{t("landing.couples.urgency.note")}</span>
        </div>
      </div>
    </section>
  );
};
