import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getFormationStatus } from "@/lib/utils/formation";
import { ROLES } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Récupérer l'utilisateur connecté avec ses relations d'équipe
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
      return new NextResponse("Utilisateur non trouvé", { status: 404 });
    }

    // Construire la requête de base
    const baseQuery: { where: Prisma.EquipeWhereInput } = {
      where: {
        entrepriseId: currentUser.entrepriseId,
        actif: true
      }
    };

    // Si l'utilisateur est un représentant, filtrer ses équipes
    if (currentUser.role === ROLES.REPRESENTANT) {
      baseQuery.where = {
        AND: [
          { entrepriseId: currentUser.entrepriseId },
          { actif: true },
          {
            OR: [
              { responsables: { some: { id: currentUser.id } } },
              { membres: { some: { id: currentUser.id } } }
            ]
          }
        ]
      };
    }

    // Récupérer les équipes avec leurs membres et responsables
    const equipes = await prisma.equipe.findMany({
      ...baseQuery,
      include: {
        responsables: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            role: true
          }
        },
        membres: {
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
            }
          }
        }
      }
    });

    // Calculer les statistiques pour chaque équipe
    const teamsWithStats = equipes.map(equipe => {
      const teamUsers = equipe.membres || [];
      const totalFormations = teamUsers.reduce((acc, user) => acc + (user.formations?.length || 0), 0);
      
      let validCount = 0;
      let warningCount = 0;
      let expiredCount = 0;
      let formationsObligatoires = 0;

      teamUsers.forEach(user => {
        user.formations?.forEach(formation => {
          if (formation.obligatoire) formationsObligatoires++;
          const status = getFormationStatus(formation.date_expiration);
          if (status === "Valide") validCount++;
          if (status === "À renouveler") warningCount++;
          if (status === "Expirée") expiredCount++;
        });
      });

      const complianceRate = formationsObligatoires > 0 
        ? Math.round((validCount / formationsObligatoires) * 100) 
        : 0;

      const leads = equipe.responsables.map(resp => ({
        id: resp.id,
        name: `${resp.prenom} ${resp.nom}`,
        email: resp.email,
        phone: resp.telephone,
        role: resp.role
      }));

      return {
        id: equipe.id,
        name: equipe.nom,
        code: equipe.code,
        leads,
        memberCount: teamUsers.length,
        complianceRate,
        validCount,
        warningCount,
        expiredCount,
        formationsObligatoires,
        members: teamUsers.map(user => ({
          id: user.id,
          name: `${user.prenom} ${user.nom}`,
          email: user.email,
          phone: user.telephone,
          role: user.role,
          formations: user.formations?.map(formation => ({
            id: formation.id,
            type: formation.type_formation,
            name: formation.nom,
            expirationDate: formation.date_expiration,
            deliveryDate: formation.date_delivrance,
            isRequired: formation.obligatoire,
            status: getFormationStatus(formation.date_expiration)
          }))
        }))
      };
    });

    // Calculer les statistiques globales
    const totalTeams = teamsWithStats.length;
    const totalMembers = teamsWithStats.reduce((acc, team) => acc + team.memberCount, 0);
    const averageCompliance = totalTeams > 0 
      ? Math.round(teamsWithStats.reduce((acc, team) => acc + team.complianceRate, 0) / totalTeams)
      : 0;
    const compliantTeams = teamsWithStats.filter(team => team.complianceRate >= 90).length;
    const atRiskTeams = teamsWithStats.filter(team => team.complianceRate < 70).length;

    return NextResponse.json({
      teams: teamsWithStats,
      stats: {
        totalTeams,
        totalMembers,
        averageCompliance,
        compliantTeams,
        atRiskTeams
      }
    });
  } catch (error) {
    console.error("[EQUIPES]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Récupérer l'utilisateur connecté
    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { 
        entrepriseId: true,
        role: true,
        id: true
      }
    });

    if (!currentUser) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 });
    }

    // Vérifier les permissions (admin ou représentant)
    if (![ROLES.ADMIN, ROLES.REPRESENTANT].includes(currentUser.role)) {
      return new NextResponse("Non autorisé", { status: 403 });
    }

    const body = await request.json();
    const { nom, membresIds, responsablesIds, adresse } = body;

    // Validation des données
    if (!nom || nom.trim().length < 2) {
      return new NextResponse("Le nom de l'équipe doit contenir au moins 2 caractères", { status: 400 });
    }

    // Vérifier que tous les membres existent et appartiennent à la même entreprise
    const allUserIds = [...(membresIds || []), ...(responsablesIds || [])];
    if (allUserIds.length > 0) {
      const usersCount = await prisma.utilisateur.count({
        where: { 
          id: { in: allUserIds },
          entrepriseId: currentUser.entrepriseId
        }
      });

      if (usersCount !== allUserIds.length) {
        return new NextResponse("Un ou plusieurs utilisateurs n'existent pas ou ne sont pas dans votre entreprise", { status: 400 });
      }
    }

    // Vérifier que les responsables ont le bon rôle
    if (responsablesIds && responsablesIds.length > 0) {
      const responsables = await prisma.utilisateur.findMany({
        where: { 
          id: { in: responsablesIds },
          role: { notIn: [ROLES.ADMIN, ROLES.REPRESENTANT] }
        }
      });

      if (responsables.length > 0) {
        return new NextResponse("Les responsables doivent être des administrateurs ou représentants", { status: 400 });
      }
    }

    // Création de l'équipe avec transactions
    const newTeam = await prisma.$transaction(async (prisma) => {
      // Créer l'équipe de base
      const team = await prisma.equipe.create({
        data: {
          nom,
          entreprise: { connect: { id: currentUser.entrepriseId } },
          actif: true,
          code: generateTeamCode(),
          ...(adresse && { adresse }) // Ajout conditionnel de l'adresse
        }
      });

      // Connecter les membres et responsables
      const updatePromises = [];
      
      if (membresIds && membresIds.length > 0) {
        updatePromises.push(
          prisma.equipe.update({
            where: { id: team.id },
            data: {
              membres: {
                connect: membresIds.map((id: any) => ({ id }))
              }
            }
          })
        );
      }

      if (responsablesIds && responsablesIds.length > 0) {
        updatePromises.push(
          prisma.equipe.update({
            where: { id: team.id },
            data: {
              responsables: {
                connect: responsablesIds.map((id: any) => ({ id }))
              }
            }
          })
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      return team;
    });

    return NextResponse.json(newTeam, { status: 201 });

  } catch (error) {
    console.error("[EQUIPES_POST]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

// Fonction utilitaire pour générer un code d'équipe
function generateTeamCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}