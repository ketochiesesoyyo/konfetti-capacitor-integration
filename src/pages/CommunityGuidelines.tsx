import { Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const CommunityGuidelines = () => {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <main className="flex-1 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Link 
            to="/landing" 
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToHome')}
          </Link>
          
          <div className="legal-hero">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Legal</span>
            </div>
            <h1>{isSpanish ? 'Directrices de la Comunidad' : 'Community Guidelines'}</h1>
            <p>{isSpanish ? 'Las reglas que mantienen a Konfetti seguro y acogedor para todos' : 'The rules that keep Konfetti safe and welcoming for everyone'}</p>
          </div>
          
          <div className="legal-content space-y-4">
            {isSpanish ? <SpanishGuidelines /> : <EnglishGuidelines />}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

function EnglishGuidelines() {
  return (
    <>
      <section>
        <p className="mb-2">
          Konfetti is a space to spark genuine connections around real celebrations. Whether you're attending a wedding, party, or special event, our mission is to make it easy for guests to connect in a kind, respectful, and authentic way — before, during, and after the event.
        </p>
        <p>
          To keep Konfetti safe and enjoyable for everyone, these Community Guidelines explain what content and conduct are acceptable — both on and off our platform. Every member of Konfetti is expected to uphold these values of respect, safety, and joy.
        </p>
      </section>

      <section>
        <h3>Profile Guidelines</h3>

        <h4 className="font-semibold mt-4 mb-2">Age</h4>
        <p>
          You must be at least 18 years old to join Konfetti. Creating a profile that misrepresents your age or pretending to be under 18 is not allowed. We may request identification to verify your age, and we will block underage users from the platform.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Profile Photos</h4>
        <p>
          We want Konfetti to reflect your authentic self — not filters or fakes. At least one of your photos must show your face clearly. We do not permit:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Photos that obscure or distort your face using heavy filters or effects.</li>
          <li>Logos, memes, or text-only images as your main photo.</li>
          <li>Photos featuring children alone or unclothed.</li>
          <li>Photos that are misleading or portray someone other than you.</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Name and Profile Information</h4>
        <p>
          You may use a first name, nickname, or shortened version of your name — but it must represent who you are in real life.
        </p>
        <p className="mt-2">We do not allow:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Names containing symbols, emojis, or numbers.</li>
          <li>Celebrity, brand, or fictional character names.</li>
          <li>Usernames containing offensive words, sexual references, or hate speech.</li>
          <li>Displaying your phone number, email, social media handles, or other contact details in your name field.</li>
        </ul>
      </section>

      <section>
        <h3>Content and Conduct Guidelines</h3>

        <h4 className="font-semibold mt-4 mb-2">Adult Nudity and Sexual Activity</h4>
        <p>
          Konfetti is about celebration, not sexual content. We don't allow nude, sexually explicit, or vulgar images or text. Any form of sexual solicitation, promotion of adult services, or exchange of sexual content — paid or unpaid — is prohibited.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Bullying and Abusive Conduct</h4>
        <p>
          Kindness is at the heart of every Konfetti connection. Harassment, intimidation, humiliation, or repeated unwanted contact are not tolerated.
        </p>
        <p className="mt-2">Examples include:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Insults or name-calling</li>
          <li>Unwanted comments about appearance or relationship status</li>
          <li>Emotional manipulation, threats, or blackmail</li>
          <li>Encouraging or celebrating violence</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Child Safety</h4>
        <p>
          We have zero tolerance for content that sexualizes or harms minors. This includes any imagery, drawings, or discussions that depict minors in a sexual context, even to raise awareness. Any report of child exploitation will result in immediate suspension and may be referred to authorities.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Commercial and Promotional Activity</h4>
        <p>
          Konfetti is not a marketplace or advertising platform. You may not use Konfetti to promote products, services, or other platforms unless you are an approved event partner or planner. Spamming guests with business links or promotions is not permitted.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Controlled Substances and Illegal Goods</h4>
        <p>
          Do not use Konfetti to promote, distribute, or discuss illegal substances or goods. This includes drug paraphernalia, misuse of prescription medication, or any illegal sales or distribution activity.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Terrorism and Violence</h4>
        <p>
          We do not allow any content that glorifies or supports terrorist or violent extremist groups, or that incites harm toward individuals, communities, or public events.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Identity-Based Hate</h4>
        <p>
          Konfetti is an inclusive space where every guest should feel welcome. We prohibit hate speech or conduct targeting individuals or groups based on:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Race or ethnicity</li>
          <li>National origin or immigration status</li>
          <li>Gender identity or expression</li>
          <li>Sexual orientation</li>
          <li>Disability or medical condition</li>
          <li>Religion or belief</li>
        </ul>
        <p className="mt-2">
          We will remove content or accounts that promote or condone hate, discrimination, or dehumanization.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Inauthentic Profiles</h4>
        <p>
          Konfetti is for real guests at real events. Do not impersonate others or misrepresent who you are. This includes:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Using fake names, photos, or occupations</li>
          <li>Creating multiple or duplicate accounts</li>
          <li>Pretending to be another guest, host, or planner</li>
          <li>Misleading others about your relationship status, gender, or location</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Misinformation</h4>
        <p>
          We do not allow false or misleading information that could harm others, spread panic, or disrupt events.
        </p>
        <p className="mt-2">This includes misinformation about:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Event safety or security</li>
          <li>Health or public safety measures</li>
          <li>Participants' identities or reputations</li>
          <li>Conspiracy-type or defamatory content</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Physical and Sexual Violence</h4>
        <p>
          Violence or unwanted physical contact has no place on Konfetti. We prohibit:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Threats of harm or assault</li>
          <li>Unwanted sexual contact</li>
          <li>Stalking or harassment at or after events</li>
          <li>Using Konfetti to plan or assist in any form of exploitation or human trafficking</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Scams, Fraud, and Theft</h4>
        <p>
          Scams destroy trust — and we don't tolerate them. You may not use Konfetti to deceive, solicit money, or misrepresent intentions. Examples include:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Pretending to be a wedding host or planner</li>
          <li>Asking for money or gifts under false pretenses</li>
          <li>Fake charity or fundraising scams</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Sexual Harassment</h4>
        <p>
          Consent and respect are non-negotiable. Sexual harassment includes any unwanted or non-consensual sexual comments, images, gestures, or advances — both online and at in-person events.
        </p>
        <p className="mt-2">We prohibit:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Sending unsolicited sexual messages or photos</li>
          <li>Sharing intimate images without consent</li>
          <li>Objectifying or fetishizing guests</li>
          <li>Making someone feel uncomfortable through persistent sexual attention</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Spam</h4>
        <p>
          To keep Konfetti genuine and fun, we don't allow:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Sending repetitive or irrelevant messages</li>
          <li>Promoting other apps, links, or social media repeatedly</li>
          <li>Creating multiple accounts to message guests or hosts</li>
          <li>Using bots, automation tools, or fake profiles</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Suicide, Self-Injury, and Mental Health</h4>
        <p>
          We care deeply about our guests' well-being. While it's okay to talk about emotional struggles respectfully, we prohibit content that promotes, glorifies, or encourages self-harm, disordered eating, or suicide.
        </p>
        <p className="mt-2">
          If you or someone you know is struggling, please reach out for help. We can connect you with mental health resources upon request.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Violent or Graphic Content</h4>
        <p>
          Konfetti celebrates joy and togetherness — not violence. We remove any imagery or descriptions involving:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Graphic injuries, blood, or weapons</li>
          <li>Violent or gory scenes</li>
          <li>Any depiction of violence, real or simulated, in profile photos or messages</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Platform Manipulation</h4>
        <p>
          To keep Konfetti safe and fair, we prohibit:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Automated or scripted behavior (e.g., bots or scraping tools)</li>
          <li>Artificially inflating engagement or interactions</li>
          <li>Circumventing bans or restrictions using VPNs or alternate accounts</li>
        </ul>
        <p className="mt-2">
          Accounts found to engage in manipulation will be removed permanently.
        </p>
      </section>

      <section>
        <h3>Safety and Reporting</h3>
        <p>
          Safety is central to the Konfetti experience. We use a mix of automated detection, community reports, and human moderation to keep the platform safe.
        </p>
        <p className="mt-2">
          If another guest's behavior makes you feel unsafe, use the Unmatch or Report feature immediately. Reports are confidential and reviewed by our moderation team.
        </p>
        <p className="mt-2">
          False reports or harassment through reporting are also violations of our Guidelines. Reporting someone solely for their gender identity, appearance, or other protected traits is not acceptable.
        </p>
      </section>

      <section>
        <h3>Enforcement Philosophy</h3>
        <p>
          Every member is responsible for keeping Konfetti a safe and welcoming space. If your behavior violates our Guidelines or values, we may:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Remove specific content</li>
          <li>Restrict or suspend features</li>
          <li>Permanently ban your account</li>
          <li>Notify event hosts or, in severe cases, law enforcement</li>
        </ul>
        <p className="mt-2">
          We may also take action for conduct outside Konfetti if it endangers or harms other members — whether at an event, through messaging apps, or elsewhere.
        </p>
        <p className="mt-2">
          If you believe your account was restricted or removed in error, you can appeal by contacting support at support@konfetti.app within 30 days.
        </p>
      </section>

      <section>
        <h3>Our Commitment</h3>
        <p>
          Konfetti exists to make real-life celebrations more meaningful. We believe in kindness, inclusivity, and consent — and we expect everyone in our community to help us uphold these values.
        </p>
        <p className="mt-2">
          If you have questions or feedback about these Guidelines, please reach out at hello@konfetti.app. Our team is always here to help.
        </p>
      </section>
    </>
  );
}

function SpanishGuidelines() {
  return (
    <>
      <section>
        <p className="mb-2">
          Konfetti es un espacio para crear conexiones genuinas alrededor de celebraciones reales. Ya sea que asistas a una boda, fiesta o evento especial, nuestra misión es facilitar que los invitados se conecten de manera amable, respetuosa y auténtica — antes, durante y después del evento.
        </p>
        <p>
          Para mantener Konfetti seguro y agradable para todos, estas Directrices de la Comunidad explican qué contenido y conducta son aceptables — tanto dentro como fuera de nuestra plataforma. Se espera que cada miembro de Konfetti mantenga estos valores de respeto, seguridad y alegría.
        </p>
      </section>

      <section>
        <h3>Directrices de Perfil</h3>

        <h4 className="font-semibold mt-4 mb-2">Edad</h4>
        <p>
          Debes tener al menos 18 años para unirte a Konfetti. No está permitido crear un perfil que tergiverse tu edad o hacerte pasar por menor de 18 años. Podemos solicitar identificación para verificar tu edad, y bloquearemos a usuarios menores de edad de la plataforma.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Fotos de Perfil</h4>
        <p>
          Queremos que Konfetti refleje tu yo auténtico — no filtros ni falsificaciones. Al menos una de tus fotos debe mostrar tu rostro claramente. No permitimos:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Fotos que oculten o distorsionen tu rostro usando filtros o efectos pesados.</li>
          <li>Logos, memes o imágenes de solo texto como tu foto principal.</li>
          <li>Fotos de niños solos o sin ropa.</li>
          <li>Fotos que sean engañosas o representen a alguien que no eres tú.</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Nombre e Información del Perfil</h4>
        <p>
          Puedes usar un nombre de pila, apodo o versión corta de tu nombre — pero debe representar quién eres en la vida real.
        </p>
        <p className="mt-2">No permitimos:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Nombres que contengan símbolos, emojis o números.</li>
          <li>Nombres de celebridades, marcas o personajes ficticios.</li>
          <li>Nombres de usuario que contengan palabras ofensivas, referencias sexuales o discurso de odio.</li>
          <li>Mostrar tu número de teléfono, correo electrónico, redes sociales u otros datos de contacto en tu campo de nombre.</li>
        </ul>
      </section>

      <section>
        <h3>Directrices de Contenido y Conducta</h3>

        <h4 className="font-semibold mt-4 mb-2">Desnudez Adulta y Actividad Sexual</h4>
        <p>
          Konfetti trata de celebración, no de contenido sexual. No permitimos imágenes o texto desnudo, sexualmente explícito o vulgar. Cualquier forma de solicitud sexual, promoción de servicios para adultos o intercambio de contenido sexual — pagado o no — está prohibido.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Acoso y Conducta Abusiva</h4>
        <p>
          La amabilidad está en el corazón de cada conexión de Konfetti. El acoso, la intimidación, la humillación o el contacto repetido no deseado no se toleran.
        </p>
        <p className="mt-2">Los ejemplos incluyen:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Insultos o apodos despectivos</li>
          <li>Comentarios no deseados sobre apariencia o estado de relación</li>
          <li>Manipulación emocional, amenazas o chantaje</li>
          <li>Fomentar o celebrar la violencia</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Seguridad Infantil</h4>
        <p>
          Tenemos tolerancia cero para el contenido que sexualiza o daña a menores. Esto incluye cualquier imagen, dibujo o discusión que represente a menores en un contexto sexual, incluso para crear conciencia. Cualquier reporte de explotación infantil resultará en suspensión inmediata y puede ser referido a las autoridades.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Actividad Comercial y Promocional</h4>
        <p>
          Konfetti no es un mercado ni una plataforma de publicidad. No puedes usar Konfetti para promocionar productos, servicios u otras plataformas a menos que seas un socio o planificador de eventos aprobado. No se permite enviar spam a los invitados con enlaces comerciales o promociones.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Sustancias Controladas y Bienes Ilegales</h4>
        <p>
          No uses Konfetti para promover, distribuir o discutir sustancias o bienes ilegales. Esto incluye parafernalia de drogas, mal uso de medicamentos recetados o cualquier actividad de venta o distribución ilegal.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Terrorismo y Violencia</h4>
        <p>
          No permitimos ningún contenido que glorifique o apoye a grupos terroristas o extremistas violentos, o que incite al daño hacia individuos, comunidades o eventos públicos.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Odio Basado en Identidad</h4>
        <p>
          Konfetti es un espacio inclusivo donde cada invitado debe sentirse bienvenido. Prohibimos el discurso de odio o conducta dirigida a individuos o grupos basándose en:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Raza o etnia</li>
          <li>Origen nacional o estatus migratorio</li>
          <li>Identidad o expresión de género</li>
          <li>Orientación sexual</li>
          <li>Discapacidad o condición médica</li>
          <li>Religión o creencia</li>
        </ul>
        <p className="mt-2">
          Eliminaremos contenido o cuentas que promuevan o toleren el odio, la discriminación o la deshumanización.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Perfiles No Auténticos</h4>
        <p>
          Konfetti es para invitados reales en eventos reales. No suplantes a otros ni tergiverses quién eres. Esto incluye:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Usar nombres, fotos u ocupaciones falsas</li>
          <li>Crear cuentas múltiples o duplicadas</li>
          <li>Hacerse pasar por otro invitado, anfitrión o planificador</li>
          <li>Engañar a otros sobre tu estado de relación, género o ubicación</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Desinformación</h4>
        <p>
          No permitimos información falsa o engañosa que pueda dañar a otros, sembrar pánico o interrumpir eventos.
        </p>
        <p className="mt-2">Esto incluye desinformación sobre:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Seguridad del evento</li>
          <li>Medidas de salud o seguridad pública</li>
          <li>Identidades o reputaciones de los participantes</li>
          <li>Contenido tipo conspiración o difamatorio</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Violencia Física y Sexual</h4>
        <p>
          La violencia o el contacto físico no deseado no tienen lugar en Konfetti. Prohibimos:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Amenazas de daño o agresión</li>
          <li>Contacto sexual no deseado</li>
          <li>Acoso o persecución en o después de eventos</li>
          <li>Usar Konfetti para planificar o asistir en cualquier forma de explotación o tráfico humano</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Estafas, Fraude y Robo</h4>
        <p>
          Las estafas destruyen la confianza — y no las toleramos. No puedes usar Konfetti para engañar, solicitar dinero o tergiversar intenciones. Los ejemplos incluyen:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Hacerse pasar por un anfitrión o planificador de bodas</li>
          <li>Pedir dinero o regalos bajo falsas pretensiones</li>
          <li>Estafas de caridad o recaudación de fondos falsas</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Acoso Sexual</h4>
        <p>
          El consentimiento y el respeto son innegociables. El acoso sexual incluye cualquier comentario, imagen, gesto o avance sexual no deseado o sin consentimiento — tanto en línea como en eventos presenciales.
        </p>
        <p className="mt-2">Prohibimos:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Enviar mensajes o fotos sexuales no solicitados</li>
          <li>Compartir imágenes íntimas sin consentimiento</li>
          <li>Objetivar o fetichizar a los invitados</li>
          <li>Hacer que alguien se sienta incómodo a través de atención sexual persistente</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Spam</h4>
        <p>
          Para mantener Konfetti genuino y divertido, no permitimos:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Enviar mensajes repetitivos o irrelevantes</li>
          <li>Promocionar otras apps, enlaces o redes sociales repetidamente</li>
          <li>Crear múltiples cuentas para enviar mensajes a invitados o anfitriones</li>
          <li>Usar bots, herramientas de automatización o perfiles falsos</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Suicidio, Autolesión y Salud Mental</h4>
        <p>
          Nos preocupamos profundamente por el bienestar de nuestros invitados. Si bien está bien hablar sobre luchas emocionales de manera respetuosa, prohibimos contenido que promueva, glorifique o fomente la autolesión, trastornos alimenticios o el suicidio.
        </p>
        <p className="mt-2">
          Si tú o alguien que conoces está luchando, por favor busca ayuda. Podemos conectarte con recursos de salud mental si lo solicitas.
        </p>

        <h4 className="font-semibold mt-4 mb-2">Contenido Violento o Gráfico</h4>
        <p>
          Konfetti celebra la alegría y la unión — no la violencia. Eliminamos cualquier imagen o descripción que involucre:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Lesiones gráficas, sangre o armas</li>
          <li>Escenas violentas o sangrientas</li>
          <li>Cualquier representación de violencia, real o simulada, en fotos de perfil o mensajes</li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Manipulación de la Plataforma</h4>
        <p>
          Para mantener Konfetti seguro y justo, prohibimos:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Comportamiento automatizado o con scripts (ej. bots o herramientas de scraping)</li>
          <li>Inflar artificialmente el engagement o las interacciones</li>
          <li>Evadir prohibiciones o restricciones usando VPNs o cuentas alternativas</li>
        </ul>
        <p className="mt-2">
          Las cuentas que se encuentren participando en manipulación serán eliminadas permanentemente.
        </p>
      </section>

      <section>
        <h3>Seguridad y Reportes</h3>
        <p>
          La seguridad es central para la experiencia Konfetti. Usamos una combinación de detección automatizada, reportes de la comunidad y moderación humana para mantener la plataforma segura.
        </p>
        <p className="mt-2">
          Si el comportamiento de otro invitado te hace sentir inseguro, usa la función Desmatchear o Reportar inmediatamente. Los reportes son confidenciales y revisados por nuestro equipo de moderación.
        </p>
        <p className="mt-2">
          Los reportes falsos o el acoso a través de reportes también son violaciones de nuestras Directrices. Reportar a alguien únicamente por su identidad de género, apariencia u otros rasgos protegidos no es aceptable.
        </p>
      </section>

      <section>
        <h3>Filosofía de Cumplimiento</h3>
        <p>
          Cada miembro es responsable de mantener Konfetti como un espacio seguro y acogedor. Si tu comportamiento viola nuestras Directrices o valores, podemos:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Eliminar contenido específico</li>
          <li>Restringir o suspender funciones</li>
          <li>Prohibir permanentemente tu cuenta</li>
          <li>Notificar a los anfitriones del evento o, en casos graves, a las autoridades</li>
        </ul>
        <p className="mt-2">
          También podemos tomar acción por conducta fuera de Konfetti si pone en peligro o daña a otros miembros — ya sea en un evento, a través de apps de mensajería o en otros lugares.
        </p>
        <p className="mt-2">
          Si crees que tu cuenta fue restringida o eliminada por error, puedes apelar contactando a soporte en support@konfetti.app dentro de 30 días.
        </p>
      </section>

      <section>
        <h3>Nuestro Compromiso</h3>
        <p>
          Konfetti existe para hacer las celebraciones de la vida real más significativas. Creemos en la amabilidad, la inclusión y el consentimiento — y esperamos que todos en nuestra comunidad nos ayuden a mantener estos valores.
        </p>
        <p className="mt-2">
          Si tienes preguntas o comentarios sobre estas Directrices, por favor escríbenos a hello@konfetti.app. Nuestro equipo siempre está aquí para ayudar.
        </p>
      </section>
    </>
  );
}

export default CommunityGuidelines;
