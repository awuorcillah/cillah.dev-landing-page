import { NextResponse } from "next/server"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { name, email } = body

    const errors: string[] = []

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      errors.push("name is required")
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      errors.push("A valid email is required")
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      )
    }

    // Log subscription (future: Resend, email list, CRM)
    console.log("[Newsletter Signup]", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }
}
