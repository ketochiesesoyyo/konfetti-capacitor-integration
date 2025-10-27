import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface Guest24hBeforeCloseEmailProps {
  guestName: string;
  eventName: string;
  hostName: string;
  language: string;
  eventId: string;
}

export const Guest24hBeforeCloseEmail = ({
  guestName,
  eventName,
  hostName,
  language,
  eventId,
}: Guest24hBeforeCloseEmailProps) => {
  const content = {
    en: {
      preview: `Last chance to match before ${eventName}!`,
      heading: `Last chance to match before ${eventName}!`,
      greeting: `Hi ${guestName},`,
      p1: `Your matchmaking for ${eventName} will close in 24 hours — this is your final chance to connect before the big day!`,
      p2: `Check your matches, send your last messages, or see if there's someone new you'd like to meet.`,
      p3: `Join now on konfetti.app and make the most of it!`,
      closing: `See you at the event,`,
      signature: `${hostName} & konfetti.app`,
      cta: 'Go to Matchmaking',
    },
    es: {
      preview: `¡Última oportunidad para hacer match antes de ${eventName}!`,
      heading: `¡Última oportunidad para hacer match antes de ${eventName}!`,
      greeting: `Hola ${guestName},`,
      p1: `Tu matchmaking para ${eventName} cerrará en 24 horas — ¡es tu última oportunidad para conectar antes del gran día!`,
      p2: `Revisa tus matches, envía tus últimos mensajes o descubre si hay alguien nuevo que te gustaría conocer.`,
      p3: `Entra ahora a konfetti.app y aprovecha al máximo esta oportunidad.`,
      closing: `¡Nos vemos en el evento!,`,
      signature: `${hostName} y konfetti.app`,
      cta: 'Ir al Matchmaking',
    },
  };

  const text = content[language as keyof typeof content] || content.en;

  return (
    <Html>
      <Head />
      <Preview>{text.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⏰ {text.heading}</Heading>
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
