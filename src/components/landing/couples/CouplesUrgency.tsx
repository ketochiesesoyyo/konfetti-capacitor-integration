import { useTranslation } from "react-i18next";
import { Heart, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const CouplesUrgency = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const scrollToContact = () => {
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="scroll-reveal py-24 md:py-32 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden px-6"
    >
      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Heart className="h-8 w-8 text-primary" />
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
          {t("landing.couples.urgency.headline")}
        </h2>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("landing.couples.urgency.subheadline")}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6">
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
          variant="gradient"
          onClick={scrollToContact}
          className="min-w-[280px] text-base"
        >
          {t("landing.couples.urgency.cta")}
        </Button>

        {/* Urgency note */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{t("landing.couples.urgency.note")}</span>
        </div>
      </div>

      {/* Decorative blurs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
    </section>
  );
};
