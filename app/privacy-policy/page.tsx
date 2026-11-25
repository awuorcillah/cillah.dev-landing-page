"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#1C1C1C] text-[#F9F7F6]">
        {/* HERO SECTION */}
        <section className="relative pt-44 pb-20 overflow-hidden flex flex-col items-center justify-center">
          <div className="container mx-auto max-w-4xl px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="font-heading font-light text-[36px] md:text-[52px] leading-tight text-[#F9F7F6] mb-4">
                Privacy Policy
              </h1>
              <p className="text-sm text-[#F9F7F6]/40 uppercase tracking-widest font-sans font-medium">
                Last Updated: November 2026 &bull; Cillah AI Automation
              </p>
            </motion.div>
          </div>
        </section>

        {/* POLICY CONTENT */}
        <section className="pb-32 bg-[#1C1C1C]">
          <div className="container mx-auto max-w-3xl px-6">
            <div className="prose prose-invert max-w-none space-y-12 font-sans font-light text-[17px] leading-relaxed text-[#F9F7F6]/70">
              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  1. Information We Collect
                </h2>
                <p>
                  Cillah AI Automation (&ldquo;Cillah&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) provides a multi-tenant SaaS
                  business operating system for CRM, lead automation, and omnichannel marketing. We collect
                  account registration information (name, email address, phone number, organization name),
                  uploaded marketing media and documents, CRM lead records submitted via forms or messaging
                  channels, and OAuth 2.0 credentials when authorized users explicitly connect third-party
                  social media or productivity accounts.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  2. Connected Social Media &amp; Third-Party OAuth Accounts
                </h2>
                <p className="mb-4">
                  Authorized team members within a Cillah client organization may voluntarily connect their
                  organization&apos;s third-party accounts through official OAuth 2.0 consent screens, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[#F9F7F6]">Meta (Facebook Pages &amp; Instagram Business/Creator):</strong>{" "}
                    Used strictly to list pages/accounts you manage, publish posts/media/Reels you author or
                    schedule, and display campaign performance insights inside your organization&apos;s workspace.
                  </li>
                  <li>
                    <strong className="text-[#F9F7F6]">YouTube &amp; Google Services (Google Calendar, YouTube Data &amp; Analytics API):</strong>{" "}
                    Used strictly to upload videos/Shorts you submit, display channel performance analytics,
                    and manage consultation scheduling. Cillah&apos;s use and transfer of information received
                    from Google APIs adheres to the{" "}
                    <a
                      href="https://developers.google.com/terms/api-services-user-data-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C9A66B] hover:underline"
                    >
                      Google API Services User Data Policy
                    </a>
                    , including the Limited Use requirements.
                  </li>
                  <li>
                    <strong className="text-[#F9F7F6]">LinkedIn:</strong> Used strictly to publish posts and
                    share links you explicitly submit on your authorized LinkedIn profile or organization page.
                  </li>
                  <li>
                    <strong className="text-[#F9F7F6]">TikTok (Content Posting API):</strong> Used strictly to
                    upload videos you explicitly submit to your TikTok drafts/inbox or feed.
                  </li>
                  <li>
                    <strong className="text-[#F9F7F6]">WhatsApp Business:</strong> Used strictly for lead
                    notifications, client messaging workflows, and status sharing configured by your organization.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  3. Data Security &amp; Multi-Tenant Isolation
                </h2>
                <p>
                  All OAuth access tokens and refresh tokens are encrypted at rest using AES-256-GCM encryption
                  and isolated per organization using PostgreSQL Row Level Security (RLS). We never sell, rent,
                  or share your social account data, tokens, or audience insights with third-party advertisers,
                  and we never post to any connected channel without explicit action or scheduling by an
                  authorized user in your organization.
                </p>
              </div>

              <div id="data-deletion" className="scroll-mt-32">
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  4. Revoking Access &amp; Data Deletion Instructions
                </h2>
                <p className="mb-4">
                  You remain in full control of your connected accounts and stored data at all times:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[#F9F7F6]">Instant In-App Disconnect:</strong> Open{" "}
                    <em>Marketing → Connected Accounts</em> in your Cillah dashboard and click{" "}
                    <strong>Disconnect</strong> on any connected Instagram, Facebook, LinkedIn, YouTube,
                    TikTok, or WhatsApp account. Your encrypted OAuth tokens are permanently deleted immediately.
                  </li>
                  <li>
                    <strong className="text-[#F9F7F6]">Provider-Side Revocation:</strong> You may revoke
                    Cillah&apos;s permissions at any time in your Facebook Business Integrations, Google Account
                    Security Permissions, LinkedIn Permitted Services, or TikTok App Permissions settings.
                  </li>
                  <li>
                    <strong className="text-[#F9F7F6]">Full Account &amp; Data Deletion Request:</strong> Email{" "}
                    <a href="mailto:atulah@cillah.dev" className="text-[#C9A66B] hover:underline">
                      atulah@cillah.dev
                    </a>{" "}
                    with the subject <em>&ldquo;Data Deletion Request&rdquo;</em> and your registered account email.
                    We permanently erase all associated account data, media uploads, and tokens within 48 hours.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  5. Infrastructure &amp; Sub-Processors
                </h2>
                <p>
                  We operate on enterprise cloud providers including Supabase (database &amp; encrypted storage),
                  Vercel (application hosting), Safaricom Daraja (M-Pesa billing), and Resend (transactional email).
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  6. Contact Us
                </h2>
                <p>
                  Cillah AI Automation (Registered in Kenya &bull; BN-5559Q2JL)
                  <br />
                  Nairobi, Kenya
                  <br />
                  <a href="mailto:atulah@cillah.dev" className="text-[#C9A66B] hover:underline mt-2 inline-block">
                    atulah@cillah.dev
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
