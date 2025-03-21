import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES, getSessionUser } from "@/lib/rbac";

// GET /api/utilisateurs/:id/formations
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id: userId } = context.params;
  const { searchParams } = new URL(request.url);

  // Optional query parameters
  const type = searchParams.get("type");
  const statut = searchParams.get("statut");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  try {
    // First get the user to check the company access
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { entrepriseId: true }
    });

    if (!utilisateur) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Check user access to this company - require ADMIN for formations, except for self-access
    const currentUser = await getSessionUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }
    
    // Check if requesting own formations or is admin
    const isSelfRequest = currentUser.id === userId;
    const isAdmin = currentUser.role === ROLES.ADMIN;
    
    // Les représentants peuvent voir leurs propres formations, les admins peuvent voir toutes les formations
    if (!isSelfRequest && !isAdmin) {
      return NextResponse.json(
        { error: "Accès non autorisé aux formations de cet utilisateur" },
        { status: 403 }
      );
    }
    
    // Vérifier que l'utilisateur appartient à la même entreprise
    if (currentUser.entrepriseId !== utilisateur.entrepriseId) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette entreprise" },
        { status: 403 }
      );
    }

    // Build query filters
    const where: any = {
      userId,
    };

    // Add optional filters
    if (type) where.type_formation = type;
    if (statut) where.statut_formation = statut;

    // Query formations with pagination
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
      orderBy: [
        {
          date_expiration: "asc",
        },
        {
          nom: "asc",
        },
      ],
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.formation.count({
      where,
    });

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
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
} 