"use client"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Bell, Mail, MessageSquare, Shield, User } from "lucide-react"
import { Input } from "@/components/ui/input"

const delayOptions = ["7j", "15j", "1m"]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Compte
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card className="p-6">
            <div className="space-y-8">
              {/* Notifications email avant péremption */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notif" className="text-base">
                    Notification email avant péremption :
                  </Label>
                  <Switch id="email-notif" />
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>Délais de prévenance :</span>
                  <div className="flex gap-2">
                    {delayOptions.map((option, index) => (
                      <span key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={`email-delay-${option}`}
                          name="email-delay"
                          className="mr-1"
                          defaultChecked={index === 0}
                        />
                        <label htmlFor={`email-delay-${option}`}>{option}</label>
                        {index < delayOptions.length - 1 && <span className="mx-1">/</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notifications SMS collaborateur */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notif" className="text-base">
                    Notification SMS collaborateur avant recyclage :
                  </Label>
                  <Switch id="sms-notif" defaultChecked />
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>Délais de prévenance :</span>
                  <div className="flex gap-2">
                    {delayOptions.map((option, index) => (
                      <span key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={`sms-delay-${option}`}
                          name="sms-delay"
                          className="mr-1"
                          defaultChecked={index === 0}
                        />
                        <label htmlFor={`sms-delay-${option}`}>{option}</label>
                        {index < delayOptions.length - 1 && <span className="mx-1">/</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notification email collaborateur */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-collab-notif" className="text-base">
                    Notification email collaborateur avant recyclage :
                  </Label>
                  <Switch id="email-collab-notif" />
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>Délais de prévenance :</span>
                  <div className="flex gap-2">
                    {delayOptions.map((option, index) => (
                      <span key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={`email-collab-delay-${option}`}
                          name="email-collab-delay"
                          className="mr-1"
                          defaultChecked={index === 0}
                        />
                        <label htmlFor={`email-collab-delay-${option}`}>{option}</label>
                        {index < delayOptions.length - 1 && <span className="mx-1">/</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notification email réception devis */}
              <div className="flex items-center justify-between">
                <Label htmlFor="quote-notif" className="text-base">
                  Notification email réception de devis :
                </Label>
                <Switch id="quote-notif" />
              </div>

              {/* Disponibilité collaborateurs */}
              <div className="space-y-4">
                <Label className="text-base">
                  Disponibilité collaborateurs avant péremption :
                </Label>
                <div className="flex gap-2">
                  {delayOptions.map((option, index) => (
                    <span key={option} className="flex items-center">
                      <input
                        type="radio"
                        id={`availability-${option}`}
                        name="availability"
                        className="mr-1"
                        defaultChecked={index === 0}
                      />
                      <label htmlFor={`availability-${option}`}>{option}</label>
                      {index < delayOptions.length - 1 && <span className="mx-1">/</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confirmations avant RDV */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="collab-confirm" className="text-base">
                    Confirmation collaborateur 2 jours avant RDV :
                  </Label>
                  <Switch id="collab-confirm" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-confirm" className="text-base">
                    Confirmation administrateur 2 jours avant RDV :
                  </Label>
                  <Switch id="admin-confirm" defaultChecked />
                </div>
              </div>

              {/* Durée statut recyclage */}
              <div className="space-y-4">
                <Label className="text-base">
                  Durée pour le statut "Recyclage à prévoir" :
                </Label>
                <div className="flex gap-2">
                  {delayOptions.map((option, index) => (
                    <span key={option} className="flex items-center">
                      <input
                        type="radio"
                        id={`recycling-${option}`}
                        name="recycling"
                        className="mr-1"
                        defaultChecked={index === 0}
                      />
                      <label htmlFor={`recycling-${option}`}>{option}</label>
                      {index < delayOptions.length - 1 && <span className="mx-1">/</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="p-6">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Informations de l'entreprise</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom de l'entreprise</Label>
                    <Input defaultValue="CertifyPro" />
                  </div>
                  <div>
                    <Label>SIRET</Label>
                    <Input defaultValue="123 456 789 00001" />
                  </div>
                  <div>
                    <Label>Email de contact</Label>
                    <Input type="email" defaultValue="contact@certifypro.fr" />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input type="tel" defaultValue="+33 1 23 45 67 89" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Préférences</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Langue par défaut</Label>
                    <Select defaultValue="fr">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Fuseau horaire</Label>
                    <Select defaultValue="paris">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paris">Paris (UTC+1)</SelectItem>
                        <SelectItem value="london">London (UTC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Sécurité du compte</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Authentification à deux facteurs</Label>
                      <p className="text-sm text-gray-500">Renforcez la sécurité de votre compte</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Notifications de connexion</Label>
                      <p className="text-sm text-gray-500">Recevez un email lors d'une nouvelle connexion</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Sessions actives</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Chrome - Windows</p>
                      <p className="text-sm text-gray-500">Dernière activité: Il y a 2 minutes</p>
                    </div>
                    <Button variant="outline" size="sm">Déconnecter</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Safari - iPhone</p>
                      <p className="text-sm text-gray-500">Dernière activité: Il y a 1 heure</p>
                    </div>
                    <Button variant="outline" size="sm">Déconnecter</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 