"use client"

import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreHorizontal } from "lucide-react"

const teams = [
  {
    id: 1,
    name: "Équipe Construction",
    leader: "Jean Dupont",
    members: 12,
    certifications: 45,
    status: "Actif",
  },
  {
    id: 2,
    name: "Équipe Maintenance",
    leader: "Marie Martin",
    members: 8,
    certifications: 32,
    status: "Actif",
  },
  // ... plus d'équipes
]

export default function TeamsPage() {
  return (
    <div className="h-full w-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des équipes</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle équipe
        </Button>
      </div>

      <Card className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Rechercher une équipe..." 
                className="pl-10 w-full"
              />
            </div>
            <Button variant="outline">Filtres</Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de l'équipe</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Certifications</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.leader}</TableCell>
                  <TableCell>{team.members}</TableCell>
                  <TableCell>{team.certifications}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {team.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
} 