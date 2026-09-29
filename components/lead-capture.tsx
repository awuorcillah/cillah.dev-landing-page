"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionWrapper } from "@/components/section-wrapper"
import { LEAD_CAPTURE } from "@/lib/constants"

export function LeadCapture() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })

      if (!res.ok) throw new Error("Failed")
      setStatus("success")
      setName("")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <SectionWrapper className="border-t border-border">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-xl font-bold text-foreground md:text-2xl">
          {LEAD_CAPTURE.headline}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {LEAD_CAPTURE.offer}
        </p>

        {status === "success" ? (
          <p className="mt-6 text-sm font-medium text-accent">
            {"Check your inbox! We've sent the checklist."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-secondary font-semibold text-foreground hover:bg-secondary/80"
            >
              {status === "loading" ? "Sending..." : "Get the Checklist"}
            </Button>
            {status === "error" && (
              <p className="text-xs text-destructive">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </SectionWrapper>
  )
}
