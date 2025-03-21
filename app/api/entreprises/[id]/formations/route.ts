import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES } from "@/lib/rbac";

// GET /api/entreprises/:id/formations
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id: entrepriseId } = context.params;
  const { searchParams } = new URL(request.url);
  
  // Optional query parameters
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const obligatoire = searchParams.get("obligatoire");
  const status = searchParams.get("statut");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // Check user access - require admin role for formations
  const accessError = await checkAccess(request, entrepriseId, ROLES.ADMIN);
  if (accessError) return accessError;

  try {
    // Build filters
    const where: any = {
      entrepriseId,
    };

    // Add optional filters
    if (type) where.type_formation = type;
    if (userId) where.userId = userId;
    if (obligatoire !== null) where.obligatoire = obligatoire === "true";
    if (status) where.statut_formation = status;

    // Query formations with pagination
    const formations = await prisma.formation.findMany({
      where,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            equipeId: true,
            equipe: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
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
          utilisateur: {
            nom: "asc",
          },
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