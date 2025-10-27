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

interface Host24hBeforeOpenEmailProps {
  hostName: string;
  eventName: string;
  language: string;
  eventId: string;
}

export const Host24hBeforeOpenEmail = ({
  hostName,
  eventName,
  language,
  eventId,
}: Host24hBeforeOpenEmailProps) => {
  const content = {
    en: {
      preview: `Matchmaking for ${eventName} opens in 24 hours`,
      heading: `Reminder: matchmaking for ${eventName} opens in 24 hours`,
      greeting: `Hi ${hostName},`,
      p1: `This is a friendly reminder that matchmaking for your event ${eventName} opens in 24 hours.`,
      p2: `You can log in to konfetti.app to make any last-minute edits or simply watch your guests get ready to mingle.`,
      closing: `Cheers,`,
      team: `The konfetti.app team`,
      cta: 'View Dashboard',
    },
    es: {
      preview: `El matchmaking de ${eventName} abrirá en 24 horas`,
      heading: `Recordatorio: el matchmaking de ${eventName} abrirá en 24 horas`,
      greeting: `Hola ${hostName},`,
      p1: `Este es un recordatorio amistoso de que el matchmaking para tu evento ${eventName} abrirá en 24 horas.`,
      p2: `Puedes iniciar sesión en konfetti.app para hacer ajustes de último momento o simplemente ver cómo tus invitados se preparan para conectar.`,
      closing: `Saludos,`,
      team: `El equipo de konfetti.app`,
      cta: 'Ver Panel',
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
          <Button
            href={`https://konfetti-capacitor-integration.lovable.app/event-dashboard/${eventId}`}
            style={button}
          >
            {text.cta}
          </Button>
          <Text style={paragraph}>{text.closing}</Text>
          <Text style={signature}>{text.team}</Text>
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
