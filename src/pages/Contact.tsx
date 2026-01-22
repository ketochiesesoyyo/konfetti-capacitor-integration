import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, MessageCircle, Clock, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Send email via edge function
      const { error } = await supabase.functions.invoke("contact-form", {
        body: data,
      });

      if (error) throw error;

      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: t("landing.contact.error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incentives = [
    {
      icon: MessageCircle,
      title: t("landing.contact.incentive1.title"),
      description: t("landing.contact.incentive1.description"),
    },
    {
      icon: Clock,
      title: t("landing.contact.incentive2.title"),
      description: t("landing.contact.incentive2.description"),
    },
    {
      icon: Heart,
      title: t("landing.contact.incentive3.title"),
      description: t("landing.contact.incentive3.description"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            {t("landing.contact.badge")}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            {t("landing.contact.title")}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing.contact.subtitle")}
          </p>
        </div>

        {/* Decorative gradient blur */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Incentives */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {incentives.map((incentive, index) => {
              const IconComponent = incentive.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{incentive.title}</h3>
                  <p className="text-sm text-muted-foreground">{incentive.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          {isSuccess ? (
            <div className="bg-card rounded-2xl p-12 shadow-card border border-border text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t("landing.contact.successTitle")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("landing.contact.success")}
              </p>
              <Button
                variant="outline"
                onClick={() => setIsSuccess(false)}
              >
                {t("landing.contact.sendAnother")}
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t("landing.contact.formTitle")}
                </h2>
                <p className="text-muted-foreground">
                  {t("landing.contact.formSubtitle")}
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("landing.contact.name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("landing.contact.namePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("landing.contact.email")}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t("landing.contact.emailPlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("landing.contact.subject")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("landing.contact.subjectPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("landing.contact.message")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("landing.contact.messagePlaceholder")}
                            className="resize-none"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {t("common.loading")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {t("landing.contact.submit")}
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Contact;
