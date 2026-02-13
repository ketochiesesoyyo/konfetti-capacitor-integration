import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const FAQ = () => {
  const { t } = useTranslation();
  const ref = useScrollReveal();

  const faqs = [
    {
      question: t("landing.faq.q1.question"),
      answer: t("landing.faq.q1.answer"),
    },
    {
      question: t("landing.faq.q2.question"),
      answer: t("landing.faq.q2.answer"),
    },
    {
      question: t("landing.faq.q3.question"),
      answer: t("landing.faq.q3.answer"),
    },
    {
      question: t("landing.faq.q4.question"),
      answer: t("landing.faq.q4.answer"),
    },
    {
      question: t("landing.faq.q5.question"),
      answer: t("landing.faq.q5.answer"),
    },
    {
      question: t("landing.faq.q6.question"),
      answer: t("landing.faq.q6.answer"),
    },
  ];

  return (
    <section ref={ref} className="scroll-reveal py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="eyebrow mb-3">{t("landing.faq.label")}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.faq.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-border/50 px-0"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
