"use client"

import { Card } from "@/components/ui/card"
import CertificationsChart from "@/components/dashboard/Certificationschart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Check, X, Users, Building2, Calendar, Clock } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// Données mockées pour les devis
const quotes = [
  {
    id: 1,
    formation: "CACES R482",
    provider: "Formation Pro BTP",
    date: "15/04/2024",
    price: "450€",
    status: "En attente"
  },
  {
    id: 2,
    formation: "Habilitation électrique",
    provider: "Électric Formation",
    date: "22/04/2024",
    price: "380€",
    status: "En attente"
  },
  {
    id: 3,
    formation: "SST Recyclage",
    provider: "Secourisme Pro",
    date: "10/05/2024",
    price: "220€",
    status: "En attente"
  }
]

// Données mockées pour les équipes
const teams = [
  {
    id: 1,
    name: "Équipe Construction A",
    members: 12,
    activeFormations: 45,
    expiringFormations: 3
  },
  {
    id: 2,
    name: "Équipe Maintenance",
    members: 8,
    activeFormations: 32,
    expiringFormations: 1
  },
  {
    id: 3,
    name: "Équipe Construction B",
    members: 15,
    activeFormations: 58,
    expiringFormations: 5
  }
]

// Données mockées pour les rendez-vous
const upcomingAppointments = [
  {
    id: 1,
    formation: "CACES R482",
    date: "15/04/2024",
    time: "09:00",
    location: "Centre de formation BTP",
    participant: "Jean Dupont"
  },
  {
    id: 2,
    formation: "SST Recyclage",
    date: "18/04/2024",
    time: "14:00",
    location: "Centre médical",
    participant: "Marie Martin"
  },
  {
    id: 3,
    formation: "Habilitation électrique",
    date: "22/04/2024",
    time: "08:30",
    location: "Électric Formation",
    participant: "Pierre Durant"
  }
]

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Bienvenue, {session?.user?.name || "Utilisateur"}
              </h2>
        <p className="text-gray-600">
          Vous êtes connecté en tant que {session?.user?.role || "utilisateur"}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Informations utilisateur</h3>
          <p>Email: {session?.user?.email}</p>
          <p>ID: {session?.user?.id}</p>
          <p>Entreprise ID: {session?.user?.entrepriseId}</p>
          </Card>
      </div>
    </div>
  );
}
