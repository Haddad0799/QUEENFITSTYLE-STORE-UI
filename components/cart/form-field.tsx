import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FormField({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-xs uppercase tracking-[0.12em] text-foreground/80">
          {label}
        </Label>
        {optional && (
          <span className="text-[11px] text-muted-foreground">opcional</span>
        )}
      </div>
      {children}
      {error && (
        <p className={cn('text-xs leading-5 text-destructive')}>{error}</p>
      )}
    </div>
  )
}
