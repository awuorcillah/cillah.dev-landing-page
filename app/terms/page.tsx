"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function TermsOfService() {
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
                Terms of Service
              </h1>
              <p className="text-sm text-[#F9F7F6]/40 uppercase tracking-widest font-sans font-medium">
                Last Updated: October 2026
              </p>
            </motion.div>
          </div>
        </section>

        {/* TERMS CONTENT */}
        <section className="pb-32 bg-[#1C1C1C]">
          <div className="container mx-auto max-w-3xl px-6">
            <div className="prose prose-invert max-w-none space-y-12 font-sans font-light text-[17px] leading-relaxed text-[#F9F7F6]/70">
              <div>
                <p>These terms govern the use of cillah.dev.</p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  1. Services
                </h2>
                <p>
                  Cillah.dev provides AI automation services, including workflow automation,
                  chatbot development, and email outreach campaigns.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  2. Accounts
                </h2>
                <p>
                  Access to client portals and internal tools is restricted to authorized
                  users. Users are responsible for maintaining the confidentiality of their
                  credentials.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  3. Third-Party Integrations
                </h2>
                <p>
                  Our services may connect to third-party platforms (including Meta, Google,
                  OpenAI, Make.com, Airtable, GitHub, and Vercel). Use of those platforms is
                  additionally governed by their own terms.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  4. Acceptable Use
                </h2>
                <p>
                  Clients agree not to use our services to send spam, unlawful content, or
                  material that violates any third party&apos;s rights.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  5. Liability
                </h2>
                <p>
                  Services are provided &apos;as is&apos; without warranties of any kind.
                  Cillah.dev is not liable for indirect or consequential damages.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  6. Contact
                </h2>
                <p>
                  Questions about these terms:&nbsp;
                  <a href="mailto:atulah@cillah.dev" className="text-[#C9A66B] hover:underline">
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
