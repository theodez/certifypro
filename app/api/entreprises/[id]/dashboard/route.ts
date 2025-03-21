import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES } from "@/lib/rbac";

// GET /api/entreprises/:id/dashboard
export async function GET(request: NextRequest) {
  const entrepriseId = request.nextUrl.pathname.split("/").at(-2); // Récupère l'ID depuis l'URL

  if (!entrepriseId) {
    return NextResponse.json({ error: "ID entreprise manquant" }, { status: 400 });
  }

  // Vérification de l'accès
  const accessError = await checkAccess(request, entrepriseId, ROLES.ADMIN);
  if (accessError) return accessError;

  try {
    // Récupération des statistiques
    const [
      totalUtilisateurs,
      totalEquipes,
      totalFormations,
      formationsExpirees,
      formationsAExpirer,
      utilisateursNonConfirmes,
      equipesNonConformes,
    ] = await Promise.all([
      prisma.utilisateur.count({ where: { entrepriseId } }),
      prisma.equipe.count({ where: { entrepriseId } }),
      prisma.formation.count({ where: { entrepriseId } }),
      prisma.formation.count({
        where: {
          entrepriseId,
          date_expiration: { lt: new Date() },
        },
      }),
      prisma.formation.count({
        where: {
          entrepriseId,
          date_expiration: {
            gt: new Date(),
            lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        },
      }),
      prisma.utilisateur.count({
        where: { entrepriseId, statut_user: "Recyclage requis" },
      }),
      prisma.equipe.count({
        where: { entrepriseId, statut_team: "Recyclage requis" },
      }),
    ]);

    // Récupération des formations récentes
    const recentFormations = await prisma.formation.findMany({
      where: { entrepriseId },
      select: {
        id: true,
        nom: true,
        type_formation: true,
        date_delivrance: true,
        date_expiration: true,
        statut_formation: true,
        utilisateur: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { date_delivrance: "desc" },
      take: 5,
    });

    // Récupération des événements à venir
    const upcomingEvents = await prisma.calendrier.findMany({
      where: {
        entrepriseId,
        date_heure: { gt: new Date() },
      },
      select: {
        id: true,
        titre: true,
        description: true,
        date_heure: true,
        statut: true,
        utilisateur: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { date_heure: "asc" },
      take: 5,
    });

    return NextResponse.json({
      statistiques: {
        totalUtilisateurs,
        totalEquipes,
        totalFormations,
        formationsExpirees,
        formationsAExpirer,
        utilisateursNonConfirmes,
        equipesNonConformes,
      },
      recentFormations,
      upcomingEvents,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
