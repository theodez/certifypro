"use client"

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { 
  Search, 
  PlusCircle, 
  Filter, 
  UserCheck,
  ShieldAlert,
  ChevronDown,
  Users,
  ArrowRightCircle,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import TeamForm from "@/components/dashboard/TeamForm";

interface Team {
  id: string;
  name: string;
  code: string;
  leads: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  }[];
  memberCount: number;
  complianceRate: number;
  validCount: number;
  warningCount: number;
  expiredCount: number;
  formationsObligatoires: number;
}

interface Stats {
  totalTeams: number;
  totalMembers: number;
  averageCompliance: number;
  compliantTeams: number;
  atRiskTeams: number;
}

const Teams = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchTeams = useCallback(async () => {
    try {
      setTableLoading(true);
      const response = await fetch("/api/equipes");
      if (!response.ok) throw new Error("Erreur lors de la récupération des équipes");
      const data = await response.json();
      setTeams(data.teams);
      setStats(data.stats);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la récupération des équipes");
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = teams.filter(team => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      team.name.toLowerCase().includes(searchLower) ||
      team.leads.some(lead => lead.name.toLowerCase().includes(searchLower))
    );
  });

  const getTeamStatus = (team: Team) => {
    if (team.formationsObligatoires === 0) return "Valide";
    if (team.validCount === 0 && team.warningCount === 0 && team.expiredCount === 0) return "Valide";
    if (team.complianceRate >= 90) return "Valide";
    if (team.complianceRate >= 70) return "À renouveler";
    return "Expirée";
  };

  const getTeamComplianceRate = (team: Team) => {
    if (team.formationsObligatoires === 0 || (team.validCount === 0 && team.warningCount === 0 && team.expiredCount === 0)) {
      return 100;
    }
    return team.complianceRate;
  };

  const calculateStats = (teams: Team[]) => {
    const totalTeams = teams.length;
    const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0);
    const compliantTeams = teams.filter(team => getTeamComplianceRate(team) >= 90).length;
    const atRiskTeams = teams.filter(team => {
      const rate = getTeamComplianceRate(team);
      return rate < 70 && team.formationsObligatoires > 0;
    }).length;
    const averageCompliance = teams.reduce((sum, team) => sum + getTeamComplianceRate(team), 0) / totalTeams;

    return {
      totalTeams,
      totalMembers,
      averageCompliance: Math.round(averageCompliance),
      compliantTeams,
      atRiskTeams
    };
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "NA";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getTeamStatusColor = (team: Team) => {
    const status = getTeamStatus(team);
    switch (status) {
      case "Valide":
        return "border-l-4 border-status-valid";
      case "À renouveler":
        return "border-l-4 border-status-warning";
      case "Expirée":
        return "border-l-4 border-status-expired";
      default:
        return "";
    }
  };

  const currentStats = calculateStats(filteredTeams);

  const handleTeamCreated = () => {
    setShowAddTeamModal(false);
    fetchTeams();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{currentStats.totalTeams}</CardTitle>
              <CardDescription>Équipes totales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                {currentStats.totalMembers} employés
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{currentStats.averageCompliance}%</CardTitle>
              <CardDescription>Conformité moyenne</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={currentStats.averageCompliance} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{currentStats.compliantTeams}</CardTitle>
              <CardDescription>Équipes conformes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <UserCheck className="h-4 w-4 mr-1" />
                Taux de conformité &gt; 90%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{currentStats.atRiskTeams}</CardTitle>
              <CardDescription>Équipes à risque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <ShieldAlert className="h-4 w-4 mr-1" />
                Taux de conformité &lt; 70%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une équipe..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddTeamModal(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Créer une équipe
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <Card 
              key={team.id}
              className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                getTeamStatus(team) === "Valide"
                  ? "bg-glow-status-valid hover:border-status-valid/50"
                  : getTeamStatus(team) === "À renouveler"
                  ? "bg-glow-status-warning hover:border-status-warning/50"
                  : "bg-glow-status-expired hover:border-status-expired/50"
              }`}
            >
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                        Voir les employés
                      </DropdownMenuItem>
                      <DropdownMenuItem>Planifier une formation</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {team.leads.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {team.leads.slice(0, 3).map((lead) => (
                          <Avatar 
                            key={lead.id}
                            className="h-9 w-9 border-2 border-background shadow-md hover:z-10 hover:scale-110 transition-transform"
                          >
                            <AvatarImage src={undefined} alt={lead.name} />
                            <AvatarFallback className="text-xs font-medium bg-muted">
                              {getInitials(lead.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.leads.length > 3 && (
                          <div className="h-9 w-9 rounded-full border-2 border-background bg-accent flex items-center justify-center text-xs font-medium shadow-md">
                            +{team.leads.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium line-clamp-1">
                          {team.leads[0].name}
                        </span>
                        {team.leads.length > 1 && (
                          <span className="text-xs text-muted-foreground">
                            +{team.leads.length - 1} autres responsables
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <Avatar className="h-9 w-9 border-2 border-background">
                        <AvatarFallback className="text-xs bg-muted">NA</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">Non assigné</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Employés</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{team.memberCount}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <StatusBadge status={getTeamStatus(team)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      team.validCount > 0 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {team.validCount} valides
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      team.warningCount > 0 
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {team.warningCount} à renouveler
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      team.expiredCount > 0 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {team.expiredCount} expirées
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Conformité</span>
                    <span className={`font-medium ${
                      getTeamComplianceRate(team) >= 90 
                        ? "text-status-valid" 
                        : getTeamComplianceRate(team) >= 70 
                          ? "text-status-warning" 
                          : "text-status-expired"
                    }`}>
                      {getTeamComplianceRate(team)}%
                    </span>
                  </div>
                  <Progress 
                    value={getTeamComplianceRate(team)} 
                    className={`h-2 ${
                      getTeamComplianceRate(team) >= 90 
                        ? "bg-status-valid/10 [&>div]:bg-status-valid" 
                        : getTeamComplianceRate(team) >= 70 
                          ? "bg-status-warning/10 [&>div]:bg-status-warning" 
                          : "bg-status-expired/10 [&>div]:bg-status-expired"
                    }`}
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="w-full group-hover:border-primary/50 transition-colors" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                >
                  Voir les détails
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showAddTeamModal} onOpenChange={setShowAddTeamModal}>
        <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Créer une nouvelle équipe</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire ci-dessous pour créer une nouvelle équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TeamForm 
              onSuccess={handleTeamCreated} 
              onCancel={() => setShowAddTeamModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;