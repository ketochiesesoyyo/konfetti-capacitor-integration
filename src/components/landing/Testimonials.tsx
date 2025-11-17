import { useTranslation } from "react-i18next";
import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Testimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      type: "couple",
      quote: t("landing.testimonials.couple.quote"),
      author: t("landing.testimonials.couple.author"),
      role: t("landing.testimonials.couple.role"),
      initials: "CM",
    },
    {
      type: "host",
      quote: t("landing.testimonials.host.quote"),
      author: t("landing.testimonials.host.author"),
      role: t("landing.testimonials.host.role"),
      initials: "GC",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 rounded-3xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Quote className="h-6 w-6 text-primary" />
              </div>

              {/* Avatar */}
              <div className="mb-6">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src="" alt={testimonial.author} />
                  <AvatarFallback className="bg-gradient-primary-vertical text-primary-foreground">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
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
