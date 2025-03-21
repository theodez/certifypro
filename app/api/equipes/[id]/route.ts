import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES, getSessionUser } from "@/lib/rbac";

// GET /api/equipes/:id
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    // First get the team to check the company access
    const equipe = await prisma.equipe.findUnique({
      where: { id },
      select: { entrepriseId: true, responsableId: true }
    });

    if (!equipe) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      );
    }

    // Check user access to this company
    const accessError = await checkAccess(request, equipe.entrepriseId, ROLES.REPRESENTANT);
    if (accessError) return accessError;

    // Get current user to determine access level
    const user = await getSessionUser();
    const isAdmin = user?.role === ROLES.ADMIN;
    const isResponsable = user?.id === equipe.responsableId;
    
    // Now get the full details
    const equipeDetails = await prisma.equipe.findUnique({
      where: { id },
      include: {
        responsable: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
        utilisateurs: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            statut_user: true,
            // Include sensitive information only for admins or team leaders
            ...(isAdmin || isResponsable
              ? {
                  telephone: true,
                  adresse: true,
                }
              : {}),
          },
          orderBy: {
            nom: "asc",
          },
        },
      },
    });

    return NextResponse.json(equipeDetails);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
} 