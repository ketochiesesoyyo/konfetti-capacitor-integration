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

interface Guest24hBeforeOpenEmailProps {
  guestName: string;
  eventName: string;
  hostName: string;
  language: string;
  eventId: string;
}

export const Guest24hBeforeOpenEmail = ({
  guestName,
  eventName,
  hostName,
  language,
  eventId,
}: Guest24hBeforeOpenEmailProps) => {
  const content = {
    en: {
      preview: `24 hours left! Your ${eventName} matchmaking opens soon`,
      heading: `24 hours left! Your ${eventName} matchmaking opens soon on konfetti.app`,
      greeting: `Hi ${guestName},`,
      p1: `The wait is almost over — matchmaking for ${eventName} opens in just 24 hours!`,
      p2: `Get ready to meet other amazing guests and start connecting.`,
      p3: `When the time comes, simply log in to konfetti.app to join the fun.`,
      closing: `See you soon,`,
      signature: `${hostName} & konfetti.app`,
      cta: 'Go to konfetti.app',
    },
    es: {
      preview: `¡Faltan 24 horas! Tu matchmaking de ${eventName} abre pronto`,
      heading: `¡Faltan 24 horas! Tu matchmaking de ${eventName} abre pronto en konfetti.app`,
      greeting: `Hola ${guestName},`,
      p1: `¡Ya casi es hora! El matchmaking para ${eventName} abrirá en solo 24 horas.`,
      p2: `Prepárate para conocer a otros invitados increíbles y comenzar a conectar.`,
      p3: `Cuando llegue el momento, solo entra a konfetti.app para unirte a la diversión.`,
      closing: `Nos vemos pronto,`,
      signature: `${hostName} y konfetti.app`,
      cta: 'Ir a konfetti.app',
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
