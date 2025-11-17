import { useTranslation } from "react-i18next";
import { Calendar, MessageSquare, Camera, Lightbulb, Tag, Instagram, Languages, Palette } from "lucide-react";

export const FeaturesHighlight = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Calendar,
      title: t("landing.features.feature1.title"),
      description: t("landing.features.feature1.description"),
    },
    {
      icon: MessageSquare,
      title: t("landing.features.feature2.title"),
      description: t("landing.features.feature2.description"),
    },
    {
      icon: Camera,
      title: t("landing.features.feature3.title"),
      description: t("landing.features.feature3.description"),
    },
    {
      icon: Lightbulb,
      title: t("landing.features.feature4.title"),
      description: t("landing.features.feature4.description"),
    },
    {
      icon: Tag,
      title: t("landing.features.feature5.title"),
      description: t("landing.features.feature5.description"),
    },
    {
      icon: Instagram,
      title: t("landing.features.feature6.title"),
      description: t("landing.features.feature6.description"),
    },
    {
      icon: Languages,
      title: t("landing.features.feature7.title"),
      description: t("landing.features.feature7.description"),
    },
    {
      icon: Palette,
      title: t("landing.features.feature8.title"),
      description: t("landing.features.feature8.description"),
    },
  ];

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all duration-300 space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-primary-vertical flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
