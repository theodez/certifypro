"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import Select from 'react-select';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string | null;
  adresse: string | null;
  avatar?: string | null;
}

interface FormErrors {
  nom?: string;
  responsables?: string;
}

const UserBadge = ({ user, onRemove }: { user: User, onRemove: () => void }) => (
  <div className="flex items-center gap-2 bg-accent rounded-full px-3 py-1">
    <Avatar className="h-6 w-6">
      <AvatarImage src={user.avatar || undefined} />
      <AvatarFallback>{user.prenom[0]}{user.nom[0]}</AvatarFallback>
    </Avatar>
    <span className="text-sm">
      {user.prenom} {user.nom}
    </span>
    <button 
      type="button" 
      onClick={onRemove}
      className="text-muted-foreground hover:text-foreground"
    >
      &times;
    </button>
  </div>
);

interface TeamFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TeamForm = ({ onSuccess, onCancel }: TeamFormProps) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    responsablesIds: [] as string[],
    membresIds: [] as string[],
    actif: true
  });

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/utilisateurs');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des utilisateurs');
        }
        const data = await response.json();
        setUsers(data.utilisateurs || []);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error("Impossible de charger les utilisateurs");
      }
    };

    fetchUsers();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom de l'équipe doit contenir au moins 2 caractères";
    }
    
    if (formData.responsablesIds.length === 0) {
      newErrors.responsables = "Veuillez sélectionner au moins un responsable";
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
      const response = await fetch('/api/equipes', {
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

      toast.success("L'équipe a été créée avec succès");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const selectedIds = selected ? selected.map((option: any) => option.value) : [];
    setFormData(prev => ({
      ...prev,
      responsablesIds: selectedIds,
      // Éviter qu'un utilisateur soit à la fois responsable et membre
      membresIds: prev.membresIds.filter(id => !selectedIds.includes(id))
    }));
    
    if (errors.responsables) {
      setErrors(prev => ({
        ...prev,
        responsables: undefined
      }));
    }
  };

  const handleMembresChange = (selected: any) => {
    const selectedIds = selected ? selected.map((option: any) => option.value) : [];
    setFormData(prev => ({
      ...prev,
      membresIds: selectedIds,
      // Éviter qu'un utilisateur soit à la fois responsable et membre
      responsablesIds: prev.responsablesIds.filter(id => !selectedIds.includes(id))
    }));
  };

  const getSelectedUsers = (ids: string[]) => {
    return users.filter(user => ids.includes(user.id));
  };

  const responsableOptions = users
    .filter(user => ['admin', 'representant'].includes(user.role))
    .map(user => ({
      value: user.id,
      label: `${user.prenom} ${user.nom} (${user.email})`
    }));

  const membreOptions = users
    .filter(user => !['admin', 'representant'].includes(user.role))
    .map(user => ({
      value: user.id,
      label: `${user.prenom} ${user.nom} (${user.email})`
    }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nom">Nom de l'équipe *</Label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className={errors.nom ? "border-red-500" : ""}
              placeholder="Ex: Équipe Commerciale"
            />
            {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
          </div>

          <div>
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Adresse de l'équipe"
            />
          </div>
        </div>

        <div>
          <Label>Responsables *</Label>
          <Select
            isMulti
            options={responsableOptions}
            value={responsableOptions.filter(option => 
              formData.responsablesIds.includes(option.value)
            )}
            onChange={handleResponsablesChange}
            placeholder="Sélectionner les responsables"
            className={errors.responsables ? "react-select-error" : ""}
            classNamePrefix="react-select"
          />
          {errors.responsables && <p className="text-red-500 text-sm mt-1">{errors.responsables}</p>}
          {formData.responsablesIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {getSelectedUsers(formData.responsablesIds).map(user => (
                <UserBadge
                  key={user.id}
                  user={user}
                  onRemove={() => handleResponsablesChange(
                    responsableOptions.filter(option => 
                      formData.responsablesIds.filter(id => id !== user.id).includes(option.value)
                    )
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Membres (ouvriers)</Label>
          <Select
            isMulti
            options={membreOptions}
            value={membreOptions.filter(option => 
              formData.membresIds.includes(option.value)
            )}
            onChange={handleMembresChange}
            placeholder="Sélectionner les membres"
            classNamePrefix="react-select"
          />
          {formData.membresIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1">
              {getSelectedUsers(formData.membresIds).map(user => (
                <UserBadge
                  key={user.id}
                  user={user}
                  onRemove={() => handleMembresChange(
                    membreOptions.filter(option => 
                      formData.membresIds.filter(id => id !== user.id).includes(option.value)
                    )
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer l'équipe
        </Button>
      </div>
    </form>
  );
};

export default TeamForm; 