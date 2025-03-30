"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { Loader2, User, Mail, Phone, MapPin, Shield, Users, Calendar, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getFormationStatus } from "@/lib/utils/formation";
import Select from "react-select";

interface Team {
  id: string;
  name: string;
}

interface Formation {
  id: string;
  type_formation: string;
  nom: string;
  date_expiration: Date | null;
  date_delivrance: Date | null;
  obligatoire: boolean;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  role: string;
  num_securite_sociale: string | null;
  equipesMembre: {
    id: string;
    nom: string;
  }[];
  equipesResponsable: {
    id: string;
    nom: string;
  }[];
  formations: Formation[];
}

interface FormErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  num_securite_sociale?: string;
}

const EmployeeDetails = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    role: "employe",
    equipesMembreIds: [] as string[],
    equipesResponsableIds: [] as string[],
    num_securite_sociale: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les équipes
        const teamsResponse = await fetch('/api/equipes');
        if (!teamsResponse.ok) throw new Error('Erreur lors du chargement des équipes');
        const teamsData = await teamsResponse.json();
        setTeams(teamsData.teams);

        // Charger l'employé
        const employeeResponse = await fetch(`/api/utilisateurs/${params.id}`);
        if (!employeeResponse.ok) throw new Error('Erreur lors du chargement des données');
        const employeeData = await employeeResponse.json();
        
        setEmployee(employeeData);
        setFormData({
          nom: employeeData.nom,
          prenom: employeeData.prenom,
          email: employeeData.email,
          telephone: employeeData.telephone || "",
          adresse: employeeData.adresse || "",
          role: employeeData.role,
          equipesMembreIds: employeeData.equipesMembre?.map((team: any) => team.id) || [],
          equipesResponsableIds: employeeData.equipesResponsable?.map((team: any) => team.id) || [],
          num_securite_sociale: employeeData.num_securite_sociale || ""
        });
      } catch (error) {
        console.error('Erreur:', error);
        toast.error(error instanceof Error ? error.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (formData.nom.trim().length < 2) newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    if (formData.prenom.trim().length < 2) newErrors.prenom = "Le prénom doit contenir au moins 2 caractères";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) newErrors.email = "Email invalide";
    
    if (formData.telephone) {
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      if (!phoneRegex.test(formData.telephone)) newErrors.telephone = "Numéro de téléphone invalide";
    }
    
    if (formData.num_securite_sociale) {
      const numSecuRegex = /^[12]\d{2}(0[1-9]|1[0-2])(2A|2B|\d{2}|9[78])\d{8}$/;
      if (!numSecuRegex.test(formData.num_securite_sociale)) {
        newErrors.num_securite_sociale = "Numéro de sécurité sociale invalide";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSaving(true);

    try {
      const response = await fetch(`/api/utilisateurs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // On envoie les deux listes d'équipes séparément
          equipesMembreIds: formData.equipesMembreIds,
          equipesResponsableIds: formData.equipesResponsableIds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      const updatedEmployee = await response.json();
      setEmployee(updatedEmployee);
      setIsEditing(false);
      toast.success("Modifications enregistrées");
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Employé non trouvé</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={undefined} />
            <AvatarFallback>{getInitials(employee.nom, employee.prenom)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{employee.prenom} {employee.nom}</h1>
            <p className="text-muted-foreground">{employee.email}</p>
          </div>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Annuler" : "Modifier"}
        </Button>
      </div>

      <Tabs defaultValue="informations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="formations">Formations</TabsTrigger>
        </TabsList>

        <TabsContent value="informations">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="prenom">Prénom *</Label>
                        <Input
                          id="prenom"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          className={errors.prenom ? "border-red-500" : ""}
                        />
                        {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
                      </div>
                      <div>
                        <Label htmlFor="nom">Nom *</Label>
                        <Input
                          id="nom"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          className={errors.nom ? "border-red-500" : ""}
                        />
                        {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                          id="telephone"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleChange}
                          className={errors.telephone ? "border-red-500" : ""}
                          placeholder="0612345678"
                        />
                        {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role">Rôle *</Label>
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="employe">Employé</option>
                          <option value="representant">Représentant</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                      
                      {/* Sélecteur pour les équipes membres */}
                      <div>
                        <Label>Équipes Membre</Label>
                        <Select
                          isMulti
                          options={teams.map(team => ({
                            value: team.id,
                            label: team.name
                          }))}
                          value={teams
                            .filter(team => formData.equipesMembreIds.includes(team.id))
                            .map(team => ({
                              value: team.id,
                              label: team.name
                            }))}
                          onChange={(selected) => {
                            const selectedIds = selected ? selected.map((option: any) => option.value) : [];
                            setFormData(prev => ({ 
                              ...prev, 
                              equipesMembreIds: selectedIds,
                              // Retirer des responsables si ajouté aux membres
                              equipesResponsableIds: prev.equipesResponsableIds
                                .filter(id => !selectedIds.includes(id))
                            }));
                          }}
                          placeholder="Sélectionner les équipes"
                          classNamePrefix="react-select"
                        />
                      </div>

                      {/* Sélecteur pour les équipes responsables */}
                      <div>
                        <Label>Équipes Responsable</Label>
                        <Select
                          isMulti
                          options={teams.map(team => ({
                            value: team.id,
                            label: team.name
                          }))}
                          value={teams
                            .filter(team => formData.equipesResponsableIds.includes(team.id))
                            .map(team => ({
                              value: team.id,
                              label: team.name
                            }))}
                          onChange={(selected) => {
                            const selectedIds = selected ? selected.map((option: any) => option.value) : [];
                            setFormData(prev => ({ 
                              ...prev, 
                              equipesResponsableIds: selectedIds,
                              // Retirer des membres si ajouté aux responsables
                              equipesMembreIds: prev.equipesMembreIds
                                .filter(id => !selectedIds.includes(id))
                            }));
                          }}
                          placeholder="Sélectionner les équipes"
                          classNamePrefix="react-select"
                        />
                      </div>

                      <div>
                        <Label htmlFor="num_securite_sociale">Numéro de sécurité sociale</Label>
                        <Input
                          id="num_securite_sociale"
                          name="num_securite_sociale"
                          value={formData.num_securite_sociale}
                          onChange={handleChange}
                          className={errors.num_securite_sociale ? "border-red-500" : ""}
                          placeholder="186092512345678"
                        />
                        {errors.num_securite_sociale && (
                          <p className="text-red-500 text-sm mt-1">{errors.num_securite_sociale}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Textarea
                      id="adresse"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enregistrer
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <span className="font-semibold">Prénom</span>
                    <span>{employee.prenom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Nom</span>
                    <span>{employee.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Email</span>
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Téléphone</span>
                    <span>{employee.telephone || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Rôle</span>
                    <span>{employee.role}</span>
                  </div>
                  
                  {/* Affichage des équipes membres */}
                  <div className="flex justify-between">
                    <span className="font-semibold">Équipes Membre</span>
                    <div className="flex flex-wrap gap-2">
                      {employee.equipesMembre.length > 0 ? (
                        employee.equipesMembre.map(team => (
                          <span key={team.id} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm">
                            {team.nom}
                          </span>
                        ))
                      ) : (
                        <span>Aucune équipe</span>
                      )}
                    </div>
                  </div>

                  {/* Affichage des équipes responsables */}
                  <div className="flex justify-between">
                    <span className="font-semibold">Équipes Responsable</span>
                    <div className="flex flex-wrap gap-2">
                      {employee.equipesResponsable.length > 0 ? (
                        employee.equipesResponsable.map(team => (
                          <span key={team.id} className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm">
                            {team.nom} (Responsable)
                          </span>
                        ))
                      ) : (
                        <span>Aucune équipe</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold">Numéro de sécurité sociale</span>
                    <span>{employee.num_securite_sociale || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Adresse</span>
                    <span>{employee.adresse || "Non renseignée"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formations">
          <Card>
            <CardHeader>
              <CardTitle>Formations</CardTitle>
              <CardDescription>Liste des formations de l'employé</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.formations.length > 0 ? (
                  employee.formations.map(formation => (
                    <div key={formation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{formation.nom}</h4>
                          <p className="text-sm text-muted-foreground">
                            Type: {formation.type_formation}
                          </p>
                        </div>
                        <StatusBadge status={getFormationStatus(formation.date_expiration)} />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Délivrée le:</p>
                          <p>
                            {formation.date_delivrance ? 
                              new Date(formation.date_delivrance).toLocaleDateString() : 
                              "Non spécifiée"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expire le:</p>
                          <p>
                            {formation.date_expiration ? 
                              new Date(formation.date_expiration).toLocaleDateString() : 
                              "Non spécifiée"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">Aucune formation</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDetails;