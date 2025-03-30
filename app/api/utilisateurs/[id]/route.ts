import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ROLES } from "@/lib/rbac";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";

// GET /api/utilisateurs/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { 
        entrepriseId: true,
        role: true,
        id: true,
        equipesMembre: { select: { id: true } },
        equipesResponsable: { select: { id: true } }
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = params.id;
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        formations: {
          select: {
            id: true,
            type_formation: true,
            nom: true,
            date_expiration: true,
            date_delivrance: true,
            obligatoire: true
          }
        },
        equipesMembre: {
          select: {
            id: true,
            nom: true
          }
        },
        equipesResponsable: {
          select: {
            id: true,
            nom: true
          }
        },
        entreprise: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const isOwnProfile = user.id === currentUser.id;
    const isTeamLead = user.equipesMembre.some(team => 
      currentUser.equipesResponsable.some(respTeam => respTeam.id === team.id)
    );
    const shouldShowFullDetails = currentUser.role === ROLES.ADMIN || isOwnProfile || isTeamLead;

    const filteredUser = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      equipesMembre: user.equipesMembre,
      equipesMembreIds: user.equipesMembre.map(team => team.id),
      equipesResponsable: user.equipesResponsable,
      equipesResponsableIds: user.equipesResponsable.map(team => team.id),
      entreprise: user.entreprise,
      ...(shouldShowFullDetails ? {
        telephone: user.telephone,
        adresse: user.adresse,
        formations: user.formations,
        num_securite_sociale: user.num_securite_sociale
      } : {
        formations: user.formations.filter(f => f.obligatoire)
      })
    };

    return NextResponse.json(filteredUser);
  } catch (error) {
    console.error('Erreur GET utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

function validateUpdateData(data: any) {
  const errors: { field: string; message: string }[] = [];

  if (data.nom && data.nom.trim().length < 2) {
    errors.push({ field: 'nom', message: 'Le nom doit contenir au moins 2 caractères' });
  }

  if (data.prenom && data.prenom.trim().length < 2) {
    errors.push({ field: 'prenom', message: 'Le prénom doit contenir au moins 2 caractères' });
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Email invalide' });
    }
  }

  if (data.password && data.password.length < 8) {
    errors.push({ field: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  if (data.role && !Object.values(ROLES).includes(data.role)) {
    errors.push({ field: 'role', message: 'Rôle invalide' });
  }

  return errors;
}

// PUT /api/utilisateurs/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('--- Début PUT /api/utilisateurs/:id ---');
  console.log('Params:', params);
  
  try {
    // 1. Vérification session
    console.log('Vérification session...');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Erreur: Non autorisé - Session invalide');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.log('Session OK - User:', session.user.email);

    // 2. Récupération currentUser
    console.log('Récupération utilisateur courant...');
    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { 
        entrepriseId: true,
        role: true,
        id: true,
        equipesResponsable: { select: { id: true } }
      }
    });

    if (!currentUser) {
      console.log('Erreur: Utilisateur courant non trouvé');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    console.log('CurrentUser trouvé:', currentUser.id);

    // 3. Parsing du body
    console.log('Parsing du body...');
    const body = await request.json();
    console.log('Body reçu:', JSON.stringify(body, null, 2));
    
    const { 
      password, 
      equipesMembreIds = [], 
      equipesResponsableIds = [], 
      ...updateData 
    } = body;
    
    console.log('Données extraites:', {
      equipesMembreIds,
      equipesResponsableIds,
      updateData
    });

    // 4. Validation des données
    console.log('Validation des données...');
    const validationErrors = validateUpdateData(body);
    if (validationErrors.length > 0) {
      console.log('Erreurs de validation:', validationErrors);
      return NextResponse.json({ 
        error: 'Données invalides',
        details: validationErrors 
      }, { status: 400 });
    }
    console.log('Validation OK');

    // 5. Vérification utilisateur à mettre à jour
    console.log('Recherche utilisateur à mettre à jour...');
    const userId = params.id;
    const userToUpdate = await prisma.utilisateur.findUnique({
      where: { id: userId }
    });

    if (!userToUpdate) {
      console.log('Erreur: Utilisateur à mettre à jour non trouvé');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    console.log('Utilisateur trouvé:', userToUpdate.email);

    // 6. Vérification des permissions
    console.log('Vérification permissions...');
    if (currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.REPRESENTANT && currentUser.id !== userId) {
      console.log('Erreur: Permission refusée - currentUser:', currentUser.role, 'target:', userId);
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    console.log('Permissions OK');

    // 7. Vérification email unique
    if (updateData.email && updateData.email !== userToUpdate.email) {
      console.log('Vérification unicité email...');
      const existingUser = await prisma.utilisateur.findUnique({
        where: { email: updateData.email }
      });
      if (existingUser) {
        console.log('Erreur: Email déjà utilisé par:', existingUser.id);
        return NextResponse.json({ 
          error: 'Email déjà utilisé',
          field: 'email'
        }, { status: 400 });
      }
      console.log('Email unique OK');
    }

    // 8. Validation des équipes
    console.log('Validation des équipes...');
    const allTeamIds = [...equipesMembreIds, ...equipesResponsableIds];
    console.log('IDs équipes à vérifier:', allTeamIds);
    
    if (allTeamIds.length > 0) {
      const teamsCount = await prisma.equipe.count({
        where: { 
          id: { in: allTeamIds },
          entrepriseId: currentUser.entrepriseId
        }
      });

      console.log('Équipes trouvées:', teamsCount, '/', allTeamIds.length);
      
      if (teamsCount !== allTeamIds.length) {
        console.log('Erreur: Équipes manquantes');
        return NextResponse.json({ 
          error: 'Une ou plusieurs équipes n\'existent pas'
        }, { status: 400 });
      }
    }
    console.log('Validation équipes OK');

    // 9. Vérification des doublons
    console.log('Vérification doublons équipes...');
    const duplicateTeams = equipesMembreIds.filter((id: any) => 
      equipesResponsableIds.includes(id)
    );
    if (duplicateTeams.length > 0) {
      console.log('Erreur: Doublons détectés:', duplicateTeams);
      return NextResponse.json({ 
        error: `L'utilisateur ne peut pas être membre et responsable des mêmes équipes: ${duplicateTeams.join(', ')}`
      }, { status: 400 });
    }
    console.log('Aucun doublon détecté');

    // 10. Hash password si fourni
    if (password) {
      console.log('Hachage du mot de passe...');
      updateData.password = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 4
      });
      console.log('Mot de passe hashé');
    }

    // 11. Mise à jour de l'utilisateur
    console.log('Début transaction de mise à jour...');
    const updatedUser = await prisma.$transaction(async (prisma) => {
      const updatePayload: Prisma.UtilisateurUpdateInput = {
        ...updateData,
        equipesMembre: { set: equipesMembreIds.map((id: any) => ({ id })) },
        equipesResponsable: { set: equipesResponsableIds.map((id: any) => ({ id })) }
      };

      console.log('Payload de mise à jour:', JSON.stringify(updatePayload, null, 2));
      
      const result = await prisma.utilisateur.update({
        where: { id: userId },
        data: updatePayload,
        include: {
          formations: true,
          equipesMembre: { select: { id: true, nom: true } },
          equipesResponsable: { select: { id: true, nom: true } },
          entreprise: { select: { id: true, nom: true } }
        }
      });
      
      console.log('Mise à jour réussie:', result.id);
      return result;
    });

    // 12. Formatage de la réponse
    console.log('Formatage réponse...');
    const { password: _, ...responseUser } = {
      ...updatedUser,
      equipesMembreIds: updatedUser.equipesMembre.map(t => t.id),
      equipesResponsableIds: updatedUser.equipesResponsable.map(t => t.id)
    };

    console.log('--- Fin PUT /api/utilisateurs/:id - Succès ---');
    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('--- Erreur PUT /api/utilisateurs/:id ---');
    console.error('Erreur complète:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Erreur Prisma:', {
        code: error.code,
        meta: error.meta,
        message: error.message
      });
      
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Violation de contrainte unique',
          details: error.meta
        }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// DELETE /api/utilisateurs/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { role: true, id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (currentUser.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = params.id;
    await prisma.utilisateur.delete({ where: { id: userId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erreur DELETE utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}