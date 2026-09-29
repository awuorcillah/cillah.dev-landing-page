import { NextResponse } from "next/server"

const VALID_VOLUMES = ["0-20", "20-50", "50-100", "100+"]
const VALID_PLATFORMS = ["instagram", "facebook", "whatsapp", "website"]

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { fullName, agencyName, phone, monthlyVolume, platforms, biggestProblem } =
      body

    // Validation
    const errors: string[] = []

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 1) {
      errors.push("fullName is required")
    }

    if (
      !agencyName ||
      typeof agencyName !== "string" ||
      agencyName.trim().length < 1
    ) {
      errors.push("agencyName is required")
    }

    if (!phone || typeof phone !== "string" || !/^\+\d{7,15}$/.test(phone)) {
      errors.push("phone is required and must be a valid international number")
    }

    if (!VALID_VOLUMES.includes(monthlyVolume)) {
      errors.push("monthlyVolume must be one of: " + VALID_VOLUMES.join(", "))
    }

    if (
      !Array.isArray(platforms) ||
      !platforms.every((p: unknown) => VALID_PLATFORMS.includes(p as string))
    ) {
      errors.push(
        "platforms must be an array of: " + VALID_PLATFORMS.join(", ")
      )
    }

    if (
      biggestProblem &&
      (typeof biggestProblem !== "string" || biggestProblem.length > 200)
    ) {
      errors.push("biggestProblem must be a string with max 200 characters")
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      )
    }

    // Log lead (future: Resend email, Google Sheets, CRM webhook)
    console.log("[Lead Captured]", {
      fullName: fullName.trim(),
      agencyName: agencyName.trim(),
      phone,
      monthlyVolume,
      platforms,
      biggestProblem: biggestProblem?.trim() || "",
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
