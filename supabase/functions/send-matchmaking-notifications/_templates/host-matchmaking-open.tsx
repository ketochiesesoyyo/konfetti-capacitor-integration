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

interface HostMatchmakingOpenEmailProps {
  hostName: string;
  eventName: string;
  language: string;
  eventId: string;
}

export const HostMatchmakingOpenEmail = ({
  hostName,
  eventName,
  language,
  eventId,
}: HostMatchmakingOpenEmailProps) => {
  const content = {
    en: {
      preview: `Guests can now start matching for ${eventName}`,
      heading: `It's live! Guests can now start matching for ${eventName}`,
      greeting: `Hi ${hostName},`,
      p1: `The matchmaking for your event ${eventName} is now open!`,
      p2: `Your guests can now explore profiles, swipe, and start connecting before the big day.`,
      p3: `You can monitor engagement or check activity from your host dashboard on konfetti.app.`,
      closing: `Thanks again for hosting with us!`,
      team: `The konfetti.app team`,
      cta: 'View Dashboard',
    },
    es: {
      preview: `Los invitados ya pueden comenzar a hacer match en ${eventName}`,
      heading: `¡Ya está activo! Los invitados ya pueden comenzar a hacer match en ${eventName}`,
      greeting: `Hola ${hostName},`,
      p1: `¡El matchmaking para tu evento ${eventName} ya está abierto!`,
      p2: `Tus invitados ya pueden explorar perfiles, deslizar y comenzar a conectar antes del gran día.`,
      p3: `Puedes monitorear la participación o revisar la actividad desde tu panel de anfitrión en konfetti.app.`,
      closing: `Gracias nuevamente por confiar en nosotros,`,
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
          <Heading style={h1}>💫 {text.heading}</Heading>
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
