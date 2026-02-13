import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import screenshotDiscover from "@/assets/app-screenshot-discover.jpg";
import screenshotMatch from "@/assets/app-screenshot-match.jpg";
import screenshotChat from "@/assets/app-screenshot-chat.jpg";

export const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ref = useScrollReveal();

  const appScreenshots = [
    { src: screenshotDiscover, alt: "Discover matches at weddings" },
    { src: screenshotMatch, alt: "It's a match!" },
    { src: screenshotChat, alt: "Chat with your matches" },
  ];

  return (
    <section
      ref={ref}
      className="scroll-reveal relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-background via-primary/3 to-background"
    >
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Eyebrow / tagline */}
        <p className="eyebrow">{t("landing.intro.tagline")}</p>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight">
          {t("landing.hero.headline")}
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("landing.hero.subheadline")}
        </p>

        {/* App screenshots strip */}
        <div className="flex justify-center gap-3 md:gap-5 py-6">
          {appScreenshots.map((img, i) => (
            <div
              key={i}
              className="reveal-child w-28 h-56 sm:w-36 sm:h-72 md:w-44 md:h-[22rem] lg:w-52 lg:h-[26rem] rounded-2xl overflow-hidden shadow-lg"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover object-top"
              />
            </div>
          ))}
        </div>

        {/* Single gradient CTA */}
        <div className="flex flex-col items-center gap-4 pt-2">
          <Button
            size="lg"
            variant="gradient"
            onClick={() => {
              document
                .getElementById("contact-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="min-w-[220px] text-base"
          >
            {t("landing.hero.createEvent")}
          </Button>

          <p className="text-sm text-muted-foreground">
            {t("landing.hero.getStarted")}{" "}
            <button
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline font-medium"
            >
              {t("landing.hero.signUp")}
            </button>
          </p>
        </div>

        {/* App Store badges — no labels */}
        <div className="pt-4 flex items-center justify-center gap-6">
          <a
            href="https://apps.apple.com/us/app/konfetti-app/id6758306249"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-105"
          >
            <img
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
              alt="Download on the App Store"
              className="h-[40px] w-[135px] object-contain"
            />
          </a>
          <div className="inline-block opacity-40 grayscale pointer-events-none select-none">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Get it on Google Play"
              className="h-[40px] w-[135px] object-contain"
            />
          </div>
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
