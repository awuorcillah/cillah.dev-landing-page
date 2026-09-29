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
                Last Updated: June 2026
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
                  Information We Collect
                </h2>
                <p>
                  We may collect names, email addresses, phone numbers, WhatsApp contact
                  information, Instagram messages, chatbot conversations, and information
                  submitted through forms on our website.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  How We Use Information
                </h2>
                <p>
                  We use this information to provide AI automation services, respond to
                  inquiries, qualify leads, and improve our services.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  Third-Party Services
                </h2>
                <p>
                  We may use Meta (Facebook, Instagram, WhatsApp), OpenAI, Make.com,
                  Airtable, GitHub, and Vercel to provide our services.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-normal text-[24px] text-[#F9F7F6] mb-4 border-b border-[#F4E7E7]/10 pb-2">
                  Contact
                </h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                  <br />
                  <a href="mailto:info@cillah.ai" className="text-[#C9A66B] hover:underline mt-2 inline-block">
                    info@cillah.ai
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
