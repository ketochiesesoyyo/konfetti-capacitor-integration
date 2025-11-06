import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommunityGuidelinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommunityGuidelinesDialog = ({
  open,
  onOpenChange,
}: CommunityGuidelinesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Konfetti Community Guidelines
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              Konfetti is a space to spark genuine connections around real celebrations. Whether you're attending a wedding, party, or special event, our mission is to make it easy for guests to connect in a kind, respectful, and authentic way — before, during, and after the event.
            </p>
            <p>
              To keep Konfetti safe and enjoyable for everyone, these Community Guidelines explain what content and conduct are acceptable — both on and off our platform. Every member of Konfetti is expected to uphold these values of respect, safety, and joy.
            </p>

            <div>
              <h2 className="text-xl font-semibold mt-6 mb-3">Profile Guidelines</h2>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Age</h3>
              <p>
                You must be at least 18 years old to join Konfetti. Creating a profile that misrepresents your age or pretending to be under 18 is not allowed. We may request identification to verify your age, and we will block underage users from the platform.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Profile Photos</h3>
              <p>
                We want Konfetti to reflect your authentic self — not filters or fakes. At least one of your photos must show your face clearly. We do not permit:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Photos that obscure or distort your face using heavy filters or effects.</li>
                <li>Logos, memes, or text-only images as your main photo.</li>
                <li>Photos featuring children alone or unclothed.</li>
                <li>Photos that are misleading or portray someone other than you.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Name and Profile Information</h3>
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
            </div>

            <div>
              <h2 className="text-xl font-semibold mt-6 mb-3">Content and Conduct Guidelines</h2>

              <h3 className="text-lg font-semibold mt-4 mb-2">Adult Nudity and Sexual Activity</h3>
              <p>
                Konfetti is about celebration, not sexual content. We don't allow nude, sexually explicit, or vulgar images or text. Any form of sexual solicitation, promotion of adult services, or exchange of sexual content — paid or unpaid — is prohibited.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Bullying and Abusive Conduct</h3>
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

              <h3 className="text-lg font-semibold mt-4 mb-2">Child Safety</h3>
              <p>
                We have zero tolerance for content that sexualizes or harms minors. This includes any imagery, drawings, or discussions that depict minors in a sexual context, even to raise awareness. Any report of child exploitation will result in immediate suspension and may be referred to authorities.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Commercial and Promotional Activity</h3>
              <p>
                Konfetti is not a marketplace or advertising platform. You may not use Konfetti to promote products, services, or other platforms unless you are an approved event partner or planner. Spamming guests with business links or promotions is not permitted.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Controlled Substances and Illegal Goods</h3>
              <p>
                Do not use Konfetti to promote, distribute, or discuss illegal substances or goods. This includes drug paraphernalia, misuse of prescription medication, or any illegal sales or distribution activity.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Terrorism and Violence</h3>
              <p>
                We do not allow any content that glorifies or supports terrorist or violent extremist groups, or that incites harm toward individuals, communities, or public events.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Identity-Based Hate</h3>
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

              <h3 className="text-lg font-semibold mt-4 mb-2">Inauthentic Profiles</h3>
              <p>
                Konfetti is for real guests at real events. Do not impersonate others or misrepresent who you are. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Using fake names, photos, or occupations</li>
                <li>Creating multiple or duplicate accounts</li>
                <li>Pretending to be another guest, host, or planner</li>
                <li>Misleading others about your relationship status, gender, or location</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Misinformation</h3>
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

              <h3 className="text-lg font-semibold mt-4 mb-2">Physical and Sexual Violence</h3>
              <p>
                Violence or unwanted physical contact has no place on Konfetti. We prohibit:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Threats of harm or assault</li>
                <li>Unwanted sexual contact</li>
                <li>Stalking or harassment at or after events</li>
                <li>Using Konfetti to plan or assist in any form of exploitation or human trafficking</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Scams, Fraud, and Theft</h3>
              <p>
                Scams destroy trust — and we don't tolerate them. You may not use Konfetti to deceive, solicit money, or misrepresent intentions. Examples include:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Pretending to be a wedding host or planner</li>
                <li>Asking for money or gifts under false pretenses</li>
                <li>Fake charity or fundraising scams</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Sexual Harassment</h3>
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

              <h3 className="text-lg font-semibold mt-4 mb-2">Spam</h3>
              <p>
                To keep Konfetti genuine and fun, we don't allow:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Sending repetitive or irrelevant messages</li>
                <li>Promoting other apps, links, or social media repeatedly</li>
                <li>Creating multiple accounts to message guests or hosts</li>
                <li>Using bots, automation tools, or fake profiles</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Suicide, Self-Injury, and Mental Health</h3>
              <p>
                We care deeply about our guests' well-being. While it's okay to talk about emotional struggles respectfully, we prohibit content that promotes, glorifies, or encourages self-harm, disordered eating, or suicide.
              </p>
              <p className="mt-2">
                If you or someone you know is struggling, please reach out for help. We can connect you with mental health resources upon request.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Violent or Graphic Content</h3>
              <p>
                Konfetti celebrates joy and togetherness — not violence. We remove any imagery or descriptions involving:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Graphic injuries, blood, or weapons</li>
                <li>Violent or gory scenes</li>
                <li>Any depiction of violence, real or simulated, in profile photos or messages</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Platform Manipulation</h3>
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
            </div>

            <div>
              <h2 className="text-xl font-semibold mt-6 mb-3">Safety and Reporting</h2>
              <p>
                Safety is central to the Konfetti experience. We use a mix of automated detection, community reports, and human moderation to keep the platform safe.
              </p>
              <p className="mt-2">
                If another guest's behavior makes you feel unsafe, use the Unmatch or Report feature immediately. Reports are confidential and reviewed by our moderation team.
              </p>
              <p className="mt-2">
                False reports or harassment through reporting are also violations of our Guidelines. Reporting someone solely for their gender identity, appearance, or other protected traits is not acceptable.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mt-6 mb-3">Enforcement Philosophy</h2>
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
            </div>

            <div>
              <h2 className="text-xl font-semibold mt-6 mb-3">Our Commitment</h2>
              <p>
                Konfetti exists to make real-life celebrations more meaningful. We believe in kindness, inclusivity, and consent — and we expect everyone in our community to help us uphold these values.
              </p>
              <p className="mt-2">
                If you have questions or feedback about these Guidelines, please reach out at hello@konfetti.app. Our team is always here to help.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
