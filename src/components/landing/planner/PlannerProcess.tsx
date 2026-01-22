import { useTranslation } from "react-i18next";
import { Mail, UserPlus, Link, Heart, MessageSquare } from "lucide-react";

export const PlannerProcess = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Mail,
      step: "01",
      title: t("landing.planner.process.step1.title"),
      description: t("landing.planner.process.step1.description"),
    },
    {
      icon: UserPlus,
      step: "02",
      title: t("landing.planner.process.step2.title"),
      description: t("landing.planner.process.step2.description"),
    },
    {
      icon: Link,
      step: "03",
      title: t("landing.planner.process.step3.title"),
      description: t("landing.planner.process.step3.description"),
    },
    {
      icon: Heart,
      step: "04",
      title: t("landing.planner.process.step4.title"),
      description: t("landing.planner.process.step4.description"),
    },
    {
      icon: MessageSquare,
      step: "05",
      title: t("landing.planner.process.step5.title"),
      description: t("landing.planner.process.step5.description"),
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.planner.process.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.planner.process.subtitle")}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line for desktop */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-border" />

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={index}
                  className={`relative flex items-center ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`flex-1 ${
                      isEven ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"
                    }`}
                  >
                    <div
                      className={`p-6 rounded-3xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 ${
                        isEven ? "md:ml-auto" : "md:mr-auto"
                      } md:max-w-md`}
                    >
                      <div className={`flex items-center gap-4 mb-4 ${isEven ? "md:flex-row-reverse" : ""}`}>
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <IconComponent className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {t("landing.planner.process.step")} {step.step}
                        </div>
                      </div>
                      <h3 className={`text-xl font-bold text-foreground mb-2 ${isEven ? "md:text-right" : "md:text-left"}`}>
                        {step.title}
                      </h3>
                      <p className={`text-muted-foreground leading-relaxed ${isEven ? "md:text-right" : "md:text-left"}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center dot for desktop */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-lg" />

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
