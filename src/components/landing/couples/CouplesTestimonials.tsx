import { useTranslation } from "react-i18next";
import { Quote, Star } from "lucide-react";
import testimonialCarole from "@/assets/testimonial-carole.jpg";
import testimonialGuillermo from "@/assets/testimonial-guillermo.jpg";

export const CouplesTestimonials = () => {
  const { t } = useTranslation();

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
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.couples.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.couples.testimonials.subtitle")}
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-8 relative"
            >
              {/* Quote icon */}
              <Quote className="h-10 w-10 text-primary/20 absolute top-6 right-6" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg text-foreground mb-6 relative z-10">
                "{testimonial.quote}"
              </p>

              {/* Result badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
                {testimonial.matchesResult}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
