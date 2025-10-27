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

interface HostEventLiveEmailProps {
  hostName: string;
  eventName: string;
  language: string;
  eventId: string;
}

export const HostEventLiveEmail = ({
  hostName,
  eventName,
  language,
  eventId,
}: HostEventLiveEmailProps) => {
  const content = {
    en: {
      preview: `Your event ${eventName} is live on konfetti.app`,
      heading: `${hostName}, your event ${eventName} is live on konfetti.app`,
      greeting: `Hi ${hostName},`,
      p1: `Your event ${eventName} is now live and guests have started receiving their invitations!`,
      p2: `You can check your dashboard on konfetti.app to see who has joined and when matchmaking will open.`,
      closing: `Thanks for hosting with konfetti.app — where every event starts with a spark.`,
      signature: `Best,`,
      team: `The konfetti.app team`,
      cta: 'View Dashboard',
    },
    es: {
      preview: `Tu evento ${eventName} ya está activo en konfetti.app`,
      heading: `${hostName}, tu evento ${eventName} ya está activo en konfetti.app`,
      greeting: `Hola ${hostName},`,
      p1: `Tu evento ${eventName} ya está activo y tus invitados han comenzado a recibir sus invitaciones.`,
      p2: `Puedes revisar tu panel en konfetti.app para ver quién se ha unido y cuándo abrirá el matchmaking.`,
      closing: `Gracias por organizar tu evento con konfetti.app — donde cada evento comienza con una chispa.`,
      signature: `Saludos,`,
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
          <Heading style={h1}>🎉 {text.heading}</Heading>
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
          <Text style={signature}>{text.signature}</Text>
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
