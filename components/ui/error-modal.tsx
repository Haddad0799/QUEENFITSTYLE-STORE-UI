'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ResolvedError } from '@/lib/errors/resolve-error'

interface ErrorModalProps {
  error: ResolvedError | null
  onClose: () => void
}

export function ErrorModal({ error, onClose }: ErrorModalProps) {
  // Radix Dialog cuida do trap de foco e do fechar com Escape (via onOpenChange).
  return (
    <Dialog
      open={error !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        {error && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3 text-left">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </span>
                <div className="flex-1 space-y-1">
                  <DialogTitle>{error.title}</DialogTitle>
                  <DialogDescription>{error.message}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {error.validationErrors && error.validationErrors.length > 0 && (
              <ul className="space-y-1 rounded-md bg-destructive/5 p-3 text-sm text-destructive">
                {error.validationErrors.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter>
              {/* foco inicial no botão de ação ao abrir o modal */}
              <Button autoFocus onClick={onClose}>
                Entendido
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
