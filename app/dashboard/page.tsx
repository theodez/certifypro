"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamOverviewTable } from "@/components/team-overview"
import { UpcomingAppointments } from "@/components/upcoming-appointments"
import { QuoteOverview } from "@/components/quote-overview"
import { TrainingStatusChart } from "@/components/training-status-chart"
import { Users, AlignCenterVertical as Certificate, AlertTriangle, Calendar, Loader2 } from "lucide-react"
import { DonutChart } from "@/components/ui/rosencharts";


interface Formation {
  id: string;
  type: string;
  name: string;
  expirationDate: string | null;
  deliveryDate: string | null;
  isRequired: boolean;
  status: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  formations?: Formation[];
}

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
  code: string;
  leads: TeamLead[];
  memberCount: number;
  complianceRate: number;
  validCount: number;
  warningCount: number;
  expiredCount: number;
  formationsObligatoires: number;
  members: Member[];
}

interface TeamResponse {
  teams: Team[];
  stats: {
    totalTeams: number;
    totalMembers: number;
    averageCompliance: number;
    compliantTeams: number;
    atRiskTeams: number;
  };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeCertifications: 0,
    urgentRenewals: 0,
    plannedTrainings: 0,
    employeeGrowth: 0,
    complianceRate: 0
  });
  const [teamsData, setTeamsData] = useState<Team[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      
      try {
        // Fetch teams data
        const teamsResponse = await fetch('/api/equipes');
        if (!teamsResponse.ok) throw new Error('Erreur lors du chargement des équipes');
        const teamsData: TeamResponse = await teamsResponse.json();
        setTeamsData(teamsData.teams);
        
        // Extract statistics from the teams data
        const totalEmployees = teamsData.stats.totalMembers || 0;
        const complianceRate = teamsData.stats.averageCompliance || 0;
        
        // Calculate certifications and renewals
        let activeCerts = 0;
        let urgentRenewals = 0;
        
        teamsData.teams.forEach((team) => {
          team.members.forEach((member) => {
            member.formations?.forEach((formation) => {
              if (formation.status === "Valide") activeCerts++;
              if (formation.status === "À renouveler") urgentRenewals++;
            });
          });
        });
        
        // Update state with all statistics
        setStats({
          totalEmployees,
          activeCertifications: activeCerts,
          urgentRenewals,
          plannedTrainings: 8, // This would need a separate API for training schedules
          employeeGrowth: 4, // This might need a time-series API
          complianceRate
        });
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.employeeGrowth}% depuis le mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certifications Actives</CardTitle>
            <Certificate className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCertifications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.complianceRate}% de conformité
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renouvellements Urgents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentRenewals}</div>
            <p className="text-xs text-muted-foreground">
              À renouveler dans les 30 jours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formations Planifiées</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.plannedTrainings}</div>
            <p className="text-xs text-muted-foreground">
              Pour le mois en cours
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>État des Formations par Équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <TrainingStatusChart teamsData={teamsData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Aperçu des Équipes</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamOverviewTable teams={teamsData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prochains Rendez-vous</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingAppointments />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Propositions de Devis</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteOverview />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}