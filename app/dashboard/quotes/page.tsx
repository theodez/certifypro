"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

// Types pour les devis
interface Quote {
  id: number
  formation: string
  employee: string
  date: string
  price: string
  organization: string
}

// Interface pour les groupes de devis
interface QuoteGroup {
  title: string
  employee: string
  quotes: Quote[]
}

// Données mockées
const quoteGroups: QuoteGroup[] = [
  {
    title: "CACES 3 de Jean Dupont",
    employee: "Jean Dupont",
    quotes: [
      {
        id: 1,
        formation: "CACES 3",
        employee: "Jean Dupont",
        date: "12 mars 2025",
        price: "290,00€",
        organization: "Orga 1"
      },
      {
        id: 2,
        formation: "CACES 3",
        employee: "Jean Dupont",
        date: "15 mars 2025",
        price: "220,00€",
        organization: "Orga 2"
      },
      {
        id: 3,
        formation: "CACES 3",
        employee: "Jean Dupont",
        date: "20 mars 2025",
        price: "330,00€",
        organization: "Orga 3"
      }
    ]
  },
  {
    title: "Habilitation électrique de Pascal Dupont",
    employee: "Pascal Dupont",
    quotes: [
      {
        id: 4,
        formation: "CACES 3",
        employee: "Pascal Dupont",
        date: "12 mars 2025",
        price: "290,00€",
        organization: "Orga 1"
      },
      {
        id: 5,
        formation: "CACES 3",
        employee: "Pascal Dupont",
        date: "12 mars 2025",
        price: "290,00€",
        organization: "Orga 2"
      }
    ]
  }
]

// Devis validés
const validatedQuotes: Quote[] = [
  {
    id: 6,
    formation: "ATEX 0",
    employee: "Marc Dupont",
    date: "14 avril 2025",
    price: "290,00€",
    organization: "Orga 1"
  }
]

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Devis reçus</h1>

      {/* Devis en attente */}
      <div className="space-y-4">
        {quoteGroups.map((group) => (
          <Card key={group.title} className="p-6">
            <div className="space-y-4">
              {/* Titre du groupe */}
              <h2 className="text-lg font-semibold text-blue-600">{group.title}</h2>

              {/* Liste des devis */}
              <div className="space-y-3">
                {group.quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{quote.price}</span>
                          <span className="text-gray-500">{quote.organization}</span>
                        </div>
                        <div className="text-sm text-gray-500">{quote.date}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Devis validés */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-green-600 mb-4">
          Devis validés en attente de paiement / date de RDV confirmée
        </h2>
        <div className="space-y-3">
          {validatedQuotes.map((quote) => (
            <div
              key={quote.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{quote.price}</span>
                    <span className="text-gray-500">{quote.organization}</span>
                  </div>
                  <div className="text-sm text-gray-500">{quote.date}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600">
                Validé
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
} 