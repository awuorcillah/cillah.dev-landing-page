import { cn } from "@/lib/utils"
import { CHAT_MESSAGES } from "@/lib/constants"

export function ChatMockup() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-[#0B141A] shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-border bg-[#1F2C34] px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
          <span className="text-sm font-bold text-primary">AI</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            AI Property Assistant
          </p>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-2 p-4">
        {CHAT_MESSAGES.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
              msg.sender === "user"
                ? "ml-auto rounded-br-sm bg-[#005C4B] text-foreground"
                : "mr-auto rounded-bl-sm bg-[#1F2C34] text-foreground"
            )}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  )
}
