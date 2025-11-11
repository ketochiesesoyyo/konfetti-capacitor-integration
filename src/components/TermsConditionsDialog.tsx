import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsConditionsDialog({ open, onOpenChange }: TermsConditionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Konfetti Terms and Conditions of Use</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 overflow-auto">
          <div className="space-y-6 text-sm">
            <section>
              <p className="mb-4">
                Welcome to Konfetti's Terms and Conditions of Use ("Terms").
              </p>
              <p className="mb-4">
                These Terms form a binding agreement between you ("you", "your", or the "user") and Konfetti SAPI de C.V. ("Konfetti", "we", "us", or "our").
              </p>
              <p className="mb-4">
                Please read these Terms carefully before using our website or mobile application (collectively, the "App"). By accessing, viewing, downloading, or using Konfetti, you agree to be bound by these Terms, along with our Privacy Policy and Community Guidelines, which together form the entire agreement between you and Konfetti.
              </p>
              <p className="mb-4 font-semibold">
                If you do not agree to these Terms, please do not access or use Konfetti.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">1. ABOUT KONFETTI</h3>
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
              <h3 className="font-semibold text-base mb-2">2. ELIGIBILITY AND ACCOUNT CREATION</h3>
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
              <h3 className="font-semibold text-base mb-2">3. TYPES OF CONTENT</h3>
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
                All intellectual property appearing on Konfetti — including logos, graphics, databases, designs, algorithms, and user interface — is owned or licensed by Konfetti SAPI de C.V.
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
              <h3 className="font-semibold text-base mb-2">4. USER CONDUCT AND RESTRICTIONS</h3>
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
              <h3 className="font-semibold text-base mb-2">5. SAFETY AND COMMUNITY INTEGRITY</h3>
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
              <h3 className="font-semibold text-base mb-2">6. PAYMENT TERMS</h3>
              <h4 className="font-semibold mb-2">One-Time Event Activation Fee</h4>
              <p className="mb-2">
                Certain features of Konfetti are accessible only after a one-time activation payment made by the event host, planner, or organizer ("Host").
              </p>
              <p className="mb-4">
                This payment grants access to event-related digital tools such as guest invitations, matchmaking, and in-app interaction features for a defined period surrounding the event.
              </p>

              <h4 className="font-semibold mb-2">No Recurring Charges</h4>
              <p className="mb-4">
                Konfetti does not operate on a recurring subscription basis. Each event activation is a separate and independent service.
              </p>

              <h4 className="font-semibold mb-2">Final and Non-Refundable</h4>
              <p className="mb-2">All payments are final and non-refundable.</p>
              <p className="mb-2">The Host acknowledges and agrees that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>The fee covers access to Konfetti's event platform and digital matchmaking environment;</li>
                <li>Konfetti's services are considered fully rendered upon activation, even if the event is cancelled, postponed, or modified; and</li>
                <li>Refunds or credits will not be issued for partial use, unused invitations, or cancelled events.</li>
              </ul>

              <h4 className="font-semibold mb-2">Payment Confirmation</h4>
              <p className="mb-2">
                Upon successful payment, the Host receives a confirmation and access credentials to create and manage their event.
              </p>
              <p className="mb-4">
                If payment cannot be processed or verified, access to paid features will not be granted.
              </p>

              <h4 className="font-semibold mb-2">Taxes</h4>
              <p className="mb-2">
                All prices shown are inclusive of applicable Mexican taxes (IVA) unless otherwise stated.
              </p>
              <p>
                Konfetti may issue electronic invoices (CFDI) upon request and in compliance with Mexican tax law.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. VIRTUAL FEATURES AND EXPERIMENTAL TOOLS</h3>
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
              <h3 className="font-semibold text-base mb-2">8. NOTIFICATIONS AND COMMUNICATIONS</h3>
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
              <h3 className="font-semibold text-base mb-2">9. LOCATION-BASED FEATURES</h3>
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
              <h3 className="font-semibold text-base mb-2">10. DISCLAIMERS</h3>
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
              <h3 className="font-semibold text-base mb-2">11. LIMITATION OF LIABILITY</h3>
              <p className="mb-2">To the maximum extent permitted by law, Konfetti SAPI de C.V., its directors, employees, partners, or affiliates shall not be liable for:</p>
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
              <h3 className="font-semibold text-base mb-2">12. INDEMNIFICATION</h3>
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
              <h3 className="font-semibold text-base mb-2">13. COPYRIGHT AND INTELLECTUAL PROPERTY CLAIMS</h3>
              <p className="mb-2">
                If you believe that any content on Konfetti infringes your intellectual property rights, please send a written notice to:
              </p>
              <div className="ml-4 mb-4">
                <p className="font-semibold">Legal Department – Konfetti SAPI de C.V.</p>
                <p>Email: legal@konfetti.app</p>
                <p>Address: Mexico City, Mexico</p>
              </div>
              <p className="mb-2">Your notice should include:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>A description of the copyrighted work;</li>
                <li>Identification of the infringing material;</li>
                <li>Your contact information;</li>
                <li>A statement of good-faith belief that the use is unauthorized; and</li>
                <li>A statement under penalty of perjury that your claim is accurate.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">14. DISPUTE RESOLUTION AND GOVERNING LAW</h3>
              <p className="mb-2">
                These Terms shall be governed by and interpreted in accordance with the laws of Mexico, without regard to its conflict of law provisions.
              </p>
              <p className="mb-2">In the event of any dispute arising out of or relating to these Terms or your use of Konfetti:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Both parties agree to first attempt an informal resolution by contacting legal@konfetti.app.</li>
                <li>If the dispute cannot be resolved within sixty (60) days, it shall be submitted to binding arbitration in Mexico City in accordance with applicable Mexican arbitration law.</li>
                <li>The arbitration shall be conducted in Spanish, and the decision shall be final and binding.</li>
              </ul>
              <p>
                Users waive any right to participate in class actions or collective proceedings unless prohibited by applicable law.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">15. TERMINATION</h3>
              <p className="mb-2">
                You may terminate your account at any time by following the steps in your settings.
              </p>
              <p className="mb-2">Konfetti may terminate or suspend your access immediately and without notice if:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>You breach these Terms or Community Guidelines;</li>
                <li>You misuse the platform; or</li>
                <li>Your conduct threatens other users or Konfetti's reputation.</li>
              </ul>
              <p className="mb-2">Upon termination:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Your access to the App ceases; and</li>
                <li>Relevant provisions of these Terms (e.g., IP, liability, indemnity, dispute resolution) shall survive.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">16. CHANGES TO THESE TERMS</h3>
              <p className="mb-2">
                Konfetti may update these Terms from time to time to reflect operational, legal, or security changes.
              </p>
              <p className="mb-2">
                Updated versions will be posted on the App or website with a "Last Updated" date.
              </p>
              <p className="mb-2">
                If significant changes occur, we may notify you via email or app notification.
              </p>
              <p>
                Your continued use of Konfetti after changes become effective constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">17. MISCELLANEOUS</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Entire Agreement:</strong> These Terms, along with the Privacy Policy and Community Guidelines, represent the entire agreement between you and Konfetti.</li>
                <li><strong>Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect.</li>
                <li><strong>No Waiver:</strong> Failure to enforce any provision does not waive Konfetti's right to do so later.</li>
                <li><strong>Assignment:</strong> You may not assign your rights under these Terms. Konfetti may assign them to its affiliates or successors.</li>
                <li><strong>Language:</strong> These Terms may be translated, but the Spanish version shall prevail in the event of conflict.</li>
                <li><strong>Contact:</strong> For any questions, complaints, or legal notices, contact: support@konfetti.app | Mexico City, Mexico.</li>
              </ul>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="font-semibold">Last Updated: November 2025</p>
              <p>Entity: Konfetti SAPI de C.V.</p>
              <p>Jurisdiction: Mexico City, Mexico</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
