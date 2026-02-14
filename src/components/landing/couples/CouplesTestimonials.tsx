import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import testimonialCarole from "@/assets/testimonial-carole.jpg";
import testimonialGuillermo from "@/assets/testimonial-guillermo.jpg";

export const CouplesTestimonials = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const testimonials = [
    {
      quote: t("landing.couples.testimonials.testimonial1Quote"),
      name: t("landing.couples.testimonials.testimonial1Name"),
      role: t("landing.couples.testimonials.testimonial1Role"),
      image: testimonialCarole,
      matchesResult: t("landing.couples.testimonials.testimonial1Result"),
    },
    {
      quote: t("landing.couples.testimonials.testimonial2Quote"),
      name: t("landing.couples.testimonials.testimonial2Name"),
      role: t("landing.couples.testimonials.testimonial2Role"),
      image: testimonialGuillermo,
      matchesResult: t("landing.couples.testimonials.testimonial2Result"),
    },
    {
      quote: t("landing.couples.testimonials.testimonial3Quote"),
      name: t("landing.couples.testimonials.testimonial3Name"),
      role: t("landing.couples.testimonials.testimonial3Role"),
      matchesResult: t("landing.couples.testimonials.testimonial3Result"),
    },
    {
      quote: t("landing.couples.testimonials.testimonial4Quote"),
      name: t("landing.couples.testimonials.testimonial4Name"),
      role: t("landing.couples.testimonials.testimonial4Role"),
      matchesResult: t("landing.couples.testimonials.testimonial4Result"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 bg-muted/40">
      {/* Header */}
      <div className="text-center mb-16 px-6">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          {t("landing.couples.testimonials.title")}
        </h2>
        <p className="text-lg text-muted-foreground">
          {t("landing.couples.testimonials.subtitle")}
        </p>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 pb-4 justify-center">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="reveal-child snap-start shrink-0 w-[320px] space-y-5"
          >
            {/* Decorative quote mark */}
            <span className="block text-6xl leading-none text-primary/20 font-display select-none">
              &ldquo;
            </span>

            {/* Quote */}
            <blockquote className="text-sm italic font-medium text-foreground leading-relaxed -mt-4">
              {testimonial.quote}
            </blockquote>

            {/* Result badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {testimonial.matchesResult}
            </div>

            {/* Author */}
            <div className="flex items-center gap-3">
              {"image" in testimonial && testimonial.image && (
                <img
                  src={testimonial.image as string}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover object-top"
                />
              )}
              <div>
                <p className="font-bold text-foreground text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
