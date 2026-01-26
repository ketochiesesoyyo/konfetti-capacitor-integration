import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, HelpCircle, AlertCircle, Mail, MessageSquare } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const supportSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

type SupportFormData = z.infer<typeof supportSchema>;

const Support = () => {
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isSpanish = i18n.language === "es";

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: SupportFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("contact-form", {
        body: { ...data, subject: `[Support] ${data.subject}` },
      });

      if (error) throw error;

      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: isSpanish ? "Error al enviar" : "Error sending message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = isSpanish ? [
    {
      question: "¿Cómo funciona Konfetti?",
      answer: "Konfetti es una app de matchmaking exclusiva para invitados de boda. Los novios crean un evento, comparten el código con sus invitados solteros, y estos pueden hacer match con otros invitados antes, durante y después de la boda.",
    },
    {
      question: "¿Cómo me uno a un evento?",
      answer: "Necesitas un código de invitación de los novios. Una vez que lo tengas, crea tu cuenta, completa tu perfil y únete al evento usando el código.",
    },
    {
      question: "¿Es gratis usar Konfetti?",
      answer: "Sí, Konfetti es completamente gratis para los invitados. Los novios pueden solicitar un evento a través de nuestra página de contacto.",
    },
    {
      question: "¿Cómo puedo editar mi perfil?",
      answer: "Ve a tu perfil tocando el ícono de perfil en la barra de navegación, luego toca 'Editar Perfil' para modificar tus fotos, bio y prompts.",
    },
    {
      question: "¿Cómo hago match con alguien?",
      answer: "En la sección de Matchmaking, desliza a la derecha para dar like a alguien. Si ambos se dan like, ¡es un match! Podrán chatear en la sección de Chats.",
    },
    {
      question: "¿Puedo eliminar mi cuenta?",
      answer: "Sí, puedes eliminar tu cuenta en Configuración. Esto eliminará permanentemente todos tus datos, fotos y matches.",
    },
    {
      question: "¿Mis datos están seguros?",
      answer: "Sí, tomamos la privacidad muy en serio. Solo los invitados del mismo evento pueden ver tu perfil, y nunca compartimos tus datos con terceros.",
    },
  ] : [
    {
      question: "How does Konfetti work?",
      answer: "Konfetti is an exclusive matchmaking app for wedding guests. Couples create an event, share the code with their single guests, and guests can match with other attendees before, during, and after the wedding.",
    },
    {
      question: "How do I join an event?",
      answer: "You need an invite code from the couple. Once you have it, create your account, complete your profile, and join the event using the code.",
    },
    {
      question: "Is Konfetti free to use?",
      answer: "Yes, Konfetti is completely free for guests. Couples can request an event through our contact page.",
    },
    {
      question: "How do I edit my profile?",
      answer: "Go to your profile by tapping the profile icon in the navigation bar, then tap 'Edit Profile' to modify your photos, bio, and prompts.",
    },
    {
      question: "How do I match with someone?",
      answer: "In the Matchmaking section, swipe right to like someone. If you both like each other, it's a match! You can then chat in the Chats section.",
    },
    {
      question: "Can I delete my account?",
      answer: "Yes, you can delete your account in Settings. This will permanently remove all your data, photos, and matches.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take privacy seriously. Only guests from the same event can see your profile, and we never share your data with third parties.",
    },
  ];

  const troubleshooting = isSpanish ? [
    {
      issue: "No recibo notificaciones",
      solution: "Asegúrate de que las notificaciones estén habilitadas en la configuración de tu dispositivo. Ve a Configuración > Konfetti > Notificaciones y actívalas.",
    },
    {
      issue: "No puedo subir fotos",
      solution: "Verifica que Konfetti tenga permiso de acceso a tu galería. Las fotos deben ser menores a 10MB y en formato JPG o PNG.",
    },
    {
      issue: "El código de invitación no funciona",
      solution: "Verifica que el código esté escrito correctamente y que el evento esté activo. Contacta a los novios si el problema persiste.",
    },
    {
      issue: "No veo otros perfiles",
      solution: "Es posible que no haya otros invitados solteros registrados aún, o que ya hayas visto todos los perfiles disponibles.",
    },
    {
      issue: "La app se cierra inesperadamente",
      solution: "Asegúrate de tener la última versión de la app. Intenta cerrar y reabrir la aplicación, o reinstálala si el problema continúa.",
    },
  ] : [
    {
      issue: "I'm not receiving notifications",
      solution: "Make sure notifications are enabled in your device settings. Go to Settings > Konfetti > Notifications and enable them.",
    },
    {
      issue: "I can't upload photos",
      solution: "Check that Konfetti has permission to access your photo library. Photos must be under 10MB and in JPG or PNG format.",
    },
    {
      issue: "The invite code doesn't work",
      solution: "Verify the code is entered correctly and the event is active. Contact the couple if the problem persists.",
    },
    {
      issue: "I don't see other profiles",
      solution: "There may not be other single guests registered yet, or you may have already seen all available profiles.",
    },
    {
      issue: "The app closes unexpectedly",
      solution: "Make sure you have the latest version of the app. Try closing and reopening the app, or reinstall it if the issue continues.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <HelpCircle className="h-4 w-4" />
            {isSpanish ? "Centro de Ayuda" : "Help Center"}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            {isSpanish ? "¿Cómo podemos ayudarte?" : "How can we help you?"}
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isSpanish 
              ? "Encuentra respuestas a preguntas frecuentes, soluciona problemas o contáctanos directamente."
              : "Find answers to common questions, troubleshoot issues, or contact us directly."
            }
          </p>
        </div>

        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
          <a href="#faq" className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-card transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-1">{isSpanish ? "Preguntas Frecuentes" : "FAQ"}</h3>
            <p className="text-sm text-muted-foreground">{isSpanish ? "Respuestas rápidas" : "Quick answers"}</p>
          </a>
          
          <a href="#troubleshooting" className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-card transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-1">{isSpanish ? "Solución de Problemas" : "Troubleshooting"}</h3>
            <p className="text-sm text-muted-foreground">{isSpanish ? "Arregla problemas comunes" : "Fix common issues"}</p>
          </a>
          
          <a href="#contact" className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-card transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-1">{isSpanish ? "Contactar Soporte" : "Contact Support"}</h3>
            <p className="text-sm text-muted-foreground">{isSpanish ? "Estamos para ayudarte" : "We're here to help"}</p>
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {isSpanish ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-border rounded-xl px-5 bg-card"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Troubleshooting Section */}
      <section id="troubleshooting" className="py-12 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <AlertCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {isSpanish ? "Solución de Problemas" : "Troubleshooting"}
            </h2>
          </div>

          <div className="space-y-4">
            {troubleshooting.map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-destructive/10 text-destructive text-xs flex items-center justify-center font-bold">!</span>
                  {item.issue}
                </h3>
                <p className="text-muted-foreground pl-8">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-12 px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {isSpanish ? "Contáctanos" : "Contact Us"}
            </h2>
          </div>

          {isSuccess ? (
            <div className="bg-card rounded-2xl p-10 shadow-card border border-border text-center">
              <CheckCircle className="h-14 w-14 text-primary mx-auto mb-5" />
              <h3 className="text-xl font-bold text-foreground mb-3">
                {isSpanish ? "¡Mensaje Enviado!" : "Message Sent!"}
              </h3>
              <p className="text-muted-foreground mb-5">
                {isSpanish 
                  ? "Hemos recibido tu mensaje. Te responderemos lo antes posible."
                  : "We've received your message. We'll get back to you as soon as possible."
                }
              </p>
              <Button variant="outline" onClick={() => setIsSuccess(false)}>
                {isSpanish ? "Enviar otro mensaje" : "Send another message"}
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
              <p className="text-center text-muted-foreground mb-6">
                {isSpanish 
                  ? "¿No encontraste lo que buscabas? Escríbenos y te ayudaremos."
                  : "Didn't find what you were looking for? Write to us and we'll help."
                }
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isSpanish ? "Nombre" : "Name"}</FormLabel>
                          <FormControl>
                            <Input placeholder={isSpanish ? "Tu nombre" : "Your name"} {...field} />
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
                          <FormLabel>{isSpanish ? "Correo" : "Email"}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={isSpanish ? "tu@correo.com" : "you@email.com"} {...field} />
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
                        <FormLabel>{isSpanish ? "Asunto" : "Subject"}</FormLabel>
                        <FormControl>
                          <Input placeholder={isSpanish ? "¿En qué podemos ayudarte?" : "What can we help you with?"} {...field} />
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
                        <FormLabel>{isSpanish ? "Mensaje" : "Message"}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={isSpanish ? "Describe tu problema o pregunta..." : "Describe your issue or question..."}
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
                        {isSpanish ? "Enviando..." : "Sending..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {isSpanish ? "Enviar Mensaje" : "Send Message"}
                      </span>
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isSpanish ? "O escríbenos directamente a " : "Or email us directly at "}
                <a href="mailto:support@konfetti.app" className="text-primary hover:underline">
                  support@konfetti.app
                </a>
              </p>
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Support;
