"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface TeamLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

interface Team {
  id: string;
  name: string;
  leads: TeamLead[];
  memberCount: number;
  complianceRate: number;
  validCount: number;
  warningCount: number;
  expiredCount: number;
}

const defaultTeams = [
  {
    name: "Équipe A",
    leader: "Jean Dupont",
    members: 12,
    certifications: "95%",
    status: "À jour",
  },
  {
    name: "Équipe B",
    leader: "Marie Martin",
    members: 8,
    certifications: "87%",
    status: "En attente",
  },
  {
    name: "Équipe C",
    leader: "Pierre Durant",
    members: 15,
    certifications: "92%",
    status: "À jour",
  },
]

export function TeamOverviewTable({ teams = [] }: { teams?: Team[] }) {
  const getTeamStatus = (team: Team) => {
    if (team.expiredCount > 0) return "Expirée";
    if (team.warningCount > 0) return "En attente";
    return "À jour";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Équipe</TableHead>
          <TableHead>Responsable</TableHead>
          <TableHead>Membres</TableHead>
          <TableHead>Certifications</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.length > 0 ? teams.slice(0, 5).map((team) => (
          <TableRow key={team.id}>
            <TableCell className="font-medium">{team.name}</TableCell>
            <TableCell>{team.leads?.length > 0 ? team.leads[0].name : "Non défini"}</TableCell>
            <TableCell>{team.memberCount}</TableCell>
            <TableCell>{team.complianceRate}%</TableCell>
            <TableCell>
              <Badge variant={getTeamStatus(team) === "À jour" ? "default" : getTeamStatus(team) === "En attente" ? "secondary" : "destructive"}>
                {getTeamStatus(team)}
              </Badge>
            </TableCell>
          </TableRow>
        )) : defaultTeams.map((team) => (
          <TableRow key={team.name}>
            <TableCell className="font-medium">{team.name}</TableCell>
            <TableCell>{team.leader}</TableCell>
            <TableCell>{team.members}</TableCell>
            <TableCell>{team.certifications}</TableCell>
            <TableCell>
              <Badge variant={team.status === "À jour" ? "default" : "secondary"}>
                {team.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}