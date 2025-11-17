import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KonfettiLogo } from "@/components/KonfettiLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import profileTim from "@/assets/profile-tim.jpg";
import profileMaria from "@/assets/profile-maria.jpg";
import profileHannah from "@/assets/profile-hannah.jpg";

export const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const profiles = [
    { name: "Tim", age: 27, initials: "T", image: profileTim },
    { name: "Maria", age: 27, initials: "M", image: profileMaria },
    { name: "Hannah", age: 29, initials: "H", image: profileHannah },
  ];

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Header with Logo and Language Switcher */}
      <header className="w-full py-6 px-6 flex justify-between items-center">
        <KonfettiLogo className="h-8" />
        <LanguageSwitcher />
      </header>

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            {t("landing.hero.headline")}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing.hero.subheadline")}
          </p>

          {/* Profile Cards Preview */}
          <div className="flex justify-center gap-4 py-8">
            {profiles.map((profile, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/20 shadow-card">
                  <AvatarImage 
                    src={profile.image} 
                    alt={profile.name}
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="bg-gradient-primary-vertical text-primary-foreground text-xl">
                    {profile.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium text-foreground">
                  {profile.name}, {profile.age}
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              variant="gradient"
              onClick={() => navigate("/create-event")}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {t("landing.hero.createEvent")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/join-event")}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {t("landing.hero.joinEvent")}
            </Button>
          </div>

          {/* Secondary CTA */}
          <p className="text-sm text-muted-foreground pt-4">
            {t("landing.hero.getStarted")}{" "}
            <button
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline font-medium"
            >
              {t("landing.hero.signUp")}
            </button>
          </p>
        </div>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
};
