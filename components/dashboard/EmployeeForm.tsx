"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Select from 'react-select';

interface Team {
  id: string;
  name: string;
  code: string;
}

interface FormErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  password?: string;
  equipesMembreIds?: string;
  equipesResponsableIds?: string;
}

interface EmployeeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const roleOptions = [
  { value: 'employe', label: 'Employé' },
  { value: 'representant', label: 'Représentant' },
  { value: 'admin', label: 'Administrateur' }
];

const EmployeeForm = ({ onSuccess, onCancel }: EmployeeFormProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
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
    num_securite_sociale: "",
    password: ""
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/equipes');
        if (!response.ok) throw new Error('Erreur lors du chargement des équipes');
        const data = await response.json();
        setTeams(data.teams);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error("Impossible de charger les équipes");
      }
    };

    fetchTeams();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    }
    
    if (formData.prenom.trim().length < 2) {
      newErrors.prenom = "Le prénom doit contenir au moins 2 caractères";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }
    
    if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/utilisateurs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      toast.success("L'utilisateur a été créé avec succès");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
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

  const handleRoleChange = (selectedOption: any) => {
    const value = selectedOption.value;
    setFormData(prev => ({
      ...prev,
      role: value,
      ...(value !== "representant" && value !== "admin" && {
        equipesResponsableIds: []
      })
    }));
  };

  const handleTeamsChange = (type: 'membre' | 'responsable', selectedOptions: any) => {
    const selectedIds = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
    setFormData(prev => ({
      ...prev,
      [type === 'membre' ? 'equipesMembreIds' : 'equipesResponsableIds']: selectedIds
    }));
  };

  const teamOptions = teams.map(team => ({
    value: team.id,
    label: `${team.name} (${team.code})`
  }));

  const selectedMemberOptions = teamOptions.filter(option => 
    formData.equipesMembreIds.includes(option.value)
  );

  const selectedResponsableOptions = teamOptions.filter(option => 
    formData.equipesResponsableIds.includes(option.value)
  );

  const selectedRoleOption = roleOptions.find(option => option.value === formData.role);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colonne gauche - Informations personnelles */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                className={errors.prenom ? "border-red-500" : ""}
              />
              {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="Ex: 06 12 34 56 78"
            />
          </div>
        </div>

        {/* Colonne droite - Informations professionnelles */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Textarea
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Adresse complète"
              rows={3}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="num_securite_sociale">Numéro de sécurité sociale</Label>
            <Input
              id="num_securite_sociale"
              name="num_securite_sociale"
              value={formData.num_securite_sociale}
              onChange={handleChange}
              placeholder="15 chiffres"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select
              id="role"
              options={roleOptions}
              value={selectedRoleOption}
              onChange={handleRoleChange}
              placeholder="Sélectionner un rôle"
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Équipes dont l'utilisateur est membre</Label>
            <Select
              isMulti
              options={teamOptions}
              value={selectedMemberOptions}
              onChange={(selected) => handleTeamsChange('membre', selected)}
              placeholder="Sélectionner les équipes"
              className={`react-select-container ${errors.equipesMembreIds ? 'border-red-500' : ''}`}
              classNamePrefix="react-select"
            />
            <p className="text-sm text-muted-foreground">
              Sélectionnez les équipes où l'utilisateur travaille comme membre
            </p>
            {errors.equipesMembreIds && <p className="text-red-500 text-sm mt-1">{errors.equipesMembreIds}</p>}
          </div>

          {(formData.role === "representant" || formData.role === "admin") && (
            <div className="space-y-2">
              <Label>Équipes dont l'utilisateur est responsable</Label>
              <Select
                isMulti
                options={teamOptions}
                value={selectedResponsableOptions}
                onChange={(selected) => handleTeamsChange('responsable', selected)}
                placeholder="Sélectionner les équipes"
                className={`react-select-container ${errors.equipesResponsableIds ? 'border-red-500' : ''}`}
                classNamePrefix="react-select"
              />
              <p className="text-sm text-muted-foreground">
                Un représentant/administrateur peut gérer des équipes sans en être membre
              </p>
              {errors.equipesResponsableIds && <p className="text-red-500 text-sm mt-1">{errors.equipesResponsableIds}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-w-[120px]"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer l'utilisateur
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;