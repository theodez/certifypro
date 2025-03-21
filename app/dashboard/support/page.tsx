"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mail, MessageSquare, Phone, Send } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulaire de contact */}
        <Card className="p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Nous contacter</h2>
            <p className="text-gray-500">
              Une question ? Un problème ? N'hésitez pas à nous contacter, nous vous répondrons dans les plus brefs délais.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sujet</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Signaler un bug</SelectItem>
                    <SelectItem value="feature">Suggérer une fonctionnalité</SelectItem>
                    <SelectItem value="question">Question générale</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Décrivez votre problème ou votre demande..."
                  className="h-32"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Pièces jointes (optionnel)</label>
                <Input type="file" multiple />
              </div>

              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </Card>

        {/* Informations de contact */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Nous contacter directement</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:support@certifypro.fr" className="text-blue-500 hover:underline">
                    support@certifypro.fr
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Téléphone</p>
                  <a href="tel:+33123456789" className="text-blue-500 hover:underline">
                    +33 1 23 45 67 89
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Chat en direct</p>
                  <p className="text-sm text-gray-500">Disponible du lundi au vendredi, 9h-18h</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">FAQ</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Comment modifier mes paramètres de notification ?</h3>
                <p className="text-sm text-gray-500">
                  Rendez-vous dans les paramètres, onglet "Notifications" pour personnaliser vos préférences.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Comment ajouter un nouveau collaborateur ?</h3>
                <p className="text-sm text-gray-500">
                  Dans la section "Collaborateurs", cliquez sur le bouton "+" en haut à droite.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Comment gérer les formations de mon équipe ?</h3>
                <p className="text-sm text-gray-500">
                  Accédez à la section "Équipes" et sélectionnez l'équipe concernée pour voir et gérer les formations.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 