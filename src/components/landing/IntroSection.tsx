import { useTranslation } from "react-i18next";

export const IntroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">
          {t("landing.intro.title")}
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("landing.intro.description")}
        </p>
        <p className="text-base md:text-lg text-foreground font-medium pt-4">
          {t("landing.intro.tagline")}
        </p>
      </div>
    </section>
  );
};
