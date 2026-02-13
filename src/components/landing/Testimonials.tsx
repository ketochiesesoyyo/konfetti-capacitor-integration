import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import testimonialCarole from "@/assets/testimonial-carole.jpg";
import testimonialGuillermo from "@/assets/testimonial-guillermo.jpg";

export const Testimonials = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const testimonials = [
    {
      quote: t("landing.testimonials.couple.quote"),
      author: t("landing.testimonials.couple.author"),
      role: t("landing.testimonials.couple.role"),
      image: testimonialCarole,
    },
    {
      quote: t("landing.testimonials.host.quote"),
      author: t("landing.testimonials.host.author"),
      role: t("landing.testimonials.host.role"),
      image: testimonialGuillermo,
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="eyebrow mb-3">{t("landing.testimonials.label")}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        {/* Editorial quotes */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {testimonials.map((item, index) => (
            <div key={index} className="reveal-child space-y-6">
              {/* Decorative quotation mark */}
              <span className="block text-6xl leading-none text-primary/20 font-display select-none">
                &ldquo;
              </span>

              {/* Quote */}
              <blockquote className="text-lg italic font-medium text-foreground leading-relaxed -mt-4">
                {item.quote}
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.author}
                  className="w-14 h-14 rounded-full object-cover object-top"
                />
                <div>
                  <p className="font-bold text-foreground">{item.author}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
