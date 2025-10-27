import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface GuestMatchmakingClosedEmailProps {
  guestName: string;
  eventName: string;
  hostName: string;
  language: string;
}

export const GuestMatchmakingClosedEmail = ({
  guestName,
  eventName,
  hostName,
  language,
}: GuestMatchmakingClosedEmailProps) => {
  const content = {
    en: {
      preview: `Matchmaking for ${eventName} has closed`,
      heading: `Matchmaking for ${eventName} has closed — thank you for joining!`,
      greeting: `Hi ${guestName},`,
      p1: `The matchmaking for ${eventName} is now closed.`,
      p2: `We hope you enjoyed discovering new people and making connections ahead of the celebration.`,
      p3: `You can still access your past matches from your profile, and we'll be here to help you make future events just as exciting.`,
      closing: `Thanks for being part of konfetti.app — where every event starts with a spark.`,
      signature: `With love,`,
      team: `${hostName} & konfetti.app`,
    },
    es: {
      preview: `El matchmaking de ${eventName} ha cerrado`,
      heading: `El matchmaking de ${eventName} ha cerrado — ¡gracias por participar!`,
      greeting: `Hola ${guestName},`,
      p1: `El matchmaking para ${eventName} ha cerrado.`,
      p2: `Esperamos que hayas disfrutado de conocer nuevas personas y crear conexiones antes de la celebración.`,
      p3: `Aún puedes ver tus matches anteriores desde tu perfil, y estaremos aquí para que tus próximos eventos sean igual de emocionantes.`,
      closing: `Gracias por ser parte de konfetti.app, donde cada evento comienza con una chispa.`,
      signature: `Con cariño,`,
      team: `${hostName} y konfetti.app`,
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
