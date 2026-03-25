"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, CheckCircle, XCircle, Clock, ExternalLink, 
  ThumbsUp, ThumbsDown, Shield, History, UserRound 
} from "lucide-react"
import { Logo } from "@/components/logo"
import { getAdminCreatorRequests, reviewCreatorRequest } from "@/lib/services/creator-client"
import type { AdminCreatorRequest } from "@/lib/types"

export default function AdminCreatorRequestsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<AdminCreatorRequest[]>([])
  const [selectedTab, setSelectedTab] = useState("pending")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [hasPortfolioOnly, setHasPortfolioOnly] = useState(false)
  const [resubmittedOnly, setResubmittedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent")

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    if (!user.isAdmin) {
      router.push("/dashboard")
      return
    }

    loadRequests("pending")
  }, [user])

  useEffect(() => {
    if (!user?.isAdmin) return

    const timeoutId = setTimeout(() => {
      loadRequests(selectedTab)
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [hasPortfolioOnly, resubmittedOnly, search, selectedTab, sortBy, user?.isAdmin])

  const loadRequests = async (status: string) => {
    setLoading(true)
    try {
      const response = await getAdminCreatorRequests({
        status,
        search,
        hasPortfolio: hasPortfolioOnly || undefined,
        resubmitted: resubmittedOnly || undefined,
        sortBy,
      })
      setRequests(response.data || [])
    } catch (err) {
      console.error("Error loading requests:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    const confirmed = confirm(
      action === "approve"
        ? "Êtes-vous sûr de vouloir approuver cette demande ?"
        : "Êtes-vous sûr de vouloir rejeter cette demande ?"
    )

    if (!confirmed) return

    setProcessingId(requestId)
    try {
      const response = await reviewCreatorRequest(requestId, action, adminNotes[requestId] || "")
      alert(response.data?.message || "Action terminée")
      loadRequests(selectedTab)
    } catch (err) {
      console.error("Error processing request:", err)
      alert("Une erreur est survenue")
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Logo className="mb-4" onClick={() => router.push("/dashboard")} />
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Gestion des Demandes Créateurs
            </h1>
            <p className="text-foreground/70 mt-2">
              Examinez et approuvez les candidatures des futurs créateurs AmrVerse
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <Card className="p-4 mb-6">
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr,1fr] items-end">
              <div>
                <label className="text-sm font-medium text-foreground/70 mb-2 block">Recherche</label>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nom, pseudo ou email"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={hasPortfolioOnly} onChange={(event) => setHasPortfolioOnly(event.target.checked)} />
                Avec portfolio
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={resubmittedOnly} onChange={(event) => setResubmittedOnly(event.target.checked)} />
                Resoumises
              </label>
              <div>
                <label className="text-sm font-medium text-foreground/70 mb-2 block">Anciennete</label>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as "recent" | "oldest")}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="recent">Plus récentes</option>
                  <option value="oldest">Plus anciennes</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="p-4">
              <p className="text-sm text-foreground/60">Demandes visibles</p>
              <p className="text-3xl font-bold mt-2">{requests.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-foreground/60">Avec portfolio</p>
              <p className="text-3xl font-bold mt-2">{requests.filter((request) => !!request.portfolioUrl).length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-foreground/60">Déjà relancées</p>
              <p className="text-3xl font-bold mt-2">
                {requests.filter((request) => request.auditTrail?.some((entry) => entry.action === "resubmitted")).length}
              </p>
            </Card>
          </div>

          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En attente
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approuvées
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejetées
            </TabsTrigger>
          </TabsList>

          {/* Pending */}
          <TabsContent value="pending" className="space-y-4">
            {requests.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <p className="text-foreground/60">Aucune demande en attente</p>
              </Card>
            ) : (
              requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onApprove={() => handleAction(req.id, "approve")}
                  onReject={() => handleAction(req.id, "reject")}
                  processing={processingId === req.id}
                  adminNotes={adminNotes[req.id] || ""}
                  onNotesChange={(notes) => setAdminNotes({ ...adminNotes, [req.id]: notes })}
                  showActions
                />
              ))
            )}
          </TabsContent>

          {/* Approved */}
          <TabsContent value="approved" className="space-y-4">
            {requests.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500/20 mx-auto mb-4" />
                <p className="text-foreground/60">Aucune demande approuvée</p>
              </Card>
            ) : (
              requests.map((req) => (
                <RequestCard key={req.id} request={req} showActions={false} />
              ))
            )}
          </TabsContent>

          {/* Rejected */}
          <TabsContent value="rejected" className="space-y-4">
            {requests.length === 0 ? (
              <Card className="p-12 text-center">
                <XCircle className="w-16 h-16 text-red-500/20 mx-auto mb-4" />
                <p className="text-foreground/60">Aucune demande rejetée</p>
              </Card>
            ) : (
              requests.map((req) => (
                <RequestCard key={req.id} request={req} showActions={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Composant carte de demande
function RequestCard({
  request,
  onApprove,
  onReject,
  processing,
  adminNotes,
  onNotesChange,
  showActions,
}: {
  request: AdminCreatorRequest
  onApprove?: () => void
  onReject?: () => void
  processing?: boolean
  adminNotes?: string
  onNotesChange?: (notes: string) => void
  showActions: boolean
}) {
  return (
    <Card className="p-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Info utilisateur */}
        <div>
          <h3 className="font-semibold text-lg mb-2">{request.fullName}</h3>
          <div className="space-y-1 text-sm text-foreground/70">
            <p className="flex items-center gap-2"><UserRound className="w-4 h-4" />@{request.username}</p>
            <p>{request.email}</p>
            <p className="text-xs text-foreground/50">
              Demandé le {new Date(request.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {request.portfolioUrl && (
            <a
              href={request.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm flex items-center gap-1 mt-2"
            >
              <ExternalLink className="w-4 h-4" />
              Voir le portfolio
            </a>
          )}
        </div>

        {/* Présentation et motivation */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Présentation</h4>
            <p className="text-sm text-foreground/70 bg-muted p-3 rounded-lg">
              {request.presentation}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Motivation et projets</h4>
            <p className="text-sm text-foreground/70 bg-muted p-3 rounded-lg">
              {request.motivation}
            </p>
          </div>

          {/* Notes admin (si reviewé) */}
          {request.adminNotes && (
            <div>
              <h4 className="font-medium text-sm mb-2">Notes administrateur</h4>
              <p className="text-sm text-foreground/70 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                {request.adminNotes}
              </p>
              {request.reviewedBy && (
                <p className="text-xs text-foreground/50 mt-1">
                  Par {request.reviewedBy} le {new Date(request.reviewedAt!).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          )}

          {!!request.auditTrail?.length && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <History className="w-4 h-4" />
                Historique
              </h4>
              <div className="space-y-2">
                {request.auditTrail.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="rounded-lg border bg-background/60 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium capitalize">{entry.action}</span>
                      <span className="text-xs text-foreground/50">{new Date(entry.createdAt).toLocaleString("fr-FR")}</span>
                    </div>
                    {(entry.actorUsername || entry.actorType) && (
                      <p className="text-xs text-foreground/50 mt-1">
                        {entry.actorUsername ? `Par ${entry.actorUsername}` : `Source: ${entry.actorType}`}
                      </p>
                    )}
                    {entry.notes && <p className="text-foreground/70 mt-2">{entry.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes administrateur (optionnel)
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => onNotesChange?.(e.target.value)}
                  placeholder="Ajoutez des commentaires pour cette demande..."
                  rows={3}
                  disabled={processing}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onApprove}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="w-5 h-5 mr-2" />
                      Approuver
                    </>
                  )}
                </Button>

                <Button
                  onClick={onReject}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ThumbsDown className="w-5 h-5 mr-2" />
                      Rejeter
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
