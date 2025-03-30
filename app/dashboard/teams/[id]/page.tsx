"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { Loader2, Users, ChevronDown, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Select from 'react-select';
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: string;
  adresse: string | null;
  avatar?: string | null;
  formations: {
    id: string;
    type_formation: string;
    nom: string;
    date_expiration: Date | null;
    date_delivrance: Date | null;
    obligatoire: boolean;
  }[];
}

interface Team {
  id: string;
  nom: string;
  description: string | null;
  actif: boolean;
  code: string | null;
  qr_code: string | null;
  membres: User[];
  responsables: User[];
  entreprise: {
    id: string;
    nom: string;
  };
}

interface FormErrors {
  nom?: string;
  responsables?: string;
  general?: string;
}

const TeamDetails = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    responsablesIds: [] as string[],
    membresIds: [] as string[],
    actif: true,
  });

  useEffect(() => {
    console.log("Session actuelle:", session);
  }, [session]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Démarrage de fetchData pour l'équipe:", params.id);
      try {
        setLoading(true);
        setApiError(null);
        
        const teamResponse = await fetch(`/api/equipes/${params.id}`);
        
        console.log("Statut de réponse équipe:", teamResponse.status);
        
        if (!teamResponse.ok) {
          const errorData = await teamResponse.json();
          console.error("Erreur lors de la récupération de l'équipe:", errorData);
          throw new Error(errorData.error || "Échec lors de la récupération de l'équipe");
        }
        
        const teamData = await teamResponse.json();
        console.log("Données d'équipe reçues:", teamData);
        setTeam(teamData);
        
        const usersResponse = await fetch(`/api/utilisateurs?entrepriseId=${teamData.entreprise.id}`);
        
        console.log("Statut de réponse utilisateurs:", usersResponse.status);
        
        if (!usersResponse.ok) {
          const errorData = await usersResponse.json();
          console.error("Erreur lors de la récupération des utilisateurs:", errorData);
          throw new Error(errorData.error || "Échec lors de la récupération des utilisateurs");
        }
        
        const usersData = await usersResponse.json();
        console.log(`${usersData.utilisateurs?.length || 0} utilisateurs récupérés`);
        setAllUsers(usersData.utilisateurs || []);
        
        setFormData({
          nom: teamData.nom,
          description: teamData.description || "",
          responsablesIds: teamData.responsables?.map((r: User) => r.id) || [],
          membresIds: teamData.membres?.map((m: User) => m.id) || [],
          actif: teamData.actif
        });
        
        console.log("Formulaire initialisé:", {
          nom: teamData.nom,
          description: teamData.description,
          responsablesIds: teamData.responsables?.map((r: User) => r.id),
          membresIds: teamData.membres?.map((m: User) => m.id),
          actif: teamData.actif
        });
      } catch (error) {
        console.error('Erreur complète:', error);
        const message = error instanceof Error ? error.message : "Erreur lors du chargement des données";
        setApiError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const validateForm = (): boolean => {
    console.log("Validation du formulaire...");
    const newErrors: FormErrors = {};
    
    if (!formData.nom || formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom de l'équipe doit contenir au moins 2 caractères";
    }
    
    if (!formData.responsablesIds || formData.responsablesIds.length === 0) {
      newErrors.responsables = "Veuillez sélectionner au moins un responsable";
    }
    
    console.log("Erreurs de validation:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Soumission du formulaire...");
    
    setApiError(null);
    setApiResponse(null);
    
    if (!validateForm()) {
      console.log("Validation échouée, arrêt de la soumission");
      return;
    }
    
    setSaving(true);

    try {
      console.log("Préparation des données pour l'API...");
      const requestData = {
        nom: formData.nom,
        description: formData.description,
        responsablesIds: formData.responsablesIds,
        membresIds: formData.membresIds,
        actif: formData.actif,
      };
      
      console.log("Données envoyées à l'API:", JSON.stringify(requestData, null, 2));
      
      const response = await fetch(`/api/equipes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log("Statut de réponse reçu:", response.status);
      const responseData = await response.json();
      console.log("Données de réponse:", responseData);
      setApiResponse(responseData);

      if (!response.ok) {
        console.error("Erreur API:", responseData);
        throw new Error(responseData.error || "Erreur lors de la mise à jour de l'équipe");
      }

      setTeam(responseData);
      setIsEditing(false);
      toast.success("Équipe mise à jour avec succès");
    } catch (error) {
      console.error('Erreur complète:', error);
      const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      setApiError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleResponsablesChange = (selected: any) => {
    const ids = selected ? selected.map((option: any) => option.value) : [];
    console.log("Responsables sélectionnés:", ids);
    
    setFormData(prev => ({
      ...prev,
      responsablesIds: ids
    }));
    
    if (errors.responsables) {
      setErrors(prev => ({
        ...prev,
        responsables: undefined
      }));
    }
  };

  const handleMembresChange = (selected: any) => {
    const ids = selected ? selected.map((option: any) => option.value) : [];
    console.log("Membres sélectionnés:", ids);
    
    setFormData(prev => ({
      ...prev,
      membresIds: ids
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    console.log("Statut actif changé:", checked);
    
    setFormData(prev => ({
      ...prev,
      actif: checked
    }));
  };

  const getInitials = (nom: string, prenom: string) => {
    if (!nom || !prenom) return "??";
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  const userOptions = allUsers.map(user => ({
      value: user.id,
    label: `${user.prenom} ${user.nom} (${user.email})`,
    role: user.role
  }));

  const responsableOptions = userOptions.filter(option => 
    ['admin', 'representant'].includes(option.role)
  );

  const membreOptions = userOptions;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  if (apiError && !team) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {apiError}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard/teams')}>
          Retour à la liste des équipes
        </Button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Équipe non trouvée</p>
        <Button onClick={() => router.push('/dashboard/teams')} className="mt-4">
          Retour à la liste des équipes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{team.nom}</h1>
            <p className="text-muted-foreground">
              {team.entreprise.nom}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/teams')}>
            Retour à la liste
          </Button>
          {session?.user.role === 'admin' && (
          <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Annuler" : "Modifier"}
          </Button>
          )}
        </div>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {apiError}
          </AlertDescription>
        </Alert>
      )}

      {apiResponse && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <details>
            <summary className="cursor-pointer font-medium">
              Debug: Dernière réponse API
            </summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap max-h-96 overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <Tabs defaultValue="informations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="membres">Membres ({team.membres.length})</TabsTrigger>
          <TabsTrigger value="responsables">Responsables ({team.responsables.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="informations">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'équipe</CardTitle>
              <CardDescription>
                Gérez les informations de base de l'équipe {team.nom}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nom">Nom de l'équipe *</Label>
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
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description de l'équipe"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Responsables *</Label>
                      <Select
                        options={responsableOptions}
                        isMulti
                        value={responsableOptions.filter(option => 
                          formData.responsablesIds.includes(option.value)
                        )}
                        onChange={handleResponsablesChange}
                        className={`react-select-container ${errors.responsables ? "select-error" : ""}`}
                        classNamePrefix="react-select"
                        placeholder="Sélectionnez les responsables..."
                        noOptionsMessage={() => "Aucun utilisateur trouvé"}
                      />
                      {errors.responsables && (
                        <p className="text-red-500 text-sm mt-1">{errors.responsables}</p>
                      )}
                    </div>

                    <div>
                      <Label>Membres</Label>
                      <Select
                        options={membreOptions}
                        isMulti
                        value={membreOptions.filter(option => 
                          formData.membresIds.includes(option.value)
                        )}
                        onChange={handleMembresChange}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Sélectionnez les membres..."
                        noOptionsMessage={() => "Aucun utilisateur trouvé"}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="actif"
                        checked={formData.actif}
                        onCheckedChange={handleSwitchChange}
                      />
                      <Label htmlFor="actif">Équipe active</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                      Enregistrer
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">Nom</h3>
                      <p>{team.nom}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Statut</h3>
                      <p className={team.actif ? "text-green-600" : "text-red-600"}>
                        {team.actif ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Code</h3>
                      <p>{team.code || "Non défini"}</p>
                  </div>
                    <div>
                      <h3 className="font-semibold mb-1">Entreprise</h3>
                      <p>{team.entreprise.nom}</p>
                  </div>
                    <div className="col-span-2">
                      <h3 className="font-semibold mb-1">Description</h3>
                      <p>{team.description || "Aucune description"}</p>
                  </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membres">
          <Card>
            <CardHeader>
              <CardTitle>Membres de l'équipe</CardTitle>
              <CardDescription>{team.membres.length} membre(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.membres.length > 0 ? (
                  team.membres.map((membre) => (
                    <div key={membre.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={membre.avatar || undefined} />
                          <AvatarFallback>{getInitials(membre.nom, membre.prenom)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{membre.prenom} {membre.nom}</h4>
                          <p className="text-sm text-muted-foreground">{membre.email}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {membre.role}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">Aucun membre dans cette équipe</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsables">
          <Card>
            <CardHeader>
              <CardTitle>Responsables de l'équipe</CardTitle>
              <CardDescription>{team.responsables.length} responsable(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.responsables.length > 0 ? (
                  team.responsables.map((responsable) => (
                    <div key={responsable.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={responsable.avatar || undefined} />
                          <AvatarFallback>{getInitials(responsable.nom, responsable.prenom)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{responsable.prenom} {responsable.nom}</h4>
                          <p className="text-sm text-muted-foreground">{responsable.email}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {responsable.role}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">Aucun responsable pour cette équipe</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamDetails;