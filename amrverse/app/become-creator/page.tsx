"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Loader2, Sparkles, Clock, XCircle } from "lucide-react"
import { Logo } from "@/components/logo"

export default function BecomeCreatorPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [existingRequest, setExistingRequest] = useState<any>(null)
  const [showDialog, setShowDialog] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    presentation: "",
    motivation: "",
    portfolioUrl: "",
  })

  // Mettre à jour l'email quand l'utilisateur se connecte
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }))
    }
  }, [user])

  // Vérifier si l'utilisateur a déjà une demande
  useEffect(() => {
    if (!user) {
      router.push("/auth?redirect=/become-creator")
      return
    }

    // Si déjà créateur, rediriger
    if (user.isCreator) {
      router.push("/admin/upload-content")
      return
    }

    checkExistingRequest()
  }, [user])

  useEffect(() => {
    if (user?.isCreator) {
      router.push("/admin/upload-content")
    }
  }, [user?.isCreator, router])

  // Rafraîchir le profil utilisateur toutes les 10 secondes si la demande est en attente
  useEffect(() => {
    if (!existingRequest || existingRequest.status !== 'pending') return

    const interval = setInterval(async () => {
      await refreshUser()
    }, 10000) // 10 secondes

    return () => clearInterval(interval)
  }, [existingRequest, refreshUser, router])

  const checkExistingRequest = async () => {
    try {
      const res = await fetch("/api/creator-requests")

      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setExistingRequest(data.data)
        }
      }
    } catch (err) {
      console.error("Error checking request:", err)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleOpenDialog = () => {
    console.log('[BecomeCreator] Opening dialog...', { user, showDialog })
    
    // Ouvrir le dialog seulement si l'utilisateur est connecté
    if (!user) {
      console.log('[BecomeCreator] No user, redirecting to auth')
      router.push("/auth?redirect=/become-creator")
      return
    }
    
    // Si déjà créateur, rediriger
    if (user.isCreator) {
      console.log('[BecomeCreator] User is already creator, redirecting')
      router.push("/admin/upload-content")
      return
    }
    
    console.log('[BecomeCreator] Setting showDialog to true')
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (!formData.fullName || !formData.email) {
      setError("Veuillez remplir tous les champs obligatoires")
      setLoading(false)
      return
    }
    
    if (formData.presentation.length < 50) {
      setError("Votre présentation doit contenir au moins 50 caractères")
      setLoading(false)
      return
    }
    
    if (formData.motivation.length < 50) {
      setError("Votre motivation doit contenir au moins 50 caractères")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/creator-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName || user?.username || "Utilisateur",
          email: formData.email || user?.email,
          presentation: formData.presentation,
          motivation: formData.motivation,
          portfolioUrl: formData.portfolioUrl || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'envoi")
      }

      setSuccess(true)
      setShowDialog(false)
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si demande existante
  if (existingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Logo className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Demande de Statut Créateur</h1>
          </div>

          <Card className="p-8 text-center">
            {existingRequest.status === "pending" && (
              <>
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Demande en cours de traitement</h2>
                <p className="text-foreground/70 mb-4">
                  Votre demande a été reçue le {new Date(existingRequest.createdAt).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-foreground/60">
                  Veuillez patienter pendant que notre équipe examine votre candidature. 
                  Vous recevrez une réponse par email dans les plus brefs délais.
                </p>
              </>
            )}

            {existingRequest.status === "rejected" && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Demande refusée</h2>
                <p className="text-foreground/70 mb-4">
                  Votre demande a été examinée et n'a pas été approuvée.
                </p>
                {existingRequest.adminNotes && (
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-1">Note de l'administrateur :</p>
                    <p className="text-foreground/70">{existingRequest.adminNotes}</p>
                  </div>
                )}
                <Button onClick={() => router.push("/dashboard")}>
                  Retour au tableau de bord
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // Formulaire de demande
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-purple-950/10 to-background px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Demande envoyée !</h2>
          <p className="text-foreground/70 mb-4">
            Votre demande a été soumise avec succès.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-400 mb-2">
              Veuillez attendre votre réponse
            </p>
            <p className="text-sm text-foreground/60">
              Vous recevrez un email à <strong>{formData.email}</strong> une fois que 
              votre demande aura été examinée.
            </p>
          </div>
          <p className="text-sm text-foreground/50">
            Redirection vers le tableau de bord...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Logo className="mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Devenir Créateur sur AmrVerse
            </h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Partagez vos manhwas avec la communauté ! Cliquez sur le bouton ci-dessous pour soumettre 
              votre candidature en tant que créateur.
            </p>
          </div>

          <Card className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Prêt à partager votre créativité ?</h2>
            <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
              En tant que créateur, vous pourrez publier vos propres manhwas, gérer vos chapitres, 
              et interagir avec une communauté passionnée de lecteurs.
            </p>
            
            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">Avantages créateur :</h3>
              <ul className="text-sm text-foreground/70 space-y-2 text-left max-w-md mx-auto">
                <li>✅ Publier un nombre illimité de manhwas</li>
                <li>✅ Gérer vos chapitres et pages facilement</li>
                <li>✅ Suivre les statistiques de vos œuvres</li>
                <li>✅ Construire votre communauté de fans</li>
              </ul>
            </div>

            <Button
              onClick={handleOpenDialog}
              size="lg"
              className="min-w-[200px]"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Faire une demande
            </Button>
          </Card>
        </div>
      </div>

      {/* Dialog Popup */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Devenir Créateur</DialogTitle>
            <DialogDescription>
              Parlez-nous de votre projet et de ce que vous souhaitez apporter à la communauté AmrVerse.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Nom complet */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Votre nom complet"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.com"
                required
                disabled={loading}
              />
            </div>

            {/* Présentation - Qui êtes-vous ? */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Présentez-vous <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.presentation}
                onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
                placeholder="Qui êtes-vous ? Parlez-nous de votre parcours, votre expérience en création de manhwa, votre style artistique..."
                rows={5}
                required
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.presentation.length}/50 caractères minimum
              </p>
            </div>

            {/* Motivation - Ce que vous voulez apporter */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Qu'allez-vous apporter à la communauté ? <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder="Quels types de manhwas voulez-vous créer ? Quels thèmes allez-vous explorer ? Comment allez-vous contribuer à AmrVerse ?"
                rows={5}
                required
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.motivation.length}/50 caractères minimum
              </p>
            </div>

            {/* Portfolio (optionnel) */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Lien vers votre portfolio (optionnel)
              </label>
              <Input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://votre-portfolio.com"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Instagram, ArtStation, Behance, site personnel, etc.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400 font-medium mb-1">
                📧 Notification par email
              </p>
              <p className="text-xs text-foreground/70">
                Votre demande sera envoyée à l'administrateur. Vous recevrez une réponse par email à <strong>{user?.email}</strong> une fois votre candidature examinée.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.presentation.length < 50 || formData.motivation.length < 50 || !formData.fullName || !formData.email}
                className="flex-1"
              >
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
    </>
  )
}
