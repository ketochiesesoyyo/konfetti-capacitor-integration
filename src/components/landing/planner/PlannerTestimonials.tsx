import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const PlannerTestimonials = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const testimonials = [
    {
      quote: t("landing.planner.testimonials.testimonial1.quote"),
      author: t("landing.planner.testimonials.testimonial1.author"),
      role: t("landing.planner.testimonials.testimonial1.role"),
    },
    {
      quote: t("landing.planner.testimonials.testimonial2.quote"),
      author: t("landing.planner.testimonials.testimonial2.author"),
      role: t("landing.planner.testimonials.testimonial2.role"),
    },
    {
      quote: t("landing.planner.testimonials.testimonial3.quote"),
      author: t("landing.planner.testimonials.testimonial3.author"),
      role: t("landing.planner.testimonials.testimonial3.role"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 bg-muted/20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.planner.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.planner.testimonials.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="reveal-child space-y-6">
              {/* Decorative quote mark */}
              <span className="block text-6xl leading-none text-primary/20 font-display select-none">
                &ldquo;
              </span>

              {/* Quote */}
              <blockquote className="text-lg italic font-medium text-foreground leading-relaxed -mt-4">
                {testimonial.quote}
              </blockquote>

              {/* Author */}
              <div>
                <p className="font-bold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
