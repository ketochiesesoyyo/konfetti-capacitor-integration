import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const TermsConditions = () => {
  const { t } = useTranslation();

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
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Legal</span>
            </div>
            <h1>Terms and Conditions of Use</h1>
            <p>The rules and agreements that govern your use of Konfetti</p>
          </div>
          
          <div className="legal-content space-y-4">
            <TermsContent />
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

function TermsContent() {
  return (
    <>
      <section>
        <p className="mb-4">
          Welcome to Konfetti's Terms and Conditions of Use ("Terms").
        </p>
        <p className="mb-4">
          These Terms form a binding agreement between you ("you", "your", or the "user") and Konfetti ("Konfetti", "we", "us", or "our").
        </p>
        <p className="mb-4">
          Please read these Terms carefully before using our website or mobile application (collectively, the "App"). By accessing, viewing, downloading, or using Konfetti, you agree to be bound by these Terms, along with our Privacy Policy and Community Guidelines, which together form the entire agreement between you and Konfetti.
        </p>
        <p className="mb-4 font-semibold">
          If you do not agree to these Terms, please do not access or use Konfetti.
        </p>
      </section>

      <section>
        <h3>1. About Konfetti</h3>
        <p className="mb-2">
          Konfetti is a digital platform designed to help people attending weddings, social events, or private celebrations connect before, during, and after the event.
        </p>
        <p className="mb-2">
          Access is granted primarily through event invitations, QR codes, or host-generated links.
        </p>
        <p>
          Our mission is to create genuine, respectful, and safe social experiences around real-life events.
        </p>
      </section>

      <section>
        <h3>2. Eligibility and Account Creation</h3>
        <p className="mb-2">To use Konfetti, you must:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Be at least 18 years old (or the legal age of majority in your jurisdiction, if higher);</li>
          <li>Have the legal capacity to enter into a binding agreement; and</li>
          <li>Use Konfetti only for lawful and personal purposes.</li>
        </ul>
        <p className="mb-4">
          Konfetti may use verification systems to confirm your age or identity. We may suspend or delete accounts if we suspect false or misleading information.
        </p>
        
        <h4 className="font-semibold mb-2">Account Registration</h4>
        <p className="mb-2">
          You may create an account using your email address, phone number, or approved third-party login (such as Apple or Google). You agree to provide accurate and up-to-date information and to maintain the confidentiality of your credentials.
        </p>
        <p className="mb-4">
          You may not use another person's account or share your own account without authorization.
        </p>

        <h4 className="font-semibold mb-2">Termination or Suspension</h4>
        <p className="mb-2">Konfetti may, at any time and without prior notice, suspend or delete your account if:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>You violate these Terms or the Community Guidelines,</li>
          <li>Your behavior (online or offline) endangers other users, or</li>
          <li>You misuse or attempt to manipulate the platform.</li>
        </ul>
        <p className="mb-4">
          If your account is terminated for cause, you are not entitled to any form of credit or refund (where applicable).
        </p>

        <h4 className="font-semibold mb-2">Deletion</h4>
        <p className="mb-2">
          You may delete your account at any time under Settings → Delete Account.
        </p>
        <p>
          Deleted accounts may be permanently removed or anonymized after a defined period, according to our Privacy Policy.
        </p>
      </section>

      <section>
        <h3>3. Types of Content</h3>
        <p className="mb-2">On Konfetti, you will encounter three categories of content:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li><strong>Your Content:</strong> what you upload, share, or write (e.g., photos, messages, profile text);</li>
          <li><strong>Member Content:</strong> what other users post or share; and</li>
          <li><strong>Our Content:</strong> what Konfetti owns or provides (e.g., software, trademarks, branding, algorithms).</li>
        </ul>

        <h4 className="font-semibold mb-2">Your Content</h4>
        <p className="mb-2">You are solely responsible for Your Content and the consequences of sharing it. You must ensure that Your Content:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Complies with these Terms and our Community Guidelines;</li>
          <li>Does not infringe on any third-party rights (e.g., copyright, privacy, likeness); and</li>
          <li>Does not contain hate speech, nudity, threats, or illegal material.</li>
        </ul>
        <p className="mb-2">
          By posting content on Konfetti, you grant us a non-exclusive, royalty-free, worldwide licence to use, display, reproduce, modify, distribute, and adapt Your Content for the purpose of operating and improving the App.
        </p>
        <p className="mb-2">
          You retain ownership of your content, and this licence does not transfer that ownership.
        </p>
        <p className="mb-2">
          You may not post any personal contact information (email, phone, address) in your public profile or use the platform for solicitation or commercial purposes.
        </p>
        <p className="mb-4">
          Konfetti reserves the right to remove or restrict content that violates these Terms or our Guidelines.
        </p>

        <h4 className="font-semibold mb-2">Member Content</h4>
        <p className="mb-2">
          Other users' content belongs to them. You may not copy, reproduce, or use any Member Content outside Konfetti unless you have the user's explicit consent.
        </p>
        <p className="mb-4">
          If you encounter content that you believe violates these Terms, please use the in-app reporting feature or contact us at support@konfetti.app.
        </p>

        <h4 className="font-semibold mb-2">Our Content</h4>
        <p className="mb-2">
          All intellectual property appearing on Konfetti — including logos, graphics, databases, designs, algorithms, and user interface — is owned or licensed by Konfetti.
        </p>
        <p className="mb-2">You are granted a limited, personal, non-transferable, revocable licence to use Konfetti for lawful, personal use. You may not:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Copy, modify, distribute, or reverse engineer any part of Konfetti;</li>
          <li>Use automated tools to extract data; or</li>
          <li>Use Konfetti's name or materials for any commercial purpose without written permission.</li>
        </ul>
        <p>All rights not expressly granted remain reserved by Konfetti.</p>
      </section>

      <section>
        <h3>4. User Conduct and Restrictions</h3>
        <p className="mb-2">You agree to use Konfetti in a respectful, safe, and lawful manner.</p>
        <p className="mb-2">You must not:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Impersonate another person, host, or brand;</li>
          <li>Harass, stalk, or threaten others;</li>
          <li>Engage in scams, fraud, or manipulation;</li>
          <li>Post or transmit offensive, explicit, or harmful content;</li>
          <li>Use the App to advertise, sell, or solicit services;</li>
          <li>Interfere with Konfetti's systems, security, or data;</li>
          <li>Collect or scrape information about other users;</li>
          <li>Misuse the reporting or appeals system; or</li>
          <li>Create multiple accounts for malicious purposes.</li>
        </ul>
        <p className="mb-2">
          Konfetti reserves the right to remove, restrict, or report users engaging in any of the above conduct.
        </p>
        <p>
          You acknowledge that Konfetti is not responsible for user interactions, online or offline, and that you remain solely responsible for your conduct.
        </p>
      </section>

      <section>
        <h3>5. Safety and Community Integrity</h3>
        <p className="mb-2">
          Safety is central to the Konfetti experience. We use a combination of automated moderation and human review to protect users and maintain trust.
        </p>
        <p className="mb-2">
          We may investigate reports of misconduct, including—but not limited to—cases involving harassment, violence, or unlawful activity.
        </p>
        <p className="mb-4">If necessary, we may cooperate with event hosts or law enforcement.</p>
        <p className="mb-2">Konfetti reserves the right to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Warn, restrict, or suspend accounts;</li>
          <li>Remove or hide harmful content;</li>
          <li>Permanently ban users who violate our safety policies; and</li>
          <li>Notify event organizers or relevant authorities in cases of serious risk.</li>
        </ul>
        <p>
          If you believe we've made an error in a moderation decision, you may appeal within six (6) months via our in-app appeal process or by contacting appeals@konfetti.app.
        </p>
      </section>

      <section>
        <h3>6. Access and Service Terms</h3>
        <h4 className="font-semibold mb-2">Event Access</h4>
        <p className="mb-2">
          Konfetti operates on an invite-only basis. Access to certain features is granted to event hosts, planners, or organizers ("Hosts") upon request and approval.
        </p>
        <p className="mb-4">
          Hosts may contact Konfetti directly to discuss service options and event setup. No payments are processed through this app.
        </p>

        <h4 className="font-semibold mb-2">Service Activation</h4>
        <p className="mb-4">
          Upon approval, Hosts receive access credentials to create and manage their event, including guest invitations, matchmaking features, and in-app interaction tools.
        </p>

        <h4 className="font-semibold mb-2">Service Period</h4>
        <p className="mb-2">Each event activation provides access to Konfetti's features for a defined period surrounding the event. The Host acknowledges that:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Access is granted for the specified event and time period;</li>
          <li>Konfetti's services are considered rendered upon activation; and</li>
          <li>Access terms are established directly with Konfetti prior to event activation.</li>
        </ul>

        <h4 className="font-semibold mb-2">Contact</h4>
        <p className="mb-4">
          To request access or inquire about hosting an event, please contact us at support@konfetti.app.
        </p>
      </section>

      <section>
        <h3>7. Virtual Features and Experimental Tools</h3>
        <p className="mb-2">Konfetti may, from time to time, offer features such as:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Badges, event themes, or digital collectibles ("Virtual Items"); or</li>
          <li>Access to early matchmaking features, event tools, or visual effects.</li>
        </ul>
        <p className="mb-2">All such items:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Are non-transferable, non-refundable, and have no cash value; and</li>
          <li>May be modified, discontinued, or revoked by Konfetti at any time.</li>
        </ul>
        <p>You agree not to sell, trade, or exchange Virtual Items outside the platform.</p>
      </section>

      <section>
        <h3>8. Notifications and Communications</h3>
        <p className="mb-2">By creating an account, you agree that Konfetti may send you:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Service notifications (e.g., event reminders, match updates);</li>
          <li>Administrative communications (e.g., policy changes); and</li>
          <li>Optional marketing or feedback messages.</li>
        </ul>
        <p className="mb-2">
          You may opt out of marketing communications at any time through your device or account settings, or by following the unsubscribe link in any email.
        </p>
        <p>
          For important transactional and safety communications, opt-out may not be available.
        </p>
      </section>

      <section>
        <h3>9. Location-Based Features</h3>
        <p className="mb-2">Konfetti may use GPS, Wi-Fi, Bluetooth, or similar technology to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Verify your presence at an event,</li>
          <li>Display relevant profiles or features, or</li>
          <li>Support safety measures (e.g., reporting proximity).</li>
        </ul>
        <p className="mb-2">
          You may disable location services, but some features may not function without them.
        </p>
        <p>Your location data is handled according to our Privacy Policy.</p>
      </section>

      <section>
        <h3>10. Disclaimers</h3>
        <p className="mb-2">
          Konfetti, its content, and its services are provided "as is" and "as available," without warranties of any kind, whether express or implied.
        </p>
        <p className="mb-2">We do not guarantee:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>That the App will be error-free, secure, or uninterrupted;</li>
          <li>That matches or interactions will lead to desired outcomes; or</li>
          <li>The identity, conduct, or intentions of other users.</li>
        </ul>
        <p>
          To the fullest extent permitted by law, Konfetti disclaims all implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>
      </section>

      <section>
        <h3>11. Limitation of Liability</h3>
        <p className="mb-2">To the maximum extent permitted by law, Konfetti, its directors, employees, partners, or affiliates shall not be liable for:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Indirect, incidental, consequential, punitive, or special damages;</li>
          <li>Loss of data, revenue, or goodwill; or</li>
          <li>Any damages arising from your use of or reliance on the App or its users.</li>
        </ul>
        <p className="mb-2">
          In no event shall Konfetti's total liability exceed MXN $2,000 (two thousand pesos) or the equivalent of fees paid by you (if any) during the preceding 12 months, whichever is greater.
        </p>
        <p>
          Some jurisdictions do not allow certain exclusions or limitations, so some of the above may not apply to you.
        </p>
      </section>

      <section>
        <h3>12. Indemnification</h3>
        <p className="mb-2">You agree to indemnify, defend, and hold harmless Konfetti, its affiliates, employees, and partners from any claims, losses, damages, liabilities, costs, or expenses (including legal fees) arising out of:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Your use of Konfetti;</li>
          <li>Your content;</li>
          <li>Your breach of these Terms or applicable laws; or</li>
          <li>Your violation of another person's rights.</li>
        </ul>
        <p>Konfetti retains the right to assume control of any matter subject to indemnification.</p>
      </section>

      <section>
        <h3>13. Copyright and Intellectual Property Claims</h3>
        <p className="mb-2">
          If you believe that any content on Konfetti infringes your intellectual property rights, please send a written notice to:
        </p>
        <p className="mb-4">
          <strong>Email:</strong> legal@konfetti.app
        </p>
        <p className="mb-2">Your notice must include:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>A description of the copyrighted work or trademark;</li>
          <li>Identification of the infringing content;</li>
          <li>Your contact information;</li>
          <li>A statement that you have a good faith belief that the use is unauthorized; and</li>
          <li>A declaration that the information is accurate and that you are authorized to act on behalf of the rights holder.</li>
        </ul>
        <p>
          Konfetti may remove or disable access to allegedly infringing content in accordance with applicable laws.
        </p>
      </section>

      <section>
        <h3>14. Governing Law and Dispute Resolution</h3>
        <p className="mb-2">
          These Terms are governed by the laws of Mexico, without regard to conflict of law principles.
        </p>
        <p className="mb-4">
          Any dispute arising out of or relating to these Terms shall be submitted to the exclusive jurisdiction of the courts of Mexico City.
        </p>
        <p>
          You agree that any claim must be filed within one (1) year after the cause of action arises, or be permanently barred.
        </p>
      </section>

      <section>
        <h3>15. Changes to These Terms</h3>
        <p className="mb-2">
          Konfetti may update these Terms at any time. Significant changes will be communicated through the App, email, or other reasonable means.
        </p>
        <p>
          Your continued use of Konfetti after changes become effective constitutes your acceptance of the new Terms.
        </p>
      </section>

      <section>
        <h3>16. Severability and Waiver</h3>
        <p className="mb-2">
          If any provision of these Terms is found invalid or unenforceable, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full effect.
        </p>
        <p>
          Our failure to enforce any provision does not waive our right to do so in the future.
        </p>
      </section>

      <section>
        <h3>17. Entire Agreement</h3>
        <p>
          These Terms, together with our Privacy Policy and Community Guidelines, constitute the entire agreement between you and Konfetti. They supersede all prior agreements, representations, or understandings.
        </p>
      </section>

      <section>
        <h3>18. Contact Us</h3>
        <p className="mb-2">For questions, concerns, or feedback, contact us at:</p>
        <ul className="list-none mb-4 space-y-1">
          <li><strong>Email:</strong> support@konfetti.app</li>
          <li><strong>Legal Inquiries:</strong> legal@konfetti.app</li>
        </ul>
        <p>
          <strong>Entity:</strong><br />
          Konfetti<br />
          Mexico
        </p>
      </section>

      <section className="!bg-transparent !border-0 !shadow-none !p-0">
        <p className="text-xs text-muted-foreground">
          Last Updated: January 2025
        </p>
      </section>
    </>
  );
}

export default TermsConditions;
