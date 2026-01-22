import { useTranslation } from "react-i18next";
import { Quote, Star } from "lucide-react";

export const PlannerTestimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      quote: t("landing.planner.testimonials.testimonial1.quote"),
      author: t("landing.planner.testimonials.testimonial1.author"),
      role: t("landing.planner.testimonials.testimonial1.role"),
      rating: 5,
    },
    {
      quote: t("landing.planner.testimonials.testimonial2.quote"),
      author: t("landing.planner.testimonials.testimonial2.author"),
      role: t("landing.planner.testimonials.testimonial2.role"),
      rating: 5,
    },
    {
      quote: t("landing.planner.testimonials.testimonial3.quote"),
      author: t("landing.planner.testimonials.testimonial3.author"),
      role: t("landing.planner.testimonials.testimonial3.role"),
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.planner.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.planner.testimonials.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 rounded-3xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Quote className="h-5 w-5 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground text-lg leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Author Info */}
              <div className="space-y-1">
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
