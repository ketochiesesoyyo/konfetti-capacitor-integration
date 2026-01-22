import { useTranslation } from "react-i18next";
import { X, Check, ArrowRight } from "lucide-react";

export const CouplesProblemSolution = () => {
  const { t } = useTranslation();

  const withoutKonfetti = [
    t("landing.couples.problemSolution.without1"),
    t("landing.couples.problemSolution.without2"),
    t("landing.couples.problemSolution.without3"),
    t("landing.couples.problemSolution.without4"),
  ];

  const withKonfetti = [
    t("landing.couples.problemSolution.with1"),
    t("landing.couples.problemSolution.with2"),
    t("landing.couples.problemSolution.with3"),
    t("landing.couples.problemSolution.with4"),
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.couples.problemSolution.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.couples.problemSolution.subtitle")}
          </p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Without Konfetti */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {t("landing.couples.problemSolution.withoutTitle")}
              </h3>
            </div>
            <ul className="space-y-4">
              {withoutKonfetti.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow (hidden on mobile) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <ArrowRight className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          {/* With Konfetti */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 relative">
            {/* Recommended badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                {t("landing.couples.problemSolution.recommended")}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {t("landing.couples.problemSolution.withTitle")}
              </h3>
            </div>
            <ul className="space-y-4">
              {withKonfetti.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
