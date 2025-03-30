import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES, getSessionUser } from "@/lib/rbac";

// GET /api/utilisateurs/:id/formations
export async function GET(request: NextRequest) {
  // Extraction de l'ID utilisateur depuis l'URL
  const userId = request.nextUrl.pathname.split("/").at(-2);

  if (!userId) {
    return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
  }

  try {
    // Récupérer l'utilisateur pour vérifier l'accès à l'entreprise
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { entrepriseId: true },
    });

    if (!utilisateur) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier l'accès utilisateur
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isSelfRequest = currentUser.id === userId;
    const isAdmin = currentUser.role === ROLES.ADMIN;

    // Seuls l'utilisateur lui-même ou un admin peuvent voir les formations
    if (!isSelfRequest && !isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Vérifier que l'utilisateur appartient bien à la même entreprise
    if (currentUser.entrepriseId !== utilisateur.entrepriseId) {
      return NextResponse.json({ error: "Accès interdit à cette entreprise" }, { status: 403 });
    }

    // Extraction des paramètres de requête
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const statut = searchParams.get("statut");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Construction des filtres
    const where: any = { userId };
    if (type) where.type_formation = type;
    if (statut) where.statut_formation = statut;

    // Récupération des formations avec pagination
    const formations = await prisma.formation.findMany({
      where,
      include: {
        organisme: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: [{ date_expiration: "asc" }, { nom: "asc" }],
      skip,
      take: limit,
    });

    // Nombre total d'éléments pour la pagination
    const total = await prisma.formation.count({ where });

    return NextResponse.json({
      formations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des formations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
