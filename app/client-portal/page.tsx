"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isAdminAccount } from "@/lib/auth-roles"
import { ArrowRight, LogIn, UserPlus } from "lucide-react"

export default function ClientPortalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

          const email = user.email?.toLowerCase() || ""
          const isAdmin = isAdminAccount(email, profile?.role)

          router.replace(isAdmin ? "/admin/dashboard" : "/user/dashboard")
          return
        }
      } catch {
        // Ignore transient network errors when checking session
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router, supabase])

  return (
    <main className="min-h-screen bg-[#07070B] flex flex-col items-center justify-center text-[#F9F7F6] px-6 py-16">
      <div className="w-full max-w-md rounded-[20px] bg-[#1C1C1C] border border-white/10 p-8 text-center shadow-2xl">
        <div className="relative h-16 w-16 rounded-full overflow-hidden border border-[#C9A66B]/40 mx-auto mb-6">
          <img
            src="/images/cillah-emblem.png"
            alt="Cillah Logo"
            className="object-cover h-full w-full"
          />
        </div>

        <span className="text-[11px] font-heading font-medium uppercase tracking-[0.22em] text-[#C9A66B] block mb-2">
          Client Portal
        </span>
        <h1 className="font-heading font-light text-[26px] leading-snug text-[#F9F7F6] mb-3">
          Access Your Cillah Workspace
        </h1>
        <p className="text-[14px] font-sans font-light text-[#F9F7F6]/65 leading-relaxed mb-8">
          {checkingSession
            ? "Checking your active session..."
            : "Log in to view your sales pipeline, leads, and automation dashboard, or create a new client account."}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            rel="nofollow"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#C9A66B] text-[#07070B] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[14px] px-6 py-3.5 text-[14px] tracking-wide transition-all duration-300"
          >
            <LogIn className="h-4 w-4" />
            <span>Log In</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/signup"
            rel="nofollow"
            className="w-full inline-flex items-center justify-center gap-2 bg-white/5 text-[#F9F7F6] border border-white/15 hover:border-[#C9A66B]/50 hover:text-[#C9A66B] font-heading font-medium rounded-[14px] px-6 py-3.5 text-[14px] tracking-wide transition-all duration-300"
          >
            <UserPlus className="h-4 w-4" />
            <span>Sign Up</span>
          </Link>
        </div>

        <Link
          href="/"
          className="inline-block text-[12px] text-[#F9F7F6]/50 hover:text-[#C9A66B] transition-colors mt-6"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
