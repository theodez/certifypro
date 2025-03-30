import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getFormationStatus } from '@/lib/utils/formation';
import { ROLES } from "@/lib/rbac";
import argon2 from "argon2";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const team = searchParams.get('team');
    const sortBy = searchParams.get('sortBy') || 'nom';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    // Modification: Remplacer equipeId par equipesMembre
    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { 
        entrepriseId: true,
        role: true,
        id: true,
        equipesMembre: { select: { id: true } }
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    let baseWhere: Prisma.UtilisateurWhereInput = {
      entrepriseId: currentUser.entrepriseId,
    };

    if (search) {
      baseWhere.OR = [
        { nom: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { prenom: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
      ];
    }

    // Modification: Adapter le filtre d'équipe
    if (team) {
      baseWhere = {
        ...baseWhere,
        equipesMembre: {
          some: {
            nom: {
              equals: team,
              mode: 'insensitive' as Prisma.QueryMode
            }
          }
        }
      };
    }

    // Modification: Adapter le filtrage pour les représentants
    if (currentUser.role === ROLES.REPRESENTANT) {
      baseWhere = {
        ...baseWhere,
        OR: [
          { id: currentUser.id },
          { 
            equipesMembre: { 
              some: { 
                id: { in: currentUser.equipesMembre.map(e => e.id) } 
              } 
            } 
          }
        ]
      };
    }

    let orderBy: Prisma.UtilisateurOrderByWithRelationInput = {};
    
    if (sortBy === 'equipe.nom') {
      orderBy = { equipesMembre: { _count: sortOrder } };
    } else if (['nom', 'prenom', 'email', 'role'].includes(sortBy)) {
      orderBy = { [sortBy]: sortOrder };
    } else {
      orderBy = { nom: 'asc' };
    }

    const total = await prisma.utilisateur.count({
      where: baseWhere
    });

    // Modification: Adapter l'include pour les relations many-to-many
    const utilisateurs = await prisma.utilisateur.findMany({
      where: baseWhere,
      include: {
        formations: {
          select: {
            id: true,
            nom: true,
            date_expiration: true,
            obligatoire: true
          }
        },
        equipesMembre: {
          select: {
            id: true,
            nom: true,
            responsables: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Modification: Adapter le filtrage des informations sensibles
    const filteredUtilisateurs = utilisateurs.map(user => {
      const isOwnProfile = user.id === currentUser.id;
      const isTeamLead = user.equipesMembre.some(team => 
        team.responsables?.some(resp => resp.id === currentUser.id)
      );
      const shouldShowFullDetails = currentUser.role === ROLES.ADMIN || isOwnProfile || isTeamLead;

      return {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        equipe: user.equipesMembre[0], // Conserver la première équipe pour la compatibilité
        ...(shouldShowFullDetails ? {
          telephone: user.telephone,
          adresse: user.adresse,
          formations: user.formations
        } : {
          formations: user.formations.filter(f => f.obligatoire)
        })
      };
    });

    return NextResponse.json({
      utilisateurs: filteredUtilisateurs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
        equipesResponsable: { select: { id: true } } // Vérifier les équipes dont l'utilisateur est responsable
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Seuls les admins peuvent créer des utilisateurs
    if (currentUser.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      password, 
      equipesMembreIds = [], 
      equipesResponsableIds = [], 
      ...userData 
    } = body;

    // Validation des données
    const validationErrors = validateUserData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: validationErrors 
      }, { status: 400 });
    }

    // Vérifier l'unicité de l'email
    const existingUser = await prisma.utilisateur.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email déjà utilisé',
        field: 'email'
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur a le droit d'assigner ces équipes
    const allTeamIds = [...equipesMembreIds, ...equipesResponsableIds];
    if (allTeamIds.length > 0) {
      const teams = await prisma.equipe.findMany({
        where: { 
          id: { in: allTeamIds },
          entrepriseId: currentUser.entrepriseId
        },
        select: { id: true }
      });

      const existingTeamIds = teams.map(t => t.id);
      const missingTeams = allTeamIds.filter(id => !existingTeamIds.includes(id));

      if (missingTeams.length > 0) {
        return NextResponse.json({ 
          error: `Les équipes suivantes n'existent pas ou ne font pas partie de votre entreprise: ${missingTeams.join(', ')}`,
          field: 'equipesIds'
        }, { status: 400 });
      }
    }

    // Hasher le mot de passe avec Argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 4
    });

    // Créer l'utilisateur avec transaction
    const newUser = await prisma.$transaction(async (prisma) => {
      const user = await prisma.utilisateur.create({
        data: {
          ...userData,
          password: hashedPassword,
          entrepriseId: currentUser.entrepriseId,
          // Connecter aux équipes comme membre
          ...(equipesMembreIds.length > 0 && {
            equipesMembre: {
              connect: equipesMembreIds.map((id: string) => ({ id }))
            }
          }),
          // Connecter aux équipes comme responsable
          ...(equipesResponsableIds.length > 0 && {
            equipesResponsable: {
              connect: equipesResponsableIds.map((id: string) => ({ id }))
            }
          })
        }
      });

      return user;
    });

    // Récupérer l'utilisateur avec toutes ses relations
    const userWithRelations = await prisma.utilisateur.findUnique({
      where: { id: newUser.id },
      include: {
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
        }
      }
    });

    if (!userWithRelations) {
      throw new Error('Utilisateur non trouvé après création');
    }

    // Nettoyer les données sensibles avant de les renvoyer
    const { password: _, ...filteredUser } = userWithRelations;

    return NextResponse.json(filteredUser, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Une contrainte unique a été violée',
          details: error.meta
        }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}

function validateUserData(data: any) {
  const errors: { field: string; message: string }[] = [];

  if (!data.nom || data.nom.trim().length < 2) {
    errors.push({ field: 'nom', message: 'Le nom doit contenir au moins 2 caractères' });
  }

  if (!data.prenom || data.prenom.trim().length < 2) {
    errors.push({ field: 'prenom', message: 'Le prénom doit contenir au moins 2 caractères' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push({ field: 'email', message: 'Email invalide' });
  }

  if (!data.password || data.password.length < 8) {
    errors.push({ field: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  if (!data.role || !Object.values(ROLES).includes(data.role)) {
    errors.push({ field: 'role', message: 'Rôle invalide' });
  }

  if (data.num_securite_sociale && !/^\d{13}$/.test(data.num_securite_sociale)) {
    errors.push({ field: 'num_securite_sociale', message: 'Le numéro de sécurité sociale doit contenir 13 chiffres' });
  }

  return errors;
}