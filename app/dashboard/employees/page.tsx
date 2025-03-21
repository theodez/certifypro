"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, Plus } from "lucide-react";

const employees = [
  { id: 1, name: "Ann Culhane", email: "example@email.com", status: "À jour", role: "User", site: "Sans objet" },
  { id: 2, name: "Ahmad Rosser", email: "example@email.com", status: "À jour", role: "Admin", site: "Chantier Alpha" },
  { id: 3, name: "Zain Cataloni", email: "example@email.com", status: "Recyclage", role: "Admin", site: "Chantier Beta" },
  { id: 4, name: "Leo Stanton", email: "example@email.com", status: "Recyclage à prévoir", role: "Chantier", site: "Chantier Beta" },
  { id: 5, name: "Kaiya Vetrous", email: "example@email.com", status: "À jour", role: "Contrôleur", site: "Sans objet" },
];

const statusColors: Record<string, string> = {
  "À jour": "bg-green-100 text-green-700",
  "Recyclage": "bg-red-100 text-red-700",
  "Recyclage à prévoir": "bg-yellow-100 text-yellow-700",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Collaborateurs</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Créer un utilisateur
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filtrer
        </Button>
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees
            .filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()))
            .map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>{emp.id}</TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[emp.status]}`}>
                    {emp.status}
                  </span>
                </TableCell>
                <TableCell>{emp.role}</TableCell>
                <TableCell>{emp.site}</TableCell>
                <TableCell>
                  <Button variant="link" size="sm">Modifier</Button>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
