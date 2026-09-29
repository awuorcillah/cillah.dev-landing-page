'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Red/Amber security glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg bg-slate-900/90 border-red-500/20 backdrop-blur-xl shadow-2xl relative z-10 text-center">
        <CardHeader className="space-y-4 pt-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <CardTitle className="text-3xl font-extrabold text-slate-100">
              403 - Access Denied
            </CardTitle>
            <CardDescription className="text-slate-400 text-base mt-2">
              You do not have Administrator permissions to access the Admin Portal.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 py-4 text-slate-300 text-sm">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> Security Enforcement
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              This area is restricted to system administrators (Cheryl Cilla Atulah). If you believe this is an error, contact your administrator to escalate your account permissions.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pb-8 pt-2">
          <Button
            asChild
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 shadow-lg shadow-cyan-500/20"
          >
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to My Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
