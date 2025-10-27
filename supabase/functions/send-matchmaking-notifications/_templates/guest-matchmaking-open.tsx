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

interface GuestMatchmakingOpenEmailProps {
  guestName: string;
  eventName: string;
  hostName: string;
  language: string;
  eventId: string;
}

export const GuestMatchmakingOpenEmail = ({
  guestName,
  eventName,
  hostName,
  language,
  eventId,
}: GuestMatchmakingOpenEmailProps) => {
  const content = {
    en: {
      preview: `It's time! Matchmaking for ${eventName} is now open`,
      heading: `It's time! Matchmaking for ${eventName} is now open on konfetti.app`,
      greeting: `Hi ${guestName},`,
      p1: `The matchmaking for ${eventName} is officially open!`,
      p2: `Start discovering who's attending and find your perfect match before the event begins.`,
      p3: `Join now on konfetti.app and let the magic begin!`,
      closing: `Warm wishes,`,
      signature: `${hostName} & konfetti.app`,
      cta: 'Start Matching Now',
    },
    es: {
      preview: `¡Es hora! El matchmaking de ${eventName} ya está abierto`,
      heading: `¡Es hora! El matchmaking de ${eventName} ya está abierto en konfetti.app`,
      greeting: `Hola ${guestName},`,
      p1: `¡El matchmaking para ${eventName} está oficialmente abierto!`,
      p2: `Empieza a descubrir quiénes asistirán y encuentra tu match perfecto antes del evento.`,
      p3: `Entra ahora a konfetti.app y deja que comience la magia.`,
      closing: `Con cariño,`,
      signature: `${hostName} y konfetti.app`,
      cta: 'Empezar a Hacer Match',
    },
  };

  const text = content[language as keyof typeof content] || content.en;

  return (
    <Html>
      <Head />
      <Preview>{text.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>💫 {text.heading}</Heading>
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
