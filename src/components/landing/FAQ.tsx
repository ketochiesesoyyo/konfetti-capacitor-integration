import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const { t } = useTranslation();

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
    {
      question: t("landing.faq.q7.question"),
      answer: t("landing.faq.q7.answer"),
    },
    {
      question: t("landing.faq.q8.question"),
      answer: t("landing.faq.q8.answer"),
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.faq.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-2xl px-6 bg-card shadow-soft hover:shadow-card transition-shadow"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
