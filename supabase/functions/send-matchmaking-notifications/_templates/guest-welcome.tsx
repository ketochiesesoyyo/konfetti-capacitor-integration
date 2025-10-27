import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface GuestWelcomeEmailProps {
  guestName: string;
  eventName: string;
  hostName: string;
  language: string;
  eventId: string;
}

export const GuestWelcomeEmail = ({
  guestName,
  eventName,
  hostName,
  language,
  eventId,
}: GuestWelcomeEmailProps) => {
  const content = {
    en: {
      preview: `Welcome to ${eventName} on konfetti.app!`,
      heading: `Welcome to ${eventName} on konfetti.app! Your matchmaking opens soon`,
      greeting: `Hi ${guestName},`,
      p1: `You've been invited to join ${eventName} on konfetti.app — a private matchmaking space created just for this event.`,
      p2: `Your matchmaking experience will open soon. Once it starts, you'll be able to see and match with other guests attending the event.`,
      p3: `Stay tuned — we'll send you a reminder 24 hours before it begins!`,
      closing: `Cheers,`,
      signature: `${hostName} & the konfetti.app team`,
      cta: 'View Event',
    },
    es: {
      preview: `¡Bienvenido(a) a ${eventName} en konfetti.app!`,
      heading: `¡Bienvenido(a) a ${eventName} en konfetti.app! ¡Tu matchmaking abrirá pronto!`,
      greeting: `Hola ${guestName},`,
      p1: `Has sido invitado(a) a ${eventName} en konfetti.app, un espacio privado de matchmaking creado especialmente para este evento.`,
      p2: `Tu experiencia de matchmaking abrirá pronto. En cuanto comience, podrás ver y conectar con otros invitados del evento.`,
      p3: `Mantente atento(a): te enviaremos un recordatorio 24 horas antes de que empiece.`,
      closing: `Saludos,`,
      signature: `${hostName} y el equipo de konfetti.app`,
      cta: 'Ver Evento',
    },
  };

  const text = content[language as keyof typeof content] || content.en;

  return (
    <Html>
      <Head />
      <Preview>{text.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 {text.heading}</Heading>
          <Text style={paragraph}>{text.greeting}</Text>
          <Text style={paragraph}>{text.p1}</Text>
          <Text style={paragraph}>{text.p2}</Text>
          <Text style={paragraph}>{text.p3}</Text>
          <Button
            href={`https://konfetti-capacitor-integration.lovable.app/matchmaking?event=${eventId}`}
            style={button}
          >
            {text.cta}
          </Button>
          <Text style={paragraph}>{text.closing}</Text>
          <Text style={signature}>{text.signature}</Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const paragraph = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const signature = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
};

const button = {
  backgroundColor: '#9b87f5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '24px 0',
};
