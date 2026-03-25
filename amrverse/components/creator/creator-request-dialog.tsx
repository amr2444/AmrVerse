import type React from "react"
import { AlertCircle, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CreatorRequestFormValues } from "@/lib/services/creator-client"
import type { User } from "@/lib/types"

export function CreatorRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  values,
  onFieldChange,
  error,
  loading,
  user,
  disabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (event: React.FormEvent) => void
  values: CreatorRequestFormValues
  onFieldChange: <K extends keyof CreatorRequestFormValues>(field: K, value: CreatorRequestFormValues[K]) => void
  error: string
  loading: boolean
  user: User | null
  disabled: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Devenir Createur</DialogTitle>
          <DialogDescription>
            Parlez-nous de votre projet et de ce que vous souhaitez apporter a la communaute AmrVerse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={values.fullName}
              onChange={(event) => onFieldChange("fullName", event.target.value)}
              placeholder="Votre nom complet"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={values.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              placeholder="votre@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Presentez-vous <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={values.presentation}
              onChange={(event) => onFieldChange("presentation", event.target.value)}
              placeholder="Qui etes-vous ? Parlez-nous de votre parcours, votre experience en creation de manhwa, votre style artistique..."
              rows={5}
              required
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{values.presentation.length}/50 caracteres minimum</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Qu'allez-vous apporter a la communaute ? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={values.motivation}
              onChange={(event) => onFieldChange("motivation", event.target.value)}
              placeholder="Quels types de manhwas voulez-vous creer ? Quels themes allez-vous explorer ? Comment allez-vous contribuer a AmrVerse ?"
              rows={5}
              required
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{values.motivation.length}/50 caracteres minimum</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Lien vers votre portfolio (optionnel)</label>
            <Input
              type="url"
              value={values.portfolioUrl}
              onChange={(event) => onFieldChange("portfolioUrl", event.target.value)}
              placeholder="https://votre-portfolio.com"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">Instagram, ArtStation, Behance, site personnel, etc.</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-400 font-medium mb-1">Notification par email</p>
            <p className="text-xs text-foreground/70">
              Votre demande sera envoyee a l'administrateur. Vous recevrez une reponse par email a <strong>{user?.email}</strong> une fois votre candidature examinee.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={disabled} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Envoyer ma demande
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
