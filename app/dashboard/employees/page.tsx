"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  Search,
  PlusCircle,
  Filter,
  Download,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Users,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFormationStatus, getUtilisateurStatus, FormationStatus } from '@/lib/utils/formation';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import EmployeeForm from "@/components/dashboard/EmployeeForm";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  equipeId: string | null;
  formations: {
    id: string;
    nom: string;
    date_expiration: Date | null;
  }[];
  equipe?: {
    nom: string;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 10;

const EmployeeRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-muted rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded"></div>
          <div className="h-3 w-24 bg-muted rounded"></div>
        </div>
      </div>
    </td>
    <td className="py-4 px-6"><div className="h-4 w-24 bg-muted rounded"></div></td>
    <td className="py-4 px-6"><div className="h-4 w-20 bg-muted rounded"></div></td>
    <td className="py-4 px-6">
      <div className="h-6 w-24 bg-muted rounded-full"></div>
    </td>
    <td className="py-4 px-6 text-right">
      <div className="flex justify-end">
        <div className="h-8 w-16 bg-muted rounded mr-2"></div>
        <div className="h-8 w-8 bg-muted rounded"></div>
      </div>
    </td>
  </tr>
);

const Employees = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'nom', direction: 'asc' });
  const [statsLoading, setStatsLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchEmployees = useCallback(async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(selectedTeam && { team: selectedTeam })
      });

      const response = await fetch(`/api/utilisateurs?${params}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des employés');

      const data = await response.json();
      setEmployees(data.utilisateurs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Impossible de charger les employés");
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  }, [currentPage, sortConfig, debouncedSearchTerm, selectedTeam]);

  useEffect(() => {
    if (session?.user) {
      fetchEmployees();
    }
  }, [session, fetchEmployees]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;
    try {
      const response = await fetch(`/api/utilisateurs/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast.success("L'employé a été supprimé");
      fetchEmployees();
    } catch (error) {
      toast.error("Impossible de supprimer l'employé");
    }
  };

  const getOverallStatus = (employee: Employee): FormationStatus => {
    return getUtilisateurStatus(employee.formations);
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  const [stats, setStats] = useState({
    totalEmployees: 0,
    validEmployees: 0,
    warningEmployees: 0,
    expiredEmployees: 0,
    complianceRate: 0,
    teamsCount: 0
  });

  useEffect(() => {
    const calculateStats = () => {
      setStatsLoading(true);
      const totalEmployees = pagination?.total || 0;
      const validEmployees = employees.filter(e => getOverallStatus(e) === "Valide").length;
      const warningEmployees = employees.filter(e => getOverallStatus(e) === "À renouveler").length;
      const expiredEmployees = employees.filter(e => getOverallStatus(e) === "Expirée").length;
      const complianceRate = totalEmployees ? (validEmployees / totalEmployees) * 100 : 0;
      const teamsCount = new Set(employees.map(e => e.equipe?.nom).filter(Boolean)).size;

      setStats({
        totalEmployees,
        validEmployees,
        warningEmployees,
        expiredEmployees,
        complianceRate,
        teamsCount
      });
      setStatsLoading(false);
    };

    calculateStats();
  }, [employees, pagination]);

  const teams = Array.from(new Set(employees.map(e => e.equipe?.nom).filter((nom): nom is string => nom !== undefined)));

  const renderStatsCard = (
    title: string | number,
    description: string,
    icon: React.ReactNode,
    extraContent?: React.ReactNode,
    className?: string
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`text-2xl font-bold ${className || ''}`}>
          {statsLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            title
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <div className="flex items-center text-sm text-muted-foreground">
            {icon}
            {extraContent}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const handleEmployeeCreated = () => {
    setShowAddEmployeeModal(false);
    fetchEmployees();
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderStatsCard(
            stats.totalEmployees,
            "Employés totaux",
            <Users className="h-4 w-4 mr-1" />,
            `Dans ${stats.teamsCount} équipes`
          )}

          {renderStatsCard(
            `${Math.round(stats.complianceRate)}%`,
            "Conformité moyenne",
            null,
            <Progress value={stats.complianceRate} className="h-2" />
          )}

          {renderStatsCard(
            stats.validEmployees,
            "Employés conformes",
            <UserCheck className="h-4 w-4 mr-1" />,
            "Formations à jour"
          )}

          {renderStatsCard(
            stats.expiredEmployees,
            "Employés à risque",
            <ShieldAlert className="h-4 w-4 mr-1" />,
            "Formations expirées"
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un employé..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedTeam || "all"}
              onValueChange={(value) => setSelectedTeam(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toutes les équipes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les équipes</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddEmployeeModal(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th
                      className="text-left font-medium py-4 px-6 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('nom')}
                    >
                      <div className="flex items-center gap-1">
                        Employé
                        <ArrowUpDown className="h-4 w-4" />
                        {sortConfig.key === 'nom' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="text-left font-medium py-4 px-6 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('equipe.nom')}
                    >
                      <div className="flex items-center gap-1">
                        Équipe
                        <ArrowUpDown className="h-4 w-4" />
                        {sortConfig.key === 'equipe.nom' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="text-left font-medium py-4 px-6 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-1">
                        Rôle
                        <ArrowUpDown className="h-4 w-4" />
                        {sortConfig.key === 'role' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="text-left font-medium py-4 px-6">Statut des formations</th>
                    <th className="text-right font-medium py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tableLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <EmployeeRowSkeleton key={index} />
                    ))
                  ) : (
                    employees.map((employee) => {
                      const formations = employee.formations || [];
                      const formationStatuses = formations.map(f => getFormationStatus(f.date_expiration));
                      const validCount = formationStatuses.filter(s => s === "Valide").length;
                      const warningCount = formationStatuses.filter(s => s === "À renouveler").length;
                      const expiredCount = formationStatuses.filter(s => s === "Expirée").length;
                      const overallStatus = getOverallStatus(employee);

                      return (
                        <tr
                          key={employee.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={undefined} alt={`${employee.prenom} ${employee.nom}`} />
                                <AvatarFallback>{getInitials(employee.nom, employee.prenom)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{`${employee.prenom} ${employee.nom}`}</div>
                                <div className="text-sm text-muted-foreground">{employee.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">{employee.equipe?.nom || "Sans équipe"}</td>
                          <td className="py-4 px-6">{employee.role}</td>
                          <td className="py-4 px-6">
                            {employee.formations.length > 0 ? (
                              <span className={cn(
                                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                                overallStatus === "Valide" && "bg-green-100 text-green-800",
                                overallStatus === "À renouveler" && "bg-yellow-100 text-yellow-800",
                                overallStatus === "Expirée" && "bg-red-100 text-red-800"
                              )}>
                                {overallStatus === "Valide" && "À jour"}
                                {overallStatus === "À renouveler" && "Bientôt expiré"}
                                {overallStatus === "Expirée" && "Expiré"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Aucune formation
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                              >
                                Voir
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/employees/${employee.id}/edit`)}
                                  >
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/employees/${employee.id}/formations/new`)}
                                  >
                                    Ajouter une formation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(employee.id)}
                                  >
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {pagination && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} employés
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {currentPage} sur {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajout d'employé */}
      <Dialog open={showAddEmployeeModal} onOpenChange={setShowAddEmployeeModal}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] w-[90vw] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
            <DialogTitle className="text-xl">Ajouter un nouvel employé</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire ci-dessous pour créer un nouvel employé.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <EmployeeForm 
              onSuccess={handleEmployeeCreated} 
              onCancel={() => setShowAddEmployeeModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
