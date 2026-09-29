"use client"

import Link from "next/link"
import { Linkedin, Instagram, Mail, Phone, Facebook } from "lucide-react"

// Inline TikTok icon to prevent version compatibility issues
function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.15-.15-.24-.22v6.52c-.03 2.32-.87 4.67-2.61 6.13-1.89 1.66-4.66 2.19-7.06 1.44-2.73-.83-4.82-3.32-5.18-6.15-.46-3.41 1.72-6.93 5.09-7.75 1-.25 2.06-.29 3.08-.12V12.2c-.85-.25-1.79-.26-2.62.11-1.41.59-2.22 2.11-2.02 3.61.16 1.34 1.16 2.5 2.5 2.76 1.33.28 2.8-.29 3.39-1.5.21-.42.3-1 .28-1.48V.02z"/>
    </svg>
  )
}

export function Footer() {
  const brandName = "Cillah.dev"
  const tagline = "The Operating System Behind High-Performing Real Estate Agencies"
  const currentYear = new Date().getFullYear()

  const contactEmail = "info@cillah.dev"
  const phone = "+254759442265"
  const linkedIn = "https://www.linkedin.com/in/cheryl-cilla-77a125415?utm_source=share_via&utm_content=profile&utm_medium=member_android"
  const instagram = "https://www.instagram.com/cheryl_cilla"
  const facebook = "https://www.facebook.com/share/1EbU2KjfER/"
  const tiktok = "https://www.tiktok.com/@cillah.dev"
  const clientPortalUrl = "https://cillah.convocore.ai/"

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Our Services", href: "/our-services" },
    { name: "Use Cases", href: "/use-cases" },
    { name: "Book Consultation", href: "/book-consultation" },
  ]

  return (
    <footer className="border-t border-[#F4E7E7]/10 bg-[#1C1C1C] py-16 md:py-24 mt-32 text-[#F9F7F6]">
      <div className="container mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border border-[#C9A66B]/30">
                <img 
                  src="/images/cillah-logo.jpg" 
                  alt="Cillah.dev Logo"
                  className="object-cover h-full w-full"
                />
              </div>
              <span className="font-heading font-semibold text-xl tracking-tight text-[#F9F7F6]">
                cillah.dev
              </span>
            </Link>
            <p className="max-w-md text-[#F9F7F6]/60 text-[16px] leading-relaxed mb-8 font-sans">
              {tagline}
            </p>
            <div className="flex items-center gap-3">
              <a 
                href={linkedIn} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full border border-[#F4E7E7]/10 hover:border-[#C9A66B]/50 hover:bg-[#F4E7E7]/5 transition-all duration-300"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="h-4 w-4 text-[#F9F7F6]/60 hover:text-[#C9A66B] transition-colors" />
              </a>
              <a 
                href={instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full border border-[#F4E7E7]/10 hover:border-[#C9A66B]/50 hover:bg-[#F4E7E7]/5 transition-all duration-300"
                aria-label="Instagram Profile"
              >
                <Instagram className="h-4 w-4 text-[#F9F7F6]/60 hover:text-[#C9A66B] transition-colors" />
              </a>
              <a 
                href={facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full border border-[#F4E7E7]/10 hover:border-[#C9A66B]/50 hover:bg-[#F4E7E7]/5 transition-all duration-300"
                aria-label="Facebook Profile"
              >
                <Facebook className="h-4 w-4 text-[#F9F7F6]/60 hover:text-[#C9A66B] transition-colors" />
              </a>
              <a 
                href={tiktok} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full border border-[#F4E7E7]/10 hover:border-[#C9A66B]/50 hover:bg-[#F4E7E7]/5 transition-all duration-300"
                aria-label="TikTok Profile"
              >
                <TikTokIcon className="h-4 w-4 text-[#F9F7F6]/60 hover:text-[#C9A66B] transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-[16px] tracking-wider text-[#F9F7F6] uppercase mb-6">
              Navigation
            </h4>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-[#F9F7F6]/60 hover:text-[#C9A66B] text-[15px] transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <a 
                  href={clientPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F9F7F6]/60 hover:text-[#C9A66B] text-[15px] transition-colors duration-300"
                >
                  Client Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-heading font-semibold text-[16px] tracking-wider text-[#F9F7F6] uppercase mb-6">
              Connect
            </h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href={`mailto:${contactEmail}`} 
                  className="inline-flex items-center gap-3 text-[#F9F7F6]/60 hover:text-[#C9A66B] text-[15px] transition-colors duration-300"
                >
                  <Mail className="h-4 w-4" />
                  {contactEmail}
                </a>
              </li>
              <li>
                <a 
                  href={`tel:${phone}`} 
                  className="inline-flex items-center gap-3 text-[#F9F7F6]/60 hover:text-[#C9A66B] text-[15px] transition-colors duration-300"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              </li>
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-[#F9F7F6]/60 hover:text-[#C9A66B] text-[15px] transition-colors duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#F4E7E7]/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm text-[#F9F7F6]/40 font-sans">
            &copy; {currentYear} {brandName}. All rights reserved.
          </p>
          <p className="text-sm text-[#F9F7F6]/30 font-sans">
            Operating System for Premium Real Estate
          </p>
        </div>
      </div>
    </footer>
  )
}
