import { XCircle, CheckCircle2 } from "lucide-react"

interface ComparisonCardProps {
  category: string
  before: string
  after: string
}

export function ComparisonCard({ category, before, after }: ComparisonCardProps) {
  return (
    <div className="glass-card overflow-hidden transition-all duration-300 hover:glow-subtle">
      <div className="p-6">
        <h4 className="mb-6 text-xl font-bold text-white">{category}</h4>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Before</p>
              <p className="text-lg text-white/80">{before}</p>
            </div>
          </div>
          
          <div className="h-px w-full bg-white/5" />
          
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[var(--primary-accent)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary-accent)]">After</p>
              <p className="text-lg font-medium text-white">{after}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
