import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { eventRequestSchema, type EventRequestFormData } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export const ContactForm = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<EventRequestFormData>({
    resolver: zodResolver(eventRequestSchema),
    defaultValues: {
      partner1_name: "",
      partner2_name: "",
      expected_guests: undefined,
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = async (data: EventRequestFormData) => {
    setIsSubmitting(true);
    try {
      const formattedDate = format(data.wedding_date, "yyyy-MM-dd");
      
      // Save to database
      const { error } = await supabase.from("event_requests").insert({
        partner1_name: data.partner1_name,
        partner2_name: data.partner2_name,
        wedding_date: formattedDate,
        expected_guests: data.expected_guests,
        email: data.email,
        phone: data.phone,
        message: data.message || null,
      });

      if (error) throw error;

      // Send email notification (fire and forget - don't block success)
      try {
        await supabase.functions.invoke("event-request-notification", {
          body: {
            partner1_name: data.partner1_name,
            partner2_name: data.partner2_name,
            wedding_date: formattedDate,
            expected_guests: data.expected_guests,
            email: data.email,
            phone: data.phone,
            message: data.message,
          },
        });
      } catch (emailError) {
        // Log but don't fail the submission
        console.error("Failed to send notification email:", emailError);
      }

      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: t("landing.contactForm.error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="contact-form" className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card rounded-2xl p-12 shadow-card border border-border">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {t("landing.contactForm.successTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("landing.contactForm.success")}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setIsSuccess(false)}
            >
              {t("landing.contactForm.submitAnother")}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact-form" className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landing.contactForm.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.contactForm.subtitle")}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Partner Names - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="partner1_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("landing.contactForm.partner1")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Maria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partner2_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("landing.contactForm.partner2")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Wedding Date */}
              <FormField
                control={form.control}
                name="wedding_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("landing.contactForm.weddingDate")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t("landing.contactForm.selectDate")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expected Guests */}
              <FormField
                control={form.control}
                name="expected_guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("landing.contactForm.expectedGuests")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Info - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("landing.contactForm.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="maria@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("landing.contactForm.phone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+52 55 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("landing.contactForm.message")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("landing.contactForm.messagePlaceholder")}
                        className="resize-none"
                        rows={4}
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
                    {t("landing.contactForm.submit")}
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};
