"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Our Services", href: "/our-services" },
    { name: "Use Cases", href: "/use-cases" },
    { name: "Pricing", href: "/pricing" },
    { name: "Book Consultation", href: "/book-consultation" },
  ]

  const clientPortalUrl = "https://cillah.convocore.ai/"

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false
    return pathname === path
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1C1C1C]/90 backdrop-blur-md border-b border-[#F4E7E7]/10">
      <div className="container mx-auto max-w-7xl px-6 md:px-12 h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-12 w-12 rounded-full overflow-hidden border border-[#C9A66B]/30 group-hover:border-[#C9A66B] transition-colors duration-300">
            <img 
              src="/images/cillah-logo.jpg" 
              alt="Cillah.dev Logo"
              className="object-cover h-full w-full"
            />
          </div>
          <span className="font-heading font-semibold text-xl tracking-tight text-[#F9F7F6] group-hover:text-[#F4E7E7] transition-colors duration-300">
            cillah.dev
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`text-[15px] font-medium tracking-wide transition-all duration-300 ${
                isActive(item.href) 
                  ? "text-[#C9A66B]" 
                  : "text-[#F9F7F6]/70 hover:text-[#F4E7E7]"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* CLIENT PORTAL CTA */}
        <div className="hidden md:block">
          <a 
            href={clientPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#C9A66B] text-[#1C1C1C] hover:bg-[#C9A66B]/90 font-heading font-medium rounded-[16px] px-6 py-2.5 text-[15px] tracking-wide transition-all duration-300 hover:shadow-[0_4px_20px_rgba(201,166,107,0.15)]"
          >
            Client Portal
          </a>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden text-[#F9F7F6] p-2 hover:bg-[#F4E7E7]/5 rounded-lg transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE NAV OVERLAY */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-[#1C1C1C] border-b border-[#F4E7E7]/10 px-6 py-8 flex flex-col gap-6 shadow-2xl animate-in fade-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className={`text-lg font-medium tracking-wide py-2 border-b border-[#F4E7E7]/5 ${
                  isActive(item.href) 
                    ? "text-[#C9A66B]" 
                    : "text-[#F9F7F6]/80"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <a 
            href={clientPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full text-center bg-[#C9A66B] text-[#1C1C1C] hover:bg-[#C9A66B]/90 font-heading font-medium rounded-[16px] py-4 text-[16px] tracking-wide transition-all duration-300"
          >
            Client Portal
          </a>
        </div>
      )}
    </header>
  )
}
