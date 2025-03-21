import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES, getSessionUser } from "@/lib/rbac";

// GET /api/entreprises/:id/utilisateurs
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id: entrepriseId } = context.params;
  const { searchParams } = new URL(request.url);
  
  // Optional query parameters
  const role = searchParams.get("role");
  const equipeId = searchParams.get("equipeId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // Check user access
  const accessError = await checkAccess(request, entrepriseId, ROLES.REPRESENTANT);
  if (accessError) return accessError;

  // Get the current user to determine what level of detail to show
  const user = await getSessionUser();
  const isAdmin = user?.role === ROLES.ADMIN;

  try {
    // Build filters
    const where: any = {
      entrepriseId,
    };

    // Add optional filters
    if (role) where.role = role;
    if (equipeId) where.equipeId = equipeId;

    // Query utilisateurs with pagination
    const utilisateurs = await prisma.utilisateur.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        equipeId: true,
        statut_user: true,
        // Include sensitive data only for admins
        ...(isAdmin
          ? {
              telephone: true,
              adresse: true,
              num_securite_sociale: true,
            }
          : {}),
        // Include associated team information
        equipe: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.utilisateur.count({
      where,
    });

    return NextResponse.json({
      utilisateurs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
} 