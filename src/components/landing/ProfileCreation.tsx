import { useTranslation } from "react-i18next";
import { ImagePlus, FileText, ListChecks, MessageCircleQuestion, Settings } from "lucide-react";

export const ProfileCreation = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: ImagePlus,
      title: t("landing.profileCreation.step1.title"),
      description: t("landing.profileCreation.step1.description"),
    },
    {
      icon: FileText,
      title: t("landing.profileCreation.step2.title"),
      description: t("landing.profileCreation.step2.description"),
    },
    {
      icon: ListChecks,
      title: t("landing.profileCreation.step3.title"),
      description: t("landing.profileCreation.step3.description"),
    },
    {
      icon: MessageCircleQuestion,
      title: t("landing.profileCreation.step4.title"),
      description: t("landing.profileCreation.step4.description"),
    },
    {
      icon: Settings,
      title: t("landing.profileCreation.step5.title"),
      description: t("landing.profileCreation.step5.description"),
    },
  ];

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.profileCreation.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.profileCreation.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all duration-300"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <IconComponent className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl px-6 py-3 inline-block shadow-soft">
            🔒 {t("landing.profileCreation.privacy")}
          </p>
        </div>
      </div>
    </section>
  );
};
