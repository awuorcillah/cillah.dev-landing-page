"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"

export default function ClientPortalRedirect() {
  const portalUrl = "https://cillah.convocore.ai/"

  useEffect(() => {
    // Perform redirect after 1.5 seconds
    const timer = setTimeout(() => {
      window.location.href = portalUrl
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen bg-[#1C1C1C] flex flex-col items-center justify-center text-[#F9F7F6] px-6">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative h-20 w-20 rounded-full overflow-hidden border border-[#C9A66B]/30 mx-auto mb-8"
        >
          <img 
            src="/images/cillah-logo.jpg" 
            alt="Cillah.ai Logo"
            className="object-cover h-full w-full"
          />
        </motion.div>

        <h1 className="font-heading font-light text-2xl mb-3 text-[#F9F7F6]">
          Entering Client Portal
        </h1>
        
        <p className="text-[15px] font-sans font-light text-[#F9F7F6]/50 mb-8">
          You are being securely redirected to your agency dashboard.
        </p>

        {/* Minimal loading bar */}
        <div className="w-48 h-[2px] bg-[#F4E7E7]/10 rounded-full mx-auto overflow-hidden relative">
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-[#C9A66B] rounded-full"
          />
        </div>
        
        <a 
          href={portalUrl}
          className="text-xs text-[#C9A66B]/60 hover:text-[#C9A66B] transition-colors mt-12 block"
        >
          If you are not redirected automatically, click here.
        </a>
      </div>
    </main>
  )
}
