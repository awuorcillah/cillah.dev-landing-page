"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', user.id)
          .single()
        if (profile) setRole(profile.role)
      }
    }
    fetchUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Our Services", href: "/#the-interface" },
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
          {/* Profile Avatar Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center gap-2 text-[#F9F7F6] hover:text-[#C9A66B] focus:outline-none"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <img
                src={user?.user_metadata?.avatar_url || '/placeholder-avatar.png'}
                alt="Avatar"
                className="h-9 w-9 rounded-full border-2 border-[#C9A66B]/40 object-cover"
              />
              {role === 'admin' && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A66B]">Admin</span>
              )}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C1C] border border-[#F4E7E7]/15 rounded-xl shadow-2xl z-50 overflow-hidden">
                <Link
                  href="/user/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-[#F9F7F6] hover:bg-[#C9A66B]/20 transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-[#F9F7F6] hover:bg-[#C9A66B]/20 transition-colors"
                >
                  Dashboard
                </Link>
                {role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-[#C9A66B] hover:bg-[#C9A66B]/20 transition-colors font-semibold"
                  >
                    ⚙ Admin Panel
                  </Link>
                )}
                <div className="h-px bg-white/5 mx-3" />
                <button
                  onClick={async () => {
                    setProfileMenuOpen(false)
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* DESKTOP NAV CTA BUTTONS */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-[15px] font-medium text-[#F9F7F6]/80 hover:text-[#C9A66B] px-3 py-2 transition-colors duration-300"
          >
            Log In
          </Link>
          <Link 
            href="/signup"
            className="inline-flex items-center justify-center bg-[#C9A66B] text-[#1C1C1C] hover:bg-[#C9A66B]/90 font-heading font-medium rounded-[16px] px-6 py-2.5 text-[15px] tracking-wide transition-all duration-300 hover:shadow-[0_4px_20px_rgba(201,166,107,0.15)]"
          >
            Sign Up
          </Link>
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
          
          <div className="flex flex-col gap-3 pt-2">
            <Link 
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center border border-[#C9A66B]/30 text-[#F9F7F6] hover:bg-[#F4E7E7]/5 font-heading font-medium rounded-[16px] py-3 text-[16px] tracking-wide transition-all duration-300"
            >
              Log In
            </Link>
            <Link 
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="w-full text-center bg-[#C9A66B] text-[#1C1C1C] hover:bg-[#C9A66B]/90 font-heading font-medium rounded-[16px] py-3 text-[16px] tracking-wide transition-all duration-300"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
