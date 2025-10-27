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

interface Host24hBeforeCloseEmailProps {
  hostName: string;
  eventName: string;
  language: string;
  eventId: string;
}

export const Host24hBeforeCloseEmail = ({
  hostName,
  eventName,
  language,
  eventId,
}: Host24hBeforeCloseEmailProps) => {
  const content = {
    en: {
      preview: `Matchmaking for ${eventName} closes in 24 hours`,
      heading: `Reminder: matchmaking for ${eventName} closes in 24 hours`,
      greeting: `Hi ${hostName},`,
      p1: `Matchmaking for ${eventName} will close in 24 hours.`,
      p2: `Your guests still have time to send their final messages and matches before the event begins.`,
      p3: `You can check your dashboard on konfetti.app to view engagement and see how active your guests have been.`,
      closing: `Best,`,
      team: `The konfetti.app team`,
      cta: 'View Dashboard',
    },
    es: {
      preview: `El matchmaking de ${eventName} cierra en 24 horas`,
      heading: `Recordatorio: el matchmaking de ${eventName} cierra en 24 horas`,
      greeting: `Hola ${hostName},`,
      p1: `El matchmaking de ${eventName} cerrará en 24 horas.`,
      p2: `Tus invitados aún tienen tiempo para enviar sus últimos mensajes y matches antes del evento.`,
      p3: `Puedes revisar tu panel en konfetti.app para ver la participación y actividad de los invitados.`,
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
          <Text style={paragraph}>{text.p3}</Text>
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
