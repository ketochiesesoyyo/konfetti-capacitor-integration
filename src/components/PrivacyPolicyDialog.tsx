import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Konfetti Privacy Policy</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 overflow-auto">
          <div className="space-y-6 text-sm">
            <section>
              <p className="mb-4">
                <strong>Effective Date:</strong> January 2025
              </p>
              <p className="mb-4">
                Konfetti SAPI de C.V. ("Konfetti", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "App").
              </p>
              <p className="mb-4">
                By using Konfetti, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">1. INFORMATION WE COLLECT</h3>
              
              <h4 className="font-semibold mb-2">Personal Information You Provide</h4>
              <p className="mb-2">When you create an account and use Konfetti, we collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Profile Information:</strong> Age, gender, bio, interests, photos, and prompt responses</li>
                <li><strong>Optional Information:</strong> Instagram username</li>
                <li><strong>Preferences:</strong> Age range preferences, gender preferences</li>
              </ul>

              <h4 className="font-semibold mb-2">Information Collected Automatically</h4>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Device Information:</strong> Device tokens for push notifications, device type, operating system</li>
                <li><strong>Usage Data:</strong> App interactions, features used, timestamps</li>
                <li><strong>Event Participation:</strong> Events you join, matches made, messages sent</li>
              </ul>

              <h4 className="font-semibold mb-2">Location Information</h4>
              <p className="mb-4">
                We may collect location data only when necessary to verify event attendance. You can disable location services in your device settings, though some features may be limited.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. HOW WE USE YOUR INFORMATION</h3>
              <p className="mb-2">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Create and manage your account</li>
                <li>Display your profile to other event attendees</li>
                <li>Enable matchmaking features and facilitate connections</li>
                <li>Send push notifications about matches, messages, and event updates</li>
                <li>Send email notifications (when enabled in your preferences)</li>
                <li>Improve and personalize your experience</li>
                <li>Ensure safety and enforce our Community Guidelines</li>
                <li>Respond to support requests</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. HOW WE SHARE YOUR INFORMATION</h3>
              <p className="mb-2 font-semibold">We do NOT sell your personal data.</p>
              <p className="mb-2">We may share your information with:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Other Event Attendees:</strong> Your profile information is visible to other guests at events you join. This includes your name, age, photos, bio, interests, and prompt responses.</li>
                <li><strong>Event Hosts:</strong> Event creators can see basic attendee information for event management purposes.</li>
                <li><strong>Service Providers:</strong> We use third-party services for:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Email delivery (Resend)</li>
                    <li>File storage (for photos)</li>
                    <li>Push notifications (Apple Push Notification service)</li>
                    <li>Authentication services</li>
                  </ul>
                </li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect the safety of our users.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. DATA RETENTION</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Active Accounts:</strong> Your data is stored while your account is active.</li>
                <li><strong>Account Deletion:</strong> When you delete your account, we remove your personal data within 30 days. Some anonymized data may be retained for safety and analytics purposes.</li>
                <li><strong>Event Data:</strong> Event participation data may be retained for the duration of the event plus a reasonable period for dispute resolution.</li>
                <li><strong>Legal Holds:</strong> Data may be retained longer if required for legal proceedings or regulatory compliance.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. YOUR RIGHTS (GDPR & CCPA)</h3>
              <p className="mb-2">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Restriction:</strong> Request limited processing of your data</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, contact us at <strong>privacy@konfetti.app</strong>
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. DATA SECURITY</h3>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security assessments</li>
                <li>Access controls and employee training</li>
              </ul>
              <p className="mb-4">
                However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. COOKIES AND TRACKING</h3>
              <p className="mb-4">
                We use minimal cookies and similar technologies for session management and authentication. We do not use third-party advertising cookies or extensive tracking technologies.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. CHILDREN'S PRIVACY</h3>
              <p className="mb-4">
                Konfetti is intended for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected data from a minor, we will take steps to delete that information promptly.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. INTERNATIONAL DATA TRANSFERS</h3>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. CHANGES TO THIS POLICY</h3>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Effective Date" above. Your continued use of Konfetti after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. CONTACT US</h3>
              <p className="mb-2">For privacy-related inquiries or to exercise your rights, contact us at:</p>
              <ul className="list-none mb-4 space-y-1">
                <li><strong>Email:</strong> privacy@konfetti.app</li>
                <li><strong>General Support:</strong> support@konfetti.app</li>
              </ul>
              <p className="mb-4">
                <strong>Data Controller:</strong><br />
                Konfetti SAPI de C.V.<br />
                Mexico
              </p>
            </section>

            <section className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Last Updated: January 2025
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
