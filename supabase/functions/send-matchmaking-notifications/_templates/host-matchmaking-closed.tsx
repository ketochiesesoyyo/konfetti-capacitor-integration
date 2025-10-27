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

interface HostMatchmakingClosedEmailProps {
  hostName: string;
  eventName: string;
  language: string;
}

export const HostMatchmakingClosedEmail = ({
  hostName,
  eventName,
  language,
}: HostMatchmakingClosedEmailProps) => {
  const content = {
    en: {
      preview: `Matchmaking for ${eventName} is now closed`,
      heading: `Matchmaking for ${eventName} is now closed — thank you for hosting with konfetti.app`,
      greeting: `Hi ${hostName},`,
      p1: `The matchmaking for ${eventName} has officially closed.`,
      p2: `We hope your guests had fun connecting before the big day and that konfetti.app helped make your event even more special.`,
      closing: `Thank you for trusting us to be part of your celebration. We look forward to helping you host your next unforgettable event.`,
      signature: `With gratitude,`,
      team: `The konfetti.app team`,
    },
    es: {
      preview: `El matchmaking de ${eventName} ha cerrado`,
      heading: `El matchmaking de ${eventName} ha cerrado — gracias por organizar con konfetti.app`,
      greeting: `Hola ${hostName},`,
      p1: `El matchmaking para ${eventName} ha cerrado oficialmente.`,
      p2: `Esperamos que tus invitados hayan disfrutado de conectar antes del gran día y que konfetti.app haya hecho tu evento aún más especial.`,
      closing: `Gracias por confiar en nosotros para ser parte de tu celebración. Esperamos ayudarte a organizar tu próximo evento inolvidable.`,
      signature: `Gracias por tu confianza!`,
      team: `El equipo de konfetti.app`,
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
